// app.js

const express = require('express');
const { followers_bucket, bucket_average, Point, writeApi, queryApi, writeAverageBucketApi } = require('./influxdb');

const PORT = 3004;

const app = express();
app.use(express.json());

// posting in batches
app.post('/write', async (req, res) => {
    try {
        const body = req.body;
        for (let influencer_data of body) {
            const influencer_id = influencer_data["influencer_id"]

            // 1. Write to main bucket (original follower_count)
            for (let item of influencer_data["data"]) {
                const isoString = item["timestamp"];
                const newValue = item["follower_count"];

                const point = new Point("follower_count")
                    .tag("influencer_id", influencer_id)
                    .intField("value", newValue)
                    .timestamp(new Date(isoString));
                // console.log("writing", point);
                writeApi.writePoint(point);

              // 2. Read from "average_count" bucket
              const fluxQuery = `
                import "influxdata/influxdb/schema"
                from(bucket: "${bucket_average}")
                  |> range(start: -365d)
                  |> filter(fn: (r) => r._measurement == "follower_avg")
                  |> filter(fn: (r) => r.influencer_id == "${influencer_id}")
                  |> last()
              `;

              let prevAvg = null, prevCount = null;

              await new Promise((resolve, reject) => {
                queryApi.queryRows(fluxQuery, {
                  next(row, tableMeta) {
                    const obj = tableMeta.toObject(row);
                    if (obj._field === "average") prevAvg = obj._value;
                    else if (obj._field === "total_entries") prevCount = obj._value;
                  },
                  error(error) {
                    console.error("🔴 Error fetching average:", error);
                    reject(error);
                  },
                  complete() {
                    console.log("✅ Query complete:", { prevAvg, prevCount });
                    resolve();
                  },
                });
              });

              let newAvg, newCount;

              if (prevAvg === null || prevCount === null) {
                // First entry for this influencer
                newAvg = newValue;
                newCount = 1;
              } else {
                newCount = prevCount + 1;
                newAvg = ((prevAvg * prevCount) + newValue) / newCount;
              }

              // 3. Write updated average to "average_count" bucket
              const avgPoint = new Point("follower_avg")
                .tag("influencer_id", influencer_id)
                .floatField("average", newAvg)
                .intField("total_entries", newCount)
                .timestamp(new Date(isoString)); // or new Date() if you prefer
              console.log(">>writing avg point ", avgPoint);
              writeAverageBucketApi.writePoint(avgPoint);

            }
        }
        console.log("flushing the write buffer");
        await writeApi.flush();
    
        res.status(200).json({ message: 'Point written successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to write point' });
    }
});

/**
 * Main API to be exposed
 */
app.get('/influencer/:id/timeline', async (req, res) => {
    const influencerId = req.params.id;
    const now = new Date();
    
  
    const fluxQuery = `
      from(bucket: "${followers_bucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r._measurement == "follower_count")
        |> filter(fn: (r) => r.influencer_id == "${influencerId}")
        |> filter(fn: (r) => r._field == "value")
        |> yield(name: "follower_count")
    `;
  
    try {
      const results = [];
      await queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const obj = tableMeta.toObject(row);
          results.push({
            timestamp: obj._time,
            follower_count: parseInt(obj._value)
          });
        },
        error(error) {
          console.error('Query failed', error);
          res.status(500).json({ error: 'InfluxDB query failed' });
        },
        complete() {
          res.json({
            influencer_id: influencerId,
            timeline: results
          });
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});
  
app.listen(PORT, () => {
    console.log(`✅ InfluxDB writer API running at http://localhost:${PORT}`);
});

// // Write a data point
// const point = new Point('follower_count')
//   .tag('influencer_id', 'abc123')
//   .intField('value', 660)
//   .timestamp(new Date());

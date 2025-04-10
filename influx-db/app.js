// app.js

const express = require('express');
const { bucket, Point, writeApi, queryApi } = require('./influxdb');

const PORT = 3004;

const app = express();
app.use(express.json());

// posting in batches
app.post('/write', async (req, res) => {
    try {
        const body = req.body;
        for (let influencer_data of body) {
            const influencer_id = influencer_data["influencer_id"]

            for (let item of influencer_data["data"]) {
                const isoString = item["timestamp"];
                const point = new Point("follower_count")
                    .tag("influencer_id", influencer_id)
                    .intField("value", item["follower_count"])
                    .timestamp(new Date(isoString));
                console.log("writing", point);
                writeApi.writePoint(point);
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
      from(bucket: "${bucket}")
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

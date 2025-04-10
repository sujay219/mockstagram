const { Kafka } = require('kafkajs');
const axios = require('axios');

const kafka = new Kafka({ clientId: 'poller', brokers: ['localhost:9092'] });
const producer = kafka.producer();

async function sendMetrics(influencerId) {
  try {
    const res = await axios.get(`http://localhost:3000/api/v1/influencers/${influencerId}`);
    const { followerCount, followingCount } = res.data;

    const message = {
      influencer_id: influencerId,
      follower_count: followerCount,
      following_count: followingCount,
      fetched_at: new Date().toISOString(),
    };

    await producer.send({
      topic: 'influencer.metrics',
      messages: [{ value: JSON.stringify(message) }],
    });

    console.log("sending ", JSON.stringify(message));

    console.log(`✅ Sent data for influencer ${influencerId}`);
  } catch (err) {
    console.error(`❌ Error polling influencer ${influencerId}:`, err.message);
  }
}

async function run() {
  console.log("initilizing producer..")
  await producer.connect();
  console.log("initilized producer..")

  const influencerIds = ['1000006', '1000007', '1000008'];

  setInterval(() => {
    influencerIds.forEach(sendMetrics);
  }, 60_000);
}

run();

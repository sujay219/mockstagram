const { Kafka } = require('kafkajs');
const fs = require('fs');
// Replace with your actual DB logic
const db = require('./db');
const { retryMechanism } = require('./readError');

const kafka = new Kafka({ clientId: 'consumer', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'metrics-group' });

let failureCount = 0
async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'influencer.metrics', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const payload = JSON.parse(message.value.toString());
      console.log(`📥 Received:`, payload);
      try {
        // const {influencer_id, follower_count, fetched_at } = payload
        await db.saveFollowerSnapshot(payload);
      } catch(err) {

        if (failureCount > 50) {
          const successes = retryMechanism();
          if (successes == -1) {
            console.error("Raise an SEVERE error.")
          }
          failureCount -= successes
          console.log("failure counts are now reduced by", successes);
        }
        console.error(`❌ failed write`, err.message);

        // Or write to a local error log file:
        fs.appendFileSync('errors.log', JSON.stringify(payload) + '\n');
      }
    },
  });
}

// retryMechanism();
run();

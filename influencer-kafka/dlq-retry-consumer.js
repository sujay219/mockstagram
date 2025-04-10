const { Kafka } = require('kafkajs');
const db = require('./db');

const kafka = new Kafka({ clientId: 'dlq-retry', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'dlq-retry-group' });
const producer = kafka.producer();

const MAX_RETRIES = 3;

async function run() {
  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: 'influencer.metrics.dlq', fromBeginning: true });

  let failureCount = 0;

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { payload, error, retries = 0 } = JSON.parse(message.value.toString());
      console.log(`♻️ Retrying failed message:`, payload);

      try {
        await db.saveFollowerSnapshot(payload);
        console.log(`✅ Retry successful`);
      } catch (err) {
        failureCount++;
        console.error(`❌ Retry failed (${retries + 1}):`, err.message);

        if (retries + 1 < MAX_RETRIES) {
          await producer.send({
            topic: 'influencer.metrics.dlq',
            messages: [{
              value: JSON.stringify({
                payload,
                error: err.message,
                retries: retries + 1
              })
            }],
          });
        } else {
          console.error(`🚫 Discarding message after ${MAX_RETRIES} attempts`);
          // Optional: write to permanent error store (file/db/etc)
        }
      }
    }
  });
}

run();

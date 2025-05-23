// influxdb.js
const { InfluxDB, Point } = require('@influxdata/influxdb-client');

// Replace these with your actual values:
const url = 'http://localhost:8086';
const API_KEY = "G2KmwyMKR-y86MVTw3CEexGC6OdGN5UFbkSyKq7xFhI-GFMw4UjaGXpHhQZwvUwsK7tplfpEFIK0bPyqXlBqIg=="
const token = API_KEY;
const org = 'sujay';
const bucket_followers = 'followers';
const bucket_average = "average_bucket";

const client = new InfluxDB({ url, token });
const writeApi = client.getWriteApi(org, bucket_followers);
const writeAverageBucketApi = client.getWriteApi(org, bucket_average);
const queryApi = client.getQueryApi(org);

module.exports = {
  Point,
  bucket_followers,
  bucket_average,
  writeApi,
  queryApi,
  writeAverageBucketApi
};

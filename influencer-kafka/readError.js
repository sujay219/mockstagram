
const fs = require('fs');
const db = require('./db');
const logFilePath = './error.log';

async function retryMechanism() {
    console.log(`[⏱️] Retrying failed logs at ${new Date().toISOString()}`);
  
    try {
      const fileData = fs.readFileSync(logFilePath, 'utf-8');
      const lines = fileData.split('\n').filter(Boolean);
  
      if (lines.length < 1) {
        console.log('[ℹ️] No failed logs to retry.');
        return;
      }
  
      let successCount = 0;
      let failedLines = [];
  
      for (const line of lines) {
        try {
          const payload = JSON.parse(line);
          await db.saveFollowerSnapshot(payload);
          successCount++;
        } catch (err) {
          // If it fails again, keep the line for later retry
          failedLines.push(line);
          console.error(`[❌] Retry failed for payload: ${line} | Error: ${err.message}`);
        }
      }
  
      // Rewrite error.log with only failed lines
      fs.writeFileSync(logFilePath, failedLines.join('\n') + (failedLines.length ? '\n' : ''));
  
      console.log(`[✅] Retried ${lines.length}, Success: ${successCount}, Failed: ${failedLines.length}`);
      return successCount
    } catch (err) {
      console.error(`[🚨] Could not process error.log: ${err.message}`);
    }
    return -1
}

function preparePayloadFromErrorLog() {
    const raw = fs.readFileSync(logFilePath, 'utf8');
    const lines = raw.trim().split('\n');
    const grouped = {};
  
    for (const line of lines) {
      const entry = JSON.parse(line);
      const id = entry.influencer_id;
      const timestamp = entry.fetched_at;
      const follower_count = entry.follower_count;
  
      if (!grouped[id]) {
        grouped[id] = [];
      }
  
      grouped[id].push({
        timestamp,
        follower_count
      });
    }
  
    const payload = Object.entries(grouped).map(([influencer_id, data]) => ({
      influencer_id,
      data,
    }));
  
    return payload;
  }

  

module.exports = { retryMechanism, preparePayloadFromErrorLog };
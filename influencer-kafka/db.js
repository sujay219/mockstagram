const axios = require('axios');
/**
 * 
 * @param {*} input
 * {
  influencer_id: '1000008',
  follower_count: 7606,
  following_count: 1883,
  fetched_at: '2025-04-10T16:03:29.964Z'
} 
 * @returns 
 */
function convertSingleItemToPayload(input) {
  console.log("input", input);
  return [
    {
      influencer_id: input.influencer_id,
      data: [
        {
          timestamp: input.fetched_at,
          follower_count: input.follower_count
        }
      ]
    }
  ]
}

/**
 * Sends follower snapshot to local HTTP endpoint at port 3004
 * @param {string} influencerId
 * @param {number} followerCount
 */
async function saveFollowerSnapshot(params) {
  try {
    const influencerId = params
    let payload = {}
    if (Array.isArray(params)) {
        // TODO implement batch 
      
    } else {
      payload = convertSingleItemToPayload(params)
    }
    console.log("payload", payload)

    const response = await axios.post('http://localhost:3004/write', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ Saved follower data for ${influencerId}:`, response.status);
  } catch (err) {
    console.error('❌ Error saving follower snapshot:', err.message);
  }
}

module.exports = { saveFollowerSnapshot };

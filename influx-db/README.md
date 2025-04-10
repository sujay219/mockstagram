# Run the main file

node app.js

Two main APIs are exposed:

GET /influencer/1000007/timeline

// This can be used to add the data in chunk, for now it is making single calls
POST /write
    body [{
        "influencer_id": "10000004",
        "data": [
            {
                "timestamp": "2025-04-10T15:55:00Z",
                "follower_count": 302
            },
            {
                "timestamp": "2025-04-10T15:19:00Z",
                "follower_count": 922
            }
        ]
    },
    {
        "influencer_id": "10000005",
        "data": [
            {
                "timestamp": "2025-04-10T15:55:00Z",
                "follower_count": 152
            },
            {
                "timestamp": "2025-04-10T15:19:00Z",
                "follower_count": 922
            }
        ]
    }]
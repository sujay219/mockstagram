

## Producer
Start with:

node producer.js

This will keep on polling the URL every minute for the influencer_ids provided.


## Consumer
Start with:
node consumer.js

This will receive the polling request and write into the 'error.log' file.
once the failureCount reaches 50. it will write everything in batches together. 


# db.js
This will call the database
# mockstagram

architecture.txt basically contains what we will need.

Coding logic has 3 components:

- influencer-kafka
  now this has three components, producer, consumer and batch processor 

- influx-db:
    Now, as per the current implementation we are only pushing one at a time. But logic can easily be modified to accomodate multiple batches of input at once.

- follower-graph-app
    This is not integrated. But just for the demo purpose I have directly polled the master data to display, front end was optional so havent spent much time here.
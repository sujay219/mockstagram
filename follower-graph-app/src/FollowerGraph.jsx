import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const FollowerGraph = ({ influencerId }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/v1/influencers/${influencerId}`);
        const json = await res.json();

        const newFollowers = json.follower_count;
        const total = data.reduce((sum, point) => sum + point.followers, 0) + newFollowers;
        const avg = total / (data.length + 1);

        const newPoint = {
          time: new Date().toLocaleString('en-US', {
            year: 'numeric',  month: 'short',  day: 'numeric',
            hour: 'numeric',  minute: '2-digit',  hour12: true,  timeZone: 'UTC'
          }),
          followers: newFollowers,
          averageFollowers: Math.round(avg)
        };

        setData((prev) => [...prev.slice(-59), newPoint]); // last 60 points
      } catch (err) {
        console.error(`Error fetching influencer ${influencerId}:`, err);
      }
    };

    fetchData(); // immediate
    const interval = setInterval(fetchData, 10_000); // every minute

    return () => clearInterval(interval);
  }, [influencerId]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Influencer {influencerId}</h2>
      <LineChart width={500} height={300} data={data}>
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <CartesianGrid stroke="#ccc" />
        <Line type="monotone" dataKey="followers" stroke="#8884d8" />
      </LineChart>
    </div>
  );
};

export default FollowerGraph;

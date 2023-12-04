const express = require('express');
const path = require('path');
const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.on('connect', function() {
    console.log('Connected to Redis Cloud...');
});


const apiRoutes = require('./routes/apiRoutes')(redisClient);  // Import the API routes
const taRoutes = require('./routes/taRoutes')(redisClient); 
const h2hRoutes = require('./routes/h2hRoutes')(redisClient); 
const luRoutes = require('./routes/luRoutes')(redisClient); 

const app = express();
const PORT = 3001;

app.use('/api/ta', taRoutes);
app.use('/api/h2h', h2hRoutes);
app.use('/api/lu', luRoutes);
app.use('/api', apiRoutes);  // Use the API routes

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'client/build')));

// Anything that doesn't match the above routes, send back the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

app.listen(process.env.PORT || PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT || PORT}`);
});

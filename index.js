const express = require('express');
const path = require('path');
const NodeCache = require( "node-cache" );

const apiRoutes = require('./routes/apiRoutes');  // Import the API routes
const taRoutes = require('./routes/taRoutes'); 
const h2hRoutes = require('./routes/h2hRoutes'); 
const luRoutes = require('./routes/luRoutes'); 

const app = express();
const PORT = 3001;
require('dotenv').config();
// Initialize cache
const nodeCache = new NodeCache();

app.use((req, res, next) => {
    req.cache = nodeCache;
    next();
});

// Load teamData into the cache
// TODO: Change this to use mongoDB
const loadTeamDataIntoCache = async () => {
    const fs = require('fs');
    const teamDataPath = './lib/teamData.json';
    const stats = fs.statSync(teamDataPath);
    const fileSizeInBytes = stats.size;
    const fileSizeInKilobytes = fileSizeInBytes / 1024/1024;
    console.log(`Loading teamData.json into cache. File size: ${fileSizeInKilobytes.toFixed(2)} MB`);
    const teamData = require(teamDataPath);

    // Create a map for faster lookups
    let playerMap = new Map();
    teamData.forEach(player => {
        const playerName = player.playerName.toLowerCase();
        if (!playerMap.has(playerName)) {
            playerMap.set(playerName, []);
        }
        playerMap.get(playerName).push(player);
    });

    await nodeCache.set('TeamID-Data', playerMap);
    console.log("Loading teamData.json into cache completed.")
};

loadTeamDataIntoCache();

// Log memory usage every minute only on dev testing
if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
        const memoryUsage = process.memoryUsage();
        const cacheSize = nodeCache.keys().length;
        console.log(`Memory usage: RSS = ${(memoryUsage.rss / 1024 / 1024).toFixed(1)} MB, Heap Total = ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(1)} MB, Heap Used = ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB, External = ${(memoryUsage.external / 1024 / 1024).toFixed(1)} MB, Cache Size = ${cacheSize}`);
    }, 60000);
}

// Add a 200 OK response route to check if the backend is live
app.get('/status', (req, res) => {
    res.status(200).send('Backend is live');
});

// Add a route to download the teamData.json file
app.get('/teamData', (req, res) => {
    res.download('./lib/teamData.json');
});

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
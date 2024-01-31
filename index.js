const express = require('express');
const path = require('path');
const NodeCache = require("node-cache");
const ua = require('universal-analytics'); // Added this line

const apiRoutes = require('./routes/apiRoutes');  // Import the API routes
const taRoutes = require('./routes/taRoutes');
const h2hRoutes = require('./routes/h2hRoutes');
const luRoutes = require('./routes/luRoutes');

const app = express();
const PORT = 3001;

const { getEventStatus } = require('./lib/fplAPIWrapper');

require('dotenv').config();
// Initialize cache
const nodeCache = new NodeCache();

app.use((req, res, next) => {
    req.cache = nodeCache;
    next();
});

// Added this middleware to track all requests
app.use((req, res, next) => {
    const visitor = ua(process.env.GA_KEY); // Replace 'UA-XXXX-Y' with your tracking ID
    visitor.pageview({
        dp: req.originalUrl, // Path
        dt: req.method + ' ' + req.originalUrl, // Title
        ua: req.headers['user-agent'], // User Agent
        uip: req.ip, // IP Address
    }).send();
    next();
});

// Log memory usage every minute only on dev testing
if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
        const memoryUsage = process.memoryUsage();
        const cacheSize = nodeCache.keys().length;
        console.log(`Memory usage: RSS = ${(memoryUsage.rss / 1024 / 1024).toFixed(1)} MB, Heap Total = ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(1)} MB, Heap Used = ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB, External = ${(memoryUsage.external / 1024 / 1024).toFixed(1)} MB, Cache Size = ${cacheSize}`);
    }, 60000);
}

// Add a 200 OK response route to check if the backend is live
let lastLiveTime = Date.now();
app.get('/status', async (req, res) => {
    const apiData = await getEventStatus(req);

    if (!apiData.apiLive) {
        const currentTime = Date.now();
        const timeSinceLastLive = currentTime - lastLiveTime;
        const maxFPLDownTime = 60 * 60 * 1000; 
        console.log(`Time since last live: ${timeSinceLastLive}`);
        if (timeSinceLastLive >= maxFPLDownTime) {
            return res.status(500).send('FPL API is down');
        }
    } else {
        lastLiveTime = Date.now();
    }

    res.status(200).send('Backend is live');
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
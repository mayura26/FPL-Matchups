// FIXME: Make this a call to identify if the API is working and return error to screen if it isn't and disable the go button on the home page.
// FIXME: Cache the bootstrap data locally
// FIXME: Get GW status from bootstrap to see if it is finished or not

module.exports = (redisClient) => {
    const express = require('express');
    const axios = require('axios');

    const router = express.Router();


    // Middleware to check cache
    const checkCache = (req, res, next) => {
        const key = 'current-gameweek';
        redisClient.get(key, (err, data) => {
            if (err) throw err;

            if (data != null) {
                res.json({ currentGameweek: JSON.parse(data), source: 'cache' });
            } else {
                next();
            }
        });
    };

    router.get('/current-gameweek', checkCache, async (req, res) => {
        try {
            const bootstrapResponse = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/', {
                headers: {
                    'User-Agent': 'FPL-Website/1.0'
                }
            });

            try {
                const currentGameweek = bootstrapResponse.data.events.find(event => event.is_current).id;
                // Set data to Redis with an expiration time (e.g., 3600 seconds for 1 hour)
                redisClient.setex('current-gameweek', 60, JSON.stringify(currentGameweek));
                res.json({ currentGameweek, source: 'api' });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to fetch current gameweek' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to connect to FPL API' });
        }
    });

    return router;
};

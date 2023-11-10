const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/current-gameweek', async (req, res) => {
    try {
        const bootstrapResponse = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/', {
            headers: {
                'User-Agent': 'FPL-Website/1.0'
            }
        });
        try {
            const currentGameweek = bootstrapResponse.data.events.find(event => event.is_current).id;
        res.json({ currentGameweek });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch current gameweek' });
        }
    } catch (error) {
        console.log(error.response.data);
        console.error(error);
        res.status(500).json({ error: 'Failed to connect to FPL API' });
    }
});

module.exports = router;
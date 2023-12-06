const express = require('express');
const axios = require('axios');
const router = express.Router();
const { getBootstrapData } = require('../cacheData');

const getGameData = (data) => {
    const currentGameweek = data.events.find(event => event.is_current).id;
    const isFinished = data.events.find(event => event.is_current).finished;
    return { currentGameweek, isFinished };
}

router.get('/game-data', async (req, res) => {

    const bootstrapData = await getBootstrapData(req);
    const gameData = getGameData(bootstrapData.data);

    res.json({ data: gameData, source: bootstrapData.source, apiLive: bootstrapData.apiLive });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { getBootstrapData, checkTeamID } = require('../lib/fplAPIWrapper');

const getGameData = (data) => {
    const currentGameweek = data.events.find(event => event.is_current).id;
    const isFinished = data.events.find(event => event.is_current).finished;
    return { currentGameweek, isFinished };
}

router.get('/game-data', async (req, res) => {

    const bootstrapData = await getBootstrapData(req);
    let gameData = [];
    if (bootstrapData.apiLive) {
        gameData = getGameData(bootstrapData.data);
    }

    res.json({ data: gameData, source: bootstrapData.source, apiLive: bootstrapData.apiLive });
});

module.exports = router;

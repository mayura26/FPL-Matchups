const express = require('express');
const router = express.Router();
const { getBootstrapData, getEventStatus } = require('../lib/fplAPIWrapper');

const getGameData = (data) => {
    const currentGameweek = data.events.find(event => event.is_current).id;
    const isFinished = data.events.find(event => event.is_current).finished;
    return { currentGameweek, isFinished };
}

router.get('/game-data', async (req, res) => {

    const bootstrapData = await getBootstrapData(req);
    const gameweekStatus = await getEventStatus(req);

    let gameData = [];
    if (bootstrapData.apiLive && gameweekStatus.apiLive) {
        gameData = getGameData(bootstrapData.data);
    } else {
        bootstrapData.apiLive = false;
    }

    res.json({ data: gameData, source: bootstrapData.source, apiLive: bootstrapData.apiLive });
});

module.exports = router;

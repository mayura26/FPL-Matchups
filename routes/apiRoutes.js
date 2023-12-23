const express = require('express');
const router = express.Router();
const { getBootstrapData, getEventStatus } = require('../lib/fplAPIWrapper');
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://user:mEvw6XKnfgFl3YM5@cluster0.mneoc9t.mongodb.net/FPLMatchups?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to MongoDB Atlas");
});

const playerSchema = new mongoose.Schema({
  teamid: Number,
  playername: String,
  teamname: String,
  rank: Number
}, { collection: 'teamData' });

const Player = mongoose.model('Player', playerSchema);

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

router.get('/find-player/:playername', async (req, res) => {
    const playerName = req.params.playername;
    if (!/^[a-z0-9\s]+$/i.test(playerName)) {
        return res.status(400).json({ message: `Invalid playername. Must be alphanumeric` });
    }
    try {
        const playerData = await Player.find({ playerName: new RegExp(playerName, 'i') }).limit(50);

        if (playerData.length > 0) {
            res.json({ data: playerData, message: 'success' });
        } else {
            res.json({ data: [], message: 'no matches' });
        }
    } catch (error) {
        console.log(`Error searching for playername. playerName: ${playerName}`);
        console.error(error);
    }    
});

module.exports = router;

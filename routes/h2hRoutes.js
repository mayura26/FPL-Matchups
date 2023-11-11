const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/leagues/:teamId', async (req, res) => {
    try {
      const teamId = req.params.teamId;
      const response = await axios.get(`https://fantasy.premierleague.com/api/entry/${teamId}/`);
      // Assuming the leagues are in the response.data.leagues.h2h path
      res.json(response.data.leagues.h2h);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching leagues', error });
    }
  });

  router.get('/leagues/:leagueId/:gameWeek', async (req, res) => {
    try {
        const leagueId = req.params.leagueId;
        const gameWeek = req.params.gameWeek;

        // Fetch league details from FPL API
        const leagueData = await axios.get(`https://fantasy.premierleague.com/api/leagues-h2h-matches/league/${leagueId}/?event=${gameWeek}`);
        res.json(leagueData.data.results);
    } catch (error) {
        console.error('Error fetching H2H matchups:', error);
        res.status(500).send('Internal Server Error');
    }
});

  module.exports = router;
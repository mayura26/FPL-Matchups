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

  module.exports = router;
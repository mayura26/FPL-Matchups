const express = require('express');
const axios = require('axios');

const router = express.Router();

// Endpoint to get all leagues for a team by team ID
router.get('/team-leagues/:teamId', async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const response = await axios.get(`https://fantasy.premierleague.com/api/entry/${teamId}/`);
    // Filter out leagues with more than 30 teams
    const smallLeagues = response.data.leagues.classic.filter(league => (league.entry_can_leave || league.entry_can_admin));
    res.json(smallLeagues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leagues', error });
  }
});

// Endpoint to get information on all teams in a league for a specific gameweek including their transfers
router.get('/league-teams/:leagueId/:gameWeek', async (req, res) => {
  try {
    const leagueId = req.params.leagueId;
    const gameWeek = req.params.gameWeek;

    // Fetch league details from FPL API
    const leagueDetails = await axios.get(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`);
    const teams = leagueDetails.data.standings.results;

    // Fetch additional details for each transfer
    const bootstrapResponse = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/');
    const playersInfo = bootstrapResponse.data.elements;
    const teamsMap = bootstrapResponse.data.teams.reduce((acc, team) => {
      acc[team.id] = team.name;
      return acc;
    }, {});

    const transfersPromises = teams.map(team =>
      axios.get(`https://fantasy.premierleague.com/api/entry/${team.entry}/transfers/`).then(response => {
        const gameweekTransfers = response.data.filter(transfer => transfer.event === parseInt(gameWeek));
        if (gameweekTransfers.length === 0) {
          return null; // Handle case with no transfers
        }
        return { managerName: team.player_name, teamName: team.entry_name, position: team.rank, transfers: gameweekTransfers };
      })
    );

    const transfersDetails = await Promise.all(transfersPromises);

    // Filter out the null values after the promises have been resolved
    const validTransfersDetails = transfersDetails.filter(details => details !== null);
    const enrichedTransfers = await Promise.all(validTransfersDetails.map(async transfer => {
      const playerTransfers = await Promise.all(transfer.transfers.map(async t => {
        const playerIn = playersInfo.find(p => p.id === t.element_in);
        const playerOut = playersInfo.find(p => p.id === t.element_out);
        return {
          playerIn: {
            name: playerIn.web_name,
            club: teamsMap[playerIn.team],
            value: t.element_in_cost
          },
          playerOut: {
            name: playerOut.web_name,
            club: teamsMap[playerOut.team],
            value: t.element_out_cost
          }
        };
      }));
      return {
        managerName: transfer.managerName,
        teamName: transfer.teamName,
        position: transfer.position,
        transfers: playerTransfers
      };
    }));

    res.json(enrichedTransfers);
  } catch (error) {
    console.error('Error fetching league teams:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
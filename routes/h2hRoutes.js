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

// Endpoint to get player details for two teams
router.get('/team-matchup/:team1Id/:team2Id/:gameweek', async (req, res) => {
  const { team1Id, team2Id, gameweek } = req.params;

  try {
    const matchupData = await fetchTeamMatchupData(team1Id, team2Id, parseInt(gameweek));
    res.json(matchupData);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

const fetchTeamMatchupData = async (team1Id, team2Id, gameweek) => {
  try {
    // Step 1: Fetch general information
    const bootstrapResponse = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/');
    const playersInfo = bootstrapResponse.data.elements;
    const teamsMap = bootstrapResponse.data.teams.reduce((acc, team) => {
      acc[team.id] = team.name;
      return acc;
    }, {});
    // Map for element types (positions)
    const elementTypesMap = bootstrapResponse.data.element_types.reduce((acc, type) => {
      acc[type.id] = type.singular_name_short; // or type.singular_name for full name
      return acc;
    }, {});

    // Helper function to get team details
    const getTeamDetails = async (teamID) => {
      const teamResponse = await axios.get(`https://fantasy.premierleague.com/api/entry/${teamID}/event/${gameweek}/picks/`);
      const playerStartingIDs = teamResponse.data.picks.filter(pick => pick.position <= 11).map(pick => pick.element);
      const playerBenchIDs = teamResponse.data.picks.filter(pick => pick.position > 11).map(pick => pick.element);

      // Step 2: Fetch team details
      const teamPlayers = playersInfo.filter(player => playerStartingIDs.includes(player.id));

      // Step 3: Enrich player details
      const detailedPlayers = await Promise.all(teamPlayers.map(async player => {
        const playerDetailResponse = await axios.get(`https://fantasy.premierleague.com/api/element-summary/${player.id}/`);
        const gameWeekData = playerDetailResponse.data.history.find(history => history.round === gameweek);

        return {
          id: player.id,
          name: player.web_name,
          teamName: teamsMap[player.team],
          position: elementTypesMap[player.element_type], // You might want to map this to a string (e.g., 'Forward', 'Midfielder')
          gameWeekScore: gameWeekData ? gameWeekData.total_points : 0
        };
      }));
      // TODO: Create gameweek score from all players who have played or are playing
      
      return detailedPlayers;
    };

    // Fetch details for both teams
    const team1Details = await getTeamDetails(team1Id);
    const team2Details = await getTeamDetails(team2Id);

    return { team1Details, team2Details };
  } catch (error) {
    console.error('Error fetching data from FPL API:', error);
    throw error;
  }
};

module.exports = router;
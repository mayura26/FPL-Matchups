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
      const captainId = teamResponse.data.picks.find(pick => pick.is_captain).element;
      const viceCaptainId = teamResponse.data.picks.find(pick => pick.is_vice_captain).element;

      // Step 2: Fetch team details
      const teamStartingPlayers = playersInfo.filter(player => playerStartingIDs.includes(player.id));
      const teamBenchPlayers = playersInfo.filter(player => playerBenchIDs.includes(player.id));

      // Step 3: Enrich player details
      const startingPlayers = await getPlayerDetails(teamStartingPlayers, captainId, viceCaptainId);
      const benchPlayers = await getPlayerDetails(teamBenchPlayers, captainId, viceCaptainId);

      return { startingPlayers, benchPlayers };

      async function getPlayerDetails(players, captainId, viceCaptainId) {
        return await Promise.all(players.map(async (player) => {
          const playerDetailResponse = await axios.get(`https://fantasy.premierleague.com/api/element-summary/${player.id}/`);
          const gameWeekData = playerDetailResponse.data.history.find(history => history.round === gameweek);

          // Get current date/time in UTC
          const now = new Date();
          const currentTimeUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

          // Parse the kickoff time as UTC
          const kickoffTimeUTC = new Date(gameWeekData.kickoff_time).getTime(); // This is already in UTC
          const twoHoursAfterKickoff = kickoffTimeUTC + (2 * 60 * 60 * 1000); // Adding 2 hours (in milliseconds) to the kickoff time
          const minutesPlayed = gameWeekData.minutes;
          let playedStatus;
          // TODO: Create logic for if player is potentially playing but on the bench
          if (currentTimeUTC > kickoffTimeUTC) {
            if (minutesPlayed >= 90 || currentTimeUTC > twoHoursAfterKickoff) {
              if (minutesPlayed == 0 && currentTimeUTC > twoHoursAfterKickoff) {
                playedStatus = "unplayed";
              } else {
                playedStatus = "played";
              }
            } else if (minutesPlayed > 0) {
              playedStatus = "playing";
            }
          }
          else {
            playedStatus = "notplayed";
          }

          let captainStatus = 'N';
          if (player.id === captainId) {
            captainStatus = 'C';
          } else if (player.id === viceCaptainId) {
            captainStatus = 'VC';
          }
          // TODO: Update gameweek total points to be a summation of all the events that give the score so then bonus can be added [HARD]
          return {
            id: player.id,
            name: player.web_name,
            teamName: teamsMap[player.team],
            position: elementTypesMap[player.element_type],
            gameWeekScore: gameWeekData ? gameWeekData.total_points : 0,
            playStatus: playedStatus,
            captainStatus: captainStatus
          };
        }));
      }
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
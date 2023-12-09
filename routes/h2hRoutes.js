const express = require('express');
const { getBootstrapData, getMaps, getTeamGWData, getTeamData, getPlayerData, getLeaguesH2HGWData } = require('../lib/fplAPIWrapper');
const router = express.Router();

router.get('/leagues/:teamId', async (req, res) => {
  try {
    const teamID = req.params.teamId;
    const response = await getTeamData(req, teamID);

    res.json({ data: response.data.leagues.h2h, source: response.source, apiLive: response.apiLive });
  } catch (error) {
    console.log("Error getting TeamID-H2HLeagues info");
    console.error(error);
  }
});

router.get('/leagues/:leagueId/:gameWeek', async (req, res) => {
  try {
    const leagueID = req.params.leagueId;
    const gameweek = req.params.gameWeek;
    const leagueData = await getLeaguesH2HGWData(req, leagueID, gameweek);
    res.json({ data: leagueData.data.results, source: leagueData.source, apiLive: leagueData.apiLive });
  } catch (error) {
    console.log("Error getting TeamID-H2H-GW info");
    console.error(error);
  }
});

// Endpoint to get player details for two teams
router.get('/team-matchup/:team1Id/:team2Id/:gameweek', async (req, res) => {
  const { team1Id, team2Id, gameweek } = req.params;

  try {
    const bootstrapData = await getBootstrapData(req);
    const dataMap = await getMaps(bootstrapData);
    const matchupData = await fetchTeamMatchupData(req, team1Id, team2Id, parseInt(gameweek), bootstrapData, dataMap);
    res.json({ data: matchupData, source: bootstrapData.source, apiLive: bootstrapData.apiLive });
  } catch (error) {
    console.log("Error getting TeamID-H2H-Matchup info");
    console.error(error);
  }
});

const fetchTeamMatchupData = async (req, team1Id, team2Id, gameweek, bootstrapData, dataMap) => {
  try {
    // Step 1: Fetch general information
    const playersInfo = bootstrapData.data.elements;

    // Helper function to get team details
    const getTeamDetails = async (teamID) => {
      const teamResponse = await getTeamGWData(req, teamID, gameweek);
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
          const playerDetailResponse = await getPlayerData(req, player.id);
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
            teamName: dataMap.teams[player.team],
            position: dataMap.positions[player.element_type],
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
    console.error('Error generating matchup data', error);
    throw error;
  }
};

module.exports = router;
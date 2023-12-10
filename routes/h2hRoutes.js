const express = require('express');
const { getBootstrapData, getMaps, getTeamGWData, getTeamData, getPlayerData, getLeaguesH2HStandingsData, getLeaguesH2HGWData } = require('../lib/fplAPIWrapper');
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
    const leagueStandings = await getLeaguesH2HStandingsData(req, leagueID);
    const calculateTotalPoints = async (req, teamData, gameweek) => {
      const teamPlayerStartingIDs = teamData.data.picks.filter(pick => pick.position <= 11).map(pick => pick.element);
      const captainId = teamData.data.picks.find(pick => pick.is_captain).element;
      const viceCaptainId = teamData.data.picks.find(pick => pick.is_vice_captain).element;
      let totalPoints = 0;
      let captainPlayed = false;

      // Get current date/time in UTC
      const now = new Date();
      const currentTimeUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
      for (let playerID of teamPlayerStartingIDs) {
        // FIXME:  Switch to use this API https://fantasy.premierleague.com/api/event/{GW}/live/
        const playerData = await getPlayerData(req, playerID);
        const gameWeekData = playerData.data.history.filter(history => history.round == gameweek);
        let playersPoints = 0;
        // Allow for double GW
        for (let match of gameWeekData) {
          totalPoints += match.total_points;
        }

        if (playerID == captainId) {
          for (let match of gameWeekData) {
            // Parse the kickoff time as UTC
            const kickoffTimeUTC = new Date(match.kickoff_time).getTime(); // This is already in UTC
            const twoHoursAfterKickoff = kickoffTimeUTC + (2 * 60 * 60 * 1000); // Adding 2 hours (in milliseconds) to the kickoff time

            if (match.minutes == 0 && currentTimeUTC > twoHoursAfterKickoff) {
              captainPlayed = false;
            }
            else {
              totalPoints += match.total_points;
              captainPlayed = true;
            }
          }
        }
      }

      // If captain didn't play, add vice captain's points
      if (!captainPlayed) {
        const viceCaptainData = await getPlayerData(req, viceCaptainId);
        const viceCaptainGameWeekData = viceCaptainData.data.history.filter(history => history.round == gameweek);
        for (let match of viceCaptainGameWeekData) {
          totalPoints += match.total_points;
        }
      }

      // Subtract any penalty points (hits) from the total points
      totalPoints -= teamData.data.entry_history.event_transfers_cost;

      return totalPoints;
    }

    // For each team in the league, get all the players in the person's starting lineup
    for (let matchUp of leagueData.data.results) {
      const team1Data = await getTeamGWData(req, matchUp.entry_1_entry, gameweek);
      const team2Data = await getTeamGWData(req, matchUp.entry_2_entry, gameweek);

      // Sum the points scored by all the players in the team
      const team1Points = await calculateTotalPoints(req, team1Data, gameweek);
      const team2Points = await calculateTotalPoints(req, team2Data, gameweek);

      // Update the team's total points
      matchUp.entry_1_livepoints = team1Points;
      matchUp.entry_2_livepoints = team2Points;
    }

    // Get data for each manager
    const managerData = {};
    for (let manager of leagueStandings.data.standings.results) {
      managerData[manager.entry] = {
        rank: manager.rank,
        points: manager.points_for,
        matches_won: manager.matches_won,
        matches_drawn: manager.matches_drawn,
        matches_lost: manager.matches_lost
      };
    }

    res.json({
      data: {
        results: leagueData.data.results,
        managerData: managerData
      },
      source: leagueData.source,
      apiLive: leagueData.apiLive
    });
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
          // TODO: [HARD] Create logic for if player is potentially playing but on the bench
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

          // TODO: [HARD] Update gameweek total points to be a summation of all the events that give the score so then bonus can be added. Consider hits when calculating live score
          return {
            id: player.id,
            name: player.web_name,
            teamName: dataMap.teams[player.team],
            position: dataMap.positions[player.element_type],
            price: player.now_cost / 10,
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
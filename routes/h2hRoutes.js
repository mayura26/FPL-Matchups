const express = require('express');
const { getBootstrapData, getMaps, getTeamGWData, getTeamData, getGWLiveData, getPlayerData, getLeaguesH2HStandingsData, getLeaguesH2HGWData, calculateBPS } = require('../lib/fplAPIWrapper');
const router = express.Router();
const { getPlayerInfo } = require('../lib/generalFunc');

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
    const gwLive = await getGWLiveData(req, gameweek);
    const bpsData = await calculateBPS(req);
    const bootstrapData = await getBootstrapData(req);
    const playersInfo = bootstrapData.data.elements;

    bpsData.data.forEach(player => {
      player.name = playersInfo.find(playerI => playerI.id === player.element).web_name;
    })

    const calculateTotalPoints = async (req, teamData, gameweek) => {
      if (teamData.data.picks) {
        const teamPlayerStartingIDs = teamData.data.picks.filter(pick => pick.position <= 11).map(pick => pick.element);
        const captainId = teamData.data.picks.find(pick => pick.is_captain).element;
        const viceCaptainId = teamData.data.picks.find(pick => pick.is_vice_captain).element;
        let totalPoints = 0;
        let captainPlayed = false;

        // Get current date/time in UTC
        const now = new Date();
        const currentTimeUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
        for (let playerID of teamPlayerStartingIDs) {
          const playerData = await getPlayerData(req, playerID);
          const gameWeekData = playerData.data.history.filter(history => history.round == gameweek);
          const gameWeekLiveData = gwLive.data.elements.find(element => element.id === playerID);

          let bonusPoints = 0;
          const playerBonus = bpsData.data.find(bpsPlayer => bpsPlayer.element === playerID);
          if (playerBonus) {
            bonusPoints = playerBonus.bonusPoints;
          }
          const gameweekPoints = gameWeekLiveData ? gameWeekLiveData.stats.total_points + bonusPoints : 0;

          // Allow for double GW
          totalPoints += gameweekPoints;

          if (playerID == captainId) {
            let match = gameWeekData[gameWeekData.length - 1];
            const kickoffTimeUTC = new Date(match.kickoff_time).getTime(); // This is already in UTC
            const twoHoursAfterKickoff = kickoffTimeUTC + (2 * 60 * 60 * 1000); // Adding 2 hours (in milliseconds) to the kickoff time

            // Check if the match is the last one in the array
            if (match.minutes == 0 && currentTimeUTC > twoHoursAfterKickoff) {
              captainPlayed = false;
            }
            else {
              totalPoints += gameWeekLiveData.stats.total_points;
              captainPlayed = true;
            }
          }

        }

        // If captain didn't play, add vice captain's points
        if (!captainPlayed) {
          const gameWeekLiveData = gwLive.data.elements.find(element => element.id === viceCaptainId);
          totalPoints += gameWeekLiveData.stats.total_points;
        }

        // Subtract any penalty points (hits) from the total points
        totalPoints -= teamData.data.entry_history.event_transfers_cost;

        return totalPoints;
      } else {
        return 0;
      }
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
        managerData: managerData,
        bpsData: bpsData
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
    console.log(`Error getting TeamID-H2H-Matchup info. Team1ID: ${team1Id} Team2ID: ${team2Id}`);
    console.error(error);
  }
});

// Endpoint to get player details for two teams
router.get('/player-matchup/:playerID', async (req, res) => {
  const { playerID } = req.params;

  try {
    const bootstrapData = await getBootstrapData(req);
    const dataMap = await getMaps(bootstrapData);
    const playerData = bootstrapData.data.elements.find(player => player.id == playerID);
    const playerInfo = await getPlayerInfo(req, playerData, dataMap);
    res.json({
      data: playerInfo, source: bootstrapData.source, apiLive: bootstrapData.apiLive
    });
  } catch (error) {
    console.log(`Error getting TeamID-H2H-PlayerMatchup info. PlayerID: ${playerID}`);
    console.error(error);
  }
});

const fetchTeamMatchupData = async (req, team1Id, team2Id, gameweek, bootstrapData, dataMap) => {
  try {
    // Step 1: Fetch general information
    const playersInfo = bootstrapData.data.elements;
    const gwLive = await getGWLiveData(req, gameweek);
    const bpsData = await calculateBPS(req);

    bpsData.data.forEach(player => {
      player.name = playersInfo.find(playerI => playerI.id === player.element).web_name;
    })

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
          const gameWeekLiveData = gwLive.data.elements.find(element => element.id === player.id);
          const gameWeekData = playerDetailResponse.data.history.filter(history => history.round === gameweek);
          const finalMatch = gameWeekData[gameWeekData.length - 1];

          // Get current date/time in UTC
          const now = new Date();
          const currentTimeUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

          // Parse the kickoff time as UTC
          const kickoffTimeUTC = new Date(finalMatch.kickoff_time).getTime(); // This is already in UTC
          const twoHoursAfterKickoff = kickoffTimeUTC + (2 * 60 * 60 * 1000); // Adding 2 hours (in milliseconds) to the kickoff time
          const minutesPlayed = finalMatch.minutes;
          let playedStatus;

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

          // TODO: [HARD] Create logic for if player is potentially playing but on the bench
          let subStatus = 'N';
          const subInStatus = teamResponse.data.automatic_subs.find(pick => pick.element_in === player.id);
          const subOutStatus = teamResponse.data.automatic_subs.find(pick => pick.element_out === player.id);
          if (subInStatus) {
            subStatus = 'In';
          } else if (subOutStatus) {
            subStatus = 'Out';
          }

          let bonusPoints = 0;
          const playerBonus = bpsData.data.find(bpsPlayer => bpsPlayer.element === player.id);
          if (playerBonus) {
            bonusPoints = playerBonus.bonusPoints;
          }
          const gameweekPoints = gameWeekLiveData ? gameWeekLiveData.stats.total_points + bonusPoints : 0;

          return {
            id: player.id,
            name: player.web_name,
            teamName: dataMap.teams[player.team],
            position: dataMap.positions[player.element_type],
            price: player.now_cost / 10,
            gameWeekScore: gameweekPoints,
            playStatus: playedStatus,
            captainStatus: captainStatus,
            pickPosition: teamResponse.data.picks.find(pick => pick.element === player.id).position,
            subStatus: subStatus
          };
        }));
      }
    };

    // Fetch details for both teams
    const team1Details = await getTeamDetails(team1Id);
    const team2Details = await getTeamDetails(team2Id);

    return { team1Details, team2Details, bpsData };
  } catch (error) {
    console.error('Error generating matchup data', error);
    throw error;
  }
};

module.exports = router;
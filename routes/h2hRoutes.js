const express = require('express');
const { getBootstrapData, getMaps, getTeamGWData, getTeamData, getGWLiveData, getPlayerData, getLeaguesH2HStandingsData, getLeaguesH2HGWData, calculateBPS, getFixtureData } = require('../lib/fplAPIWrapper');
const router = express.Router();
const { getPlayerInfo } = require('../lib/playerInfo');

router.get('/leagues/:teamId', async (req, res) => {
  try {
    const teamID = req.params.teamId;
    // Check if teamID is a valid number
    if (isNaN(teamID)) {
      return res.status(400).json({ error: `Invalid teamId parameter. It must be a number. TeamID: ${teamID}` });
    }
    const response = await getTeamData(req, teamID);
    const leagues = response.data.leagues ? response.data.leagues.h2h : [];

    res.json({ data: leagues, source: response.source, apiLive: response.apiLive });
  } catch (error) {
    console.log(`Error getting TeamID-H2HLeagues info. TeamID: ${req.params.teamId}`);
    console.error(error);
  }
});

router.get('/leagues/:leagueId/:gameWeek', async (req, res) => {
  try {
    const leagueID = req.params.leagueId;
    const gameweek = req.params.gameWeek;
    if (isNaN(leagueID)) {
      return res.status(400).json({ error: `Invalid leagueID parameter. It must be a number. LeagueID: ${leagueID}` });
    }
    if (isNaN(gameweek)) {
      return res.status(400).json({ error: `Invalid gameweek parameter. It must be a number. Gameweek: ${gameweek}` });
    }
    const leagueData = await getLeaguesH2HGWData(req, leagueID, gameweek);
    const leagueStandings = await getLeaguesH2HStandingsData(req, leagueID);
    const bpsData = await calculateBPS(req);
    const bootstrapData = await getBootstrapData(req);

    if (!bootstrapData || !bootstrapData.data) {
      console.error('bootstrapData or bootstrapData.data is undefined');
      return res.status(500).json({ error: 'Failed to fetch data from the API' });
    }

    const playersInfo = bootstrapData.data.elements;
    const dataMap = await getMaps(bootstrapData);
    const fixtureData = await getFixtureData(req, gameweek);

    bpsData.data.forEach(player => {
      player.name = playersInfo.find(playerI => playerI.id === player.element).web_name;
      player.team = dataMap.teamsShort[dataMap.teams[playersInfo.find(playerI => playerI.id === player.element).team]];
      player.fixture = `${dataMap.teams[fixtureData.data.find(fix => fix.id === player.fix)?.team_h]} ${fixtureData.data.find(fix => fix.id === player.fix)?.team_h_score}-${fixtureData.data.find(fix => fix.id === player.fix)?.team_a_score} ${dataMap.teams[fixtureData.data.find(fix => fix.id === player.fix)?.team_a]}`;
    })

    const calculateTotalPoints = async (teamDetails) => {
      if (!teamDetails || !teamDetails.startingPlayers || !teamDetails.benchPlayers) {
        console.error('Failed to get teamdetails to calculate points');
        return 0; // or throw an error, or return a suitable default value
      }
      
      let totalPoints = 0;
      teamDetails.startingPlayers.forEach(detail => {
        totalPoints += detail.gameWeekScore;
      });

      let captain = teamDetails.startingPlayers.find(player => player.captainStatus === 'C');
      let viceCaptain = teamDetails.startingPlayers.find(player => player.captainStatus === 'VC');

      // If captain or vice-captain is not found in the starting players, check the bench
      if (!captain) {
        captain = teamDetails.benchPlayers.find(player => player.captainStatus === 'C');
      }
      if (!viceCaptain) {
        viceCaptain = teamDetails.benchPlayers.find(player => player.captainStatus === 'VC');
      }

      if (captain.playStatus !== 'unplayed') {
        totalPoints += captain.gameWeekScore;
      } else if (viceCaptain) {
        totalPoints += viceCaptain.gameWeekScore;
      }
      // Subtract any penalty points (hits) from the total points
      totalPoints -= teamDetails.transferCost;

      // Add points from bench players who have a substatus of 'In'
      teamDetails.benchPlayers.forEach(player => {
        if (player.subStatus === 'In') {
          totalPoints += player.gameWeekScore;
        }
      });

      return totalPoints;
    }

    // For each team in the league, get all the players in the person's starting lineup
    for (let matchUp of leagueData.data.results) {
      if (matchUp.entry_1_entry && matchUp.entry_2_entry) {
        const key = `${matchUp.entry_1_entry}-${matchUp.entry_2_entry}-${gameweek}`;
        const cachedData = req.cache.get(key);
        let matchupData = [];
        if (cachedData) {
          matchupData = cachedData;
        } else {
          matchupData = await fetchTeamMatchupData(req, matchUp.entry_1_entry, matchUp.entry_2_entry, parseInt(gameweek), bootstrapData, dataMap);
        }

        // Sum the points scored by all the players in the team
        const team1Points = await calculateTotalPoints(matchupData.team1Details);
        const team2Points = await calculateTotalPoints(matchupData.team2Details);

        // Update the team's total points
        matchUp.entry_1_livepoints = team1Points;
        matchUp.entry_2_livepoints = team2Points;
      }
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
    console.log(`Error getting TeamID-H2H-GW info. LeagueID: ${req.params.leagueId} Gameweek: ${req.params.gameWeek}`);
    console.error(error);
  }
});

// Endpoint to get player details for two teams
router.get('/team-matchup/:team1Id/:team2Id/:gameweek', async (req, res) => {
  const { team1Id, team2Id, gameweek } = req.params;
  if (isNaN(team1Id)) {
    return res.status(400).json({ error: `Invalid team1Id parameter. It must be a number. Team1Id: ${team1Id}` });
  }
  if (isNaN(team2Id)) {
    return res.status(400).json({ error: `Invalid team2Id parameter. It must be a number. Team2Id: ${team2Id}` });
  }
  if (isNaN(gameweek)) {
    return res.status(400).json({ error: `Invalid gameweek parameter. It must be a number. Gameweek: ${gameweek}` });
  }

  if (team1Id && team2Id) {
    try {
      const bootstrapData = await getBootstrapData(req);

      if (!bootstrapData || !bootstrapData.data) {
        console.error('bootstrapData or bootstrapData.data is undefined');
        return res.status(500).json({ error: 'Failed to fetch data from the API' });
      }

      const dataMap = await getMaps(bootstrapData);

      const key = `${team1Id}-${team2Id}-${gameweek}`;
      const cachedData = req.cache.get(key);
      let matchupData = [];
      if (cachedData) {
        matchupData = cachedData;
      } else {
        matchupData = await fetchTeamMatchupData(req, team1Id, team2Id, parseInt(gameweek), bootstrapData, dataMap);
      }

      res.json({ data: matchupData, source: bootstrapData.source, apiLive: bootstrapData.apiLive });
    } catch (error) {
      console.log(`Error getting TeamID-H2H-Matchup info. Team1ID: ${team1Id} Team2ID: ${team2Id}`);
      console.error(error);
    }
  }
});

// Endpoint to get player details for two teams
router.get('/player-matchup/:playerID', async (req, res) => {
  const { playerID } = req.params;

  if (isNaN(playerID)) {
    return res.status(400).json({ error: `Invalid playerID parameter. It must be a number. PlayerID: ${playerID}` });
  }

  try {
    const bootstrapData = await getBootstrapData(req);

    if (!bootstrapData || !bootstrapData.data) {
      console.error('bootstrapData or bootstrapData.data is undefined');
      return res.status(500).json({ error: 'Failed to fetch data from the API' });
    }

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
    if (!bootstrapData || !bootstrapData.data) {
      console.error('bootstrapData or bootstrapData.data is undefined');
      return { error: 'Failed to fetch data from the API' };
    }

    // Step 1: Fetch general information
    const playersInfo = bootstrapData.data.elements;
    const gwLive = await getGWLiveData(req, gameweek);
    const bpsData = await calculateBPS(req);

    if (!gwLive || !gwLive.data) {
      console.error('gwLive or gwLive.data is undefined');
      return { error: 'Failed to fetch data from the API' };
    }

    // Helper function to get team details
    const getTeamDetails = async (teamID) => {
      try {
        const teamResponse = await getTeamGWData(req, teamID, gameweek);

        if (!teamResponse || !teamResponse.data || !teamResponse.data.picks) {
          throw new Error(`Invalid team response for team ID ${teamID}`);
        }

        const playerStartingIDs = teamResponse.data.picks.filter(pick => pick.position <= 11).map(pick => pick.element);
        const playerBenchIDs = teamResponse.data.picks.filter(pick => pick.position > 11).map(pick => pick.element);
        // Step 2: Fetch team details
        const teamStartingPlayers = playersInfo.filter(player => playerStartingIDs.includes(player.id));
        const teamBenchPlayers = playersInfo.filter(player => playerBenchIDs.includes(player.id));

        // Step 3: Enrich player details
        const startingPlayers = await getPlayerDetails(teamStartingPlayers, teamResponse);
        const unsortedBenchPlayers = await getPlayerDetails(teamBenchPlayers, teamResponse);
        const transferCost = teamResponse.data.entry_history.event_transfers_cost;

        // Sort the benchPlayers arrays based on the pick position
        const benchPlayers = unsortedBenchPlayers.sort((a, b) => a.pickPosition - b.pickPosition);

        // Do auto subs by checking starting players for subs
        startingPlayers.forEach((player) => {
          // If the player hasn't played, set their subStatus to 'Out'
          if (player.playStatus === 'unplayed') {
            player.subStatus = 'Out';
            // Find a player in benchPlayers to sub in
            for (let j = 0; j < benchPlayers.length; j++) {
              // If the bench player hasn't played, set their subStatus to 'In' and break the loop
              if (benchPlayers[j].playStatus !== 'unplayed' && benchPlayers[j].subStatus !== 'In') {
                // Check if the number of players in each position does not go below the minimum requirement
                const numGoalkeepers = startingPlayers.filter(p => p.position === 'GKP').length - (player.position === 'GKP' ? 1 : 0) + (benchPlayers[j].position === 'GKP' ? 1 : 0);
                const numDefenders = startingPlayers.filter(p => p.position === 'DEF').length - (player.position === 'DEF' ? 1 : 0) + (benchPlayers[j].position === 'DEF' ? 1 : 0);
                const numMidfielders = startingPlayers.filter(p => p.position === 'MID').length - (player.position === 'MID' ? 1 : 0) + (benchPlayers[j].position === 'MID' ? 1 : 0);
                const numForwards = startingPlayers.filter(p => p.position === 'FWD').length - (player.position === 'FWD' ? 1 : 0) + (benchPlayers[j].position === 'FWD' ? 1 : 0);

                if (numGoalkeepers === 1 && numDefenders >= 3 && numMidfielders >= 2 && numForwards >= 1) {
                  benchPlayers[j].subStatus = 'In';
                  break;
                }
              }
            }
          }
        });

        return { startingPlayers, benchPlayers, transferCost };
      } catch (error) {
        console.error(`Error generating matchup data. TeamID: ${teamID}`, error);
        throw error;
      }

      async function getPlayerDetails(players, teamResponse) {
        return await Promise.all(players.map(async (player) => {
          const playerDetailResponse = await getPlayerData(req, player.id);
          const gameWeekLiveData = gwLive.data.elements.find(element => element.id === player.id);
          const gameWeekData = playerDetailResponse.data.history.filter(history => history.round === gameweek);
          const finalMatch = gameWeekData[gameWeekData.length - 1];
          const captainId = teamResponse.data.picks.find(pick => pick.is_captain).element;
          const viceCaptainId = teamResponse.data.picks.find(pick => pick.is_vice_captain).element;

          // Get current date/time in UTC
          const now = new Date();
          const currentTimeUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

          // Parse the kickoff time as UTC
          let kickoffTimeUTC;
          let minutesPlayed = 0;
          if (finalMatch) {
            kickoffTimeUTC = new Date(finalMatch.kickoff_time).getTime(); // This is already in UTC
            minutesPlayed = finalMatch.minutes;
          } else {
            kickoffTimeUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
          }
          const twoHoursAfterKickoff = kickoffTimeUTC + (2 * 60 * 60 * 1000); // Adding 2 hours (in milliseconds) to the kickoff time

          let playedStatus;
          // FEATURE: [4] Check fixtures and if player not in squad, then set to unplayed. If final match = today, and team is in this array of fixturesquads.
          if (currentTimeUTC > kickoffTimeUTC) {
            if (minutesPlayed >= 90 || currentTimeUTC > twoHoursAfterKickoff) {
              if (minutesPlayed == 0 && currentTimeUTC > twoHoursAfterKickoff) {
                playedStatus = "unplayed";
              } else {
                playedStatus = "played";
              }
            } else if (minutesPlayed > 0) {
              playedStatus = "playing";
            } else if (currentTimeUTC - kickoffTimeUTC >= 5 * 60 * 1000) {
              playedStatus = "benched";
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

    return { team1Details, team2Details };
  } catch (error) {
    console.error(`Error generating matchup data. Team1ID: ${team1Id} Team2ID: ${team2Id} Gameweek: ${gameweek}`, error);
    throw error;
  }
};

module.exports = router;
const express = require('express');
const { getBootstrapData, getMaps, getGameData, getTeamData, getGWLiveData, getLeaguesH2HStandingsData, getLeaguesH2HGWData, generateFixData, getFixtureData, validateApiResponse } = require('../lib/fplAPIWrapper');
const router = express.Router();
const { getPlayerInfo, calculateTotalPoints, calculatePredictedPoints, getTeamDetails } = require('../lib/teamPlayerData');

router.get('/leagues/:teamId', async (req, res) => {
  try {
    const teamID = req.params.teamId;
    // Check if teamID is a valid number
    if (isNaN(teamID)) {
      return res.status(400).json({ error: `Invalid teamId parameter. It must be a number. TeamID: ${teamID}` });
    }
    const response = await getTeamData(req, teamID);
    const leagues = response.data.leagues ? response.data.leagues.h2h : [];
    for (let league of leagues) {
      const leagueData = await getLeaguesH2HStandingsData(req, league.id);
      league.numberOfTeams = leagueData.data.standings ? leagueData.data.standings.results.length : 0;
    }

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
    const fixtureData = await getFixtureData(req, gameweek);
    const fixData = await generateFixData(req);

    const bootstrapData = await getBootstrapData(req);
    if (!validateApiResponse(bootstrapData) || !validateApiResponse(leagueData) || !validateApiResponse(leagueStandings) || !validateApiResponse(fixtureData)) {
      console.error("Error getting FPL API data");
      return res.status(500).json({ data: [], apiLive: false });
    }

    const dataMap = await getMaps(bootstrapData);
    
    // For each team in the league, get all the players in the person's starting lineup
    for (let matchUp of leagueData.data.results) {
      if (matchUp.entry_1_entry && matchUp.entry_2_entry) {
        const key = `Matchup-${matchUp.entry_1_entry}-${matchUp.entry_2_entry}-${gameweek}`;
        const cachedData = req.cache.get(key);
        let matchupData = [];
        if (cachedData) {
          matchupData = cachedData;
        } else {
          matchupData = await fetchTeamMatchupData(req, matchUp.entry_1_entry, matchUp.entry_2_entry, parseInt(gameweek), bootstrapData, dataMap);
        }

        // Sum the points scored by all the players in the team
        let team1Points = 0;
        let team2Points = 0;
        let team1PredictedPoints = 0;
        let team2PredictedPoints = 0;
        if (matchupData.team1Details) {
          team1Points = await calculateTotalPoints(matchupData.team1Details);
          team1PredictedPoints = await calculatePredictedPoints(matchupData.team1Details);
        }

        if (matchupData.team2Details) {
          team2Points = await calculateTotalPoints(matchupData.team2Details);
          team2PredictedPoints = await calculatePredictedPoints(matchupData.team2Details);
        }
        // Update the team's total points
        matchUp.entry_1_livepoints = team1Points;
        matchUp.entry_2_livepoints = team2Points;
        matchUp.entry_1_livepredictedpoints = team1PredictedPoints;
        matchUp.entry_2_livepredictedpoints = team2PredictedPoints;
        matchUp.entry_1_teamDetails = matchupData.team1Details;
        matchUp.entry_2_teamDetails = matchupData.team2Details;

        // Calculate the difference percent between the two teams
        const team1StartingLineup = matchupData.team1Details.startingPlayers.map(player => player.id);
        const team2StartingLineup = matchupData.team2Details.startingPlayers.map(player => player.id);
        const totalPlayers = team1StartingLineup.length + team2StartingLineup.length;
        const commonPlayers = team1StartingLineup.filter(playerId => team2StartingLineup.includes(playerId));
        const differencePercent = ((totalPlayers - (2 * commonPlayers.length)) / totalPlayers) * 100;
        matchUp.differencePercent = differencePercent;
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
        fixData: fixData
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

      if (!validateApiResponse(bootstrapData)) {
        console.error("Error getting FPL API data");
        return res.status(500).json({ data: [], apiLive: false });
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

    if (!validateApiResponse(bootstrapData)) {
      console.error("Error getting FPL API data");
      return res.status(500).json({ data: [], apiLive: false });
    }

    const dataMap = await getMaps(bootstrapData);
    const gameData = getGameData(bootstrapData.data);
    const playerData = bootstrapData.data.elements.find(player => player.id == playerID);
    const playerInfo = await getPlayerInfo(req, playerData, dataMap, gameData);

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
    const gwLive = await getGWLiveData(req, gameweek);
    const fixData = await generateFixData(req);
    const fixtureData = await getFixtureData(req, gameweek);

    if (!validateApiResponse(bootstrapData) || !validateApiResponse(gwLive) || !validateApiResponse(fixtureData)) {
      console.error("Error getting FPL API data");
      return [];
    }

    // Fetch details for both teams
    const team1Details = await getTeamDetails(req, team1Id, gameweek, gwLive, fixtureData, fixData, bootstrapData, dataMap);
    const team2Details = await getTeamDetails(req, team2Id, gameweek, gwLive, fixtureData, fixData, bootstrapData, dataMap);

    return { team1Details, team2Details };
  } catch (error) {
    console.error(`Error generating matchup data. Team1ID: ${team1Id} Team2ID: ${team2Id} Gameweek: ${gameweek}`, error);
    throw error;
  }
};

module.exports = router;
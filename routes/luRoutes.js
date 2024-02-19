const express = require('express');
const { getBootstrapData, getMaps, getTeamTransferData, getTeamData, getLeagueClassicStandingsData, getFixtureData, getGWLiveData, generateFixData, validateApiResponse } = require('../lib/fplAPIWrapper');
const { calculateTotalPoints, getTeamDetails } = require('../lib/teamPlayerData');

const router = express.Router();

// Endpoint to get all leagues for a team by team ID
router.get('/team-leagues/:teamId', async (req, res) => {
  try {
    const teamID = req.params.teamId;

    if (isNaN(teamID)) {
      return res.status(400).json({ error: `Invalid teamId parameter. It must be a number. TeamID: ${teamID}` });
    }

    const response = await getTeamData(req, teamID);
    // Filter out public leagues
    const smallLeagues = response.data.leagues ? response.data.leagues.classic.filter(league => (league.league_type !== "s")) : [];

    for (let league of smallLeagues) {
      const leagueData = await getLeagueClassicStandingsData(req, league.id);
      league.numberOfTeams = leagueData.data.standings ? leagueData.data.standings.results.length : 0;
    }

    res.json({ data: smallLeagues, source: response.source, apiLive: response.apiLive });
  } catch (error) {
    console.log(`Error getting TeamLeagues-TeamID info. TeamID: ${req.params.teamId}`);
    console.error(error);
  }
});

// Endpoint to get information on all teams in a league for a specific gameweek including their transfers
router.get('/league-teams/:leagueId/:gameweek', async (req, res) => {
  try {
    const leagueId = req.params.leagueId;
    const gameweek = req.params.gameweek;

    if (isNaN(leagueId)) {
      return res.status(400).json({ error: `Invalid leagueId parameter. It must be a number. LeagueID: ${leagueId}` });
    }
    if (isNaN(gameweek)) {
      return res.status(400).json({ error: `Invalid gameweek parameter. It must be a number. Gameweek: ${gameweek}` });
    }

    const leagueDetails = await getLeagueClassicStandingsData(req, leagueId);
    const bootstrapData = await getBootstrapData(req);
    const gwLive = await getGWLiveData(req, gameweek);
    const fixData = await generateFixData(req);
    const fixtureData = await getFixtureData(req, gameweek);

    if (!validateApiResponse(bootstrapData) || !validateApiResponse(leagueDetails) || !validateApiResponse(gwLive) || !validateApiResponse(fixtureData)) {
      console.error("Error getting FPL API data");
      return res.status(500).json({ data: [], apiLive: false });
    }

    // Fetch league details from FPL API
    const teams = leagueDetails.data.standings.results.length > 50 ? leagueDetails.data.standings.results.slice(0, 50) : leagueDetails.data.standings.results;

    // Fetch additional details for each transfer
    const dataMap = await getMaps(bootstrapData);
    const playersInfo = bootstrapData.data.elements;

    const transferPromises = teams.map(async team =>
      await getTeamTransferData(req, team.entry).then(response => {

        if (!validateApiResponse(response)) {
          console.error("Error getting FPL API data");
          return res.status(500).json({ data: [], apiLive: false });
        }

        const gameweekTransfers = response.data.filter(transfer => transfer.event === parseInt(gameweek));
        return {
          managerName: team.player_name,
          teamName: team.entry_name,
          teamID: team.entry,
          position: team.rank,
          score: team.total,
          rankChange: team.last_rank - team.rank,
          transfers: gameweekTransfers
        };
      })
    );

    const transfersDetails = await Promise.all(transferPromises);

    // Filter out the null values after the promises have been resolved
    const teamData = await Promise.all(transfersDetails.map(async team => {
      const playerTransfers = await Promise.all(team.transfers.map(async t => {
        const playerIn = playersInfo.find(p => p.id === t.element_in);
        const playerOut = playersInfo.find(p => p.id === t.element_out);
        const playerInCount = transfersDetails.filter(detail => detail.transfers.some(transfer => transfer.element_in === t.element_in)).length;
        const playerOutCount = transfersDetails.filter(detail => detail.transfers.some(transfer => transfer.element_out === t.element_out)).length;
        return {
          playerIn: {
            id: playerIn.id,
            name: playerIn.web_name,
            club: dataMap.teamsShort[dataMap.teams[playerIn.team]],
            value: t.element_in_cost,
            transferCount: playerInCount
          },
          playerOut: {
            id: playerOut.id,
            name: playerOut.web_name,
            club: dataMap.teamsShort[dataMap.teams[playerOut.team]],
            value: t.element_out_cost,
            transferCount: playerOutCount
          }
        };
      }));
      const teamDetails = await getTeamDetails(req, team.teamID, parseInt(gameweek), gwLive, fixtureData, fixData, bootstrapData, dataMap);
      let teamPoints = 0;
      if (teamDetails) {
        teamPoints = await calculateTotalPoints(teamDetails);
      }
      return {
        managerName: team.managerName,
        teamName: team.teamName,
        teamID: team.teamID,
        position: team.position,
        score: team.score,
        rankChange: team.rankChange,
        transfers: playerTransfers,
        teamDetails: teamDetails,
        livescore: teamPoints
      };
    }));

    res.json({
      data: teamData.map((team) => ({
        ...team,
        liveRank: teamData.filter(t => t.score + t.livescore > team.score + team.livescore).length + 1
      })),
      fixData: fixData,
      source: bootstrapData.source,
      apiLive: bootstrapData.apiLive
    });
  } catch (error) {
    console.log(`Error getting TeamLeagues-LeagueID-GW info. LeagueID: ${req.params.leagueId} Gameweek: ${req.params.gameweek}`);
    console.error(error);
  }
});

module.exports = router;
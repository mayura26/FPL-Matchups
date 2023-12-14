const express = require('express');
const { getBootstrapData, getMaps, getTeamTransferData, getTeamData, getLeagueClassicStandingsData } = require('../lib/fplAPIWrapper');

const router = express.Router();

// Endpoint to get all leagues for a team by team ID
router.get('/team-leagues/:teamId', async (req, res) => {
  try {
    const teamID = req.params.teamId;
    const response = await getTeamData(req, teamID);
    // Filter out public leagues
    const smallLeagues = response.data.leagues.classic.filter(league => (league.entry_can_leave || league.entry_can_admin));
    res.json({ data: smallLeagues, source: response.source, apiLive: response.apiLive });
  } catch (error) {
    console.log("Error getting TeamLeagues-TeamID info");
    console.error(error);
  }
});

// Endpoint to get information on all teams in a league for a specific gameweek including their transfers
router.get('/league-teams/:leagueId/:gameWeek', async (req, res) => {
  try {
    const leagueId = req.params.leagueId;
    const gameWeek = req.params.gameWeek;

    // Fetch league details from FPL API
    const leagueDetails = await getLeagueClassicStandingsData(req, leagueId);
    const teams = leagueDetails.data.standings.results.length > 50 ? leagueDetails.data.standings.results.slice(0, 50) : leagueDetails.data.standings.results;

    // Fetch additional details for each transfer
    const bootstrapData = await getBootstrapData(req);
    const dataMap = await getMaps(bootstrapData);
    const playersInfo = bootstrapData.data.elements;

    const transfersPromises = teams.map(async team =>
      await getTeamTransferData(req, team.entry).then(response => {
        const gameweekTransfers = response.data.filter(transfer => transfer.event === parseInt(gameWeek));
        if (gameweekTransfers.length === 0) {
          return null; // Handle case with no transfers
        }
        return { 
          managerName: team.player_name, 
          teamName: team.entry_name, 
          teamID: team.entry, 
          position: team.rank,
          rankChange: team.last_rank - team.rank, 
          transfers: gameweekTransfers 
        };
      })
    );

    const transfersDetails = await Promise.all(transfersPromises);

    // Filter out the null values after the promises have been resolved
    const validTransfersDetails = transfersDetails.filter(details => details !== null);
    const enrichedTransfers = await Promise.all(validTransfersDetails.map(async transfer => {
      const playerTransfers = await Promise.all(transfer.transfers.map(async t => {
        const playerIn = playersInfo.find(p => p.id === t.element_in);
        const playerOut = playersInfo.find(p => p.id === t.element_out);
        const playerInCount = validTransfersDetails.filter(detail => detail.transfers.some(transfer => transfer.element_in === t.element_in)).length;
        const playerOutCount = validTransfersDetails.filter(detail => detail.transfers.some(transfer => transfer.element_out === t.element_out)).length;
        return {
          playerIn: {
            id: playerIn.id,
            name: playerIn.web_name,
            club: dataMap.teams[playerIn.team],
            value: t.element_in_cost,
            transferCount: playerInCount
          },
          playerOut: {
            id: playerOut.id,
            name: playerOut.web_name,
            club: dataMap.teams[playerOut.team],
            value: t.element_out_cost,
            transferCount: playerOutCount
          }
        };
      }));
      return {
        managerName: transfer.managerName,
        teamName: transfer.teamName,
        teamID: transfer.teamID, 
        position: transfer.position,
        rankChange: transfer.rankChange,
        transfers: playerTransfers
      };
    }));

    res.json({ data: enrichedTransfers, source: bootstrapData.source, apiLive: bootstrapData.apiLive });
  } catch (error) {
    console.log("Error getting TeamLeagues-LeagueID-GW info");
    console.error(error);
  }
});

module.exports = router;
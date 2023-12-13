const express = require('express');
const { getBootstrapData, getMaps, getTeamGWData, getTeamData, getPlayerData } = require('../lib/fplAPIWrapper');
const router = express.Router();

router.get('/:teamID/:gameweek', async (req, res) => {
    try {
        const { teamID, gameweek } = req.params;

        // Fetch general information (players and teams)
        const bootstrapData = await getBootstrapData(req);
        const dataMap = await getMaps(bootstrapData);

        // Fetch team details
        const teamResponse = await getTeamGWData(req, teamID, gameweek);
        // First, sort the picks array by position
        const sortedPicks = teamResponse.data.picks.sort((a, b) => a.position - b.position);

        // Then, extract the player IDs
        const startingPlayerIDs = sortedPicks.filter(pick => pick.position <= 11).map(pick => pick.element);
        const benchPlayerIDs = sortedPicks.filter(pick => pick.position > 11).map(pick => pick.element);

        const startingPlayers = bootstrapData.data.elements.filter(player => startingPlayerIDs.includes(player.id));
        const benchPlayers = bootstrapData.data.elements.filter(player => benchPlayerIDs.includes(player.id));

        // Create index maps for starting and bench player IDs
        const startingPlayerIndexMap = startingPlayerIDs.reduce((acc, id, index) => {
            acc[id] = index;
            return acc;
        }, {});

        const benchPlayerIndexMap = benchPlayerIDs.reduce((acc, id, index) => {
            acc[id] = index;
            return acc;
        }, {});

        // Sort the startingPlayers and benchPlayers arrays based on the index maps
        const sortedStartingPlayers = startingPlayers.sort((a, b) => startingPlayerIndexMap[a.id] - startingPlayerIndexMap[b.id]);
        const sortedBenchPlayers = benchPlayers.sort((a, b) => benchPlayerIndexMap[a.id] - benchPlayerIndexMap[b.id]);


        const teamInfoResponse = await getTeamData(req, teamID);

        // Extract manager's name, overall points, and overall rank from the response
        const managerName = `${teamInfoResponse.data.player_first_name} ${teamInfoResponse.data.player_last_name}`;
        const overallPoints = teamInfoResponse.data.summary_overall_points;
        const overallRank = teamInfoResponse.data.summary_overall_rank;

        // Enrich player details with past and upcoming fixtures
        const detailedStartingPlayers = await getPlayerInfo(sortedStartingPlayers, dataMap);
        const detailedBenchPlayers = await getPlayerInfo(sortedBenchPlayers, dataMap);

        // Construct the final response
        const responseData = {
            managerName,
            overallRank,
            overallPoints,  // Current gameweek score
            playersStarting: detailedStartingPlayers,
            playersBench: detailedBenchPlayers
        };

        res.json({ data: responseData, source: bootstrapData.source, apiLive: bootstrapData.apiLive });

    } catch (error) {
        console.log("Error getting TeamID-GW info");
        console.error(error);
    }

    async function getPlayerInfo(players, dataMap) {
        return await Promise.all(players.map(async (player) => {
            const playerDetailResponse = await getPlayerData(req, player.id);
            const currentGame = playerDetailResponse.data.history.slice(-1)[0];
            const nextGame = playerDetailResponse.data.fixtures[0];
            const oppositionNextTeam = nextGame.is_home ? nextGame.team_a : nextGame.team_h;

            return {
                name: player.web_name,
                teamName: dataMap.teamsShort[dataMap.teams[player.team]],
                currentGame: {
                    team: dataMap.teams[currentGame.opponent_team],
                    score: currentGame.total_points,
                    minutes: currentGame.minutes,
                    xGI: currentGame.expected_goal_involvements,
                    xGC: currentGame.expected_goals_conceded,
                    xG: currentGame.expected_goals,
                    xA: currentGame.expected_assists,
                    ICT: currentGame.ict_index,
                    xP: player.ep_this
                },
                upcomingGame: {
                    team: `${dataMap.teams[oppositionNextTeam]} ${nextGame.is_home ? '(H)' : '(A)'}`,
                    fdr: nextGame.difficulty,
                    xP: player.ep_next
                },
                position: dataMap.positions[player.element_type],
                cost: player.now_cost / 10,
                form: player.form,
                ICT: player.ict_index,

                last5Scores: playerDetailResponse.data.history.slice(-6, -1).reverse().map(game => {
                    const oppositionTeam = dataMap.teamsShort[dataMap.teams[game.opponent_team]];
                    return {
                        event: game.round,
                        score: `${game.total_points} (${oppositionTeam})`,
                        minutes: game.minutes,
                        fdr: game.difficulty,
                        xGI: game.expected_goal_involvements,
                        xGC: game.expected_goals_conceded,
                        xG: game.expected_goals,
                        xA: game.expected_assists,
                        ICT: game.ict_index
                    };
                }),
                next5Fixtures: playerDetailResponse.data.fixtures.slice(0, 5).map(fix => {
                    const oppositionTeam = fix.is_home ? fix.team_a : fix.team_h;
                    return {
                        event: fix.event,
                        fixture: `${dataMap.teamsShort[dataMap.teams[oppositionTeam]]} ${fix.is_home ? '(H)' : '(A)'}`,
                        fdr: fix.difficulty
                    };
                })
            };
        }));
    }
});

module.exports = router;
const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/:teamID/:gameweek', async (req, res) => {
    try {
        const { teamID, gameweek } = req.params;

        // Fetch general information (players and teams)
        const bootstrapResponse = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/');
        const teamsMap = bootstrapResponse.data.teams.reduce((acc, team) => {
            acc[team.id] = team.name;
            return acc;
        }, {});

        // Fetch team details
        const teamResponse = await axios.get(`https://fantasy.premierleague.com/api/entry/${teamID}/event/${gameweek}/picks/`);
        // First, sort the picks array by position
        const sortedPicks = teamResponse.data.picks.sort((a, b) => a.position - b.position);

        // Then, extract the player IDs
        const startingPlayerIDs = sortedPicks.filter(pick => pick.position <= 11).map(pick => pick.element);
        const benchPlayerIDs = sortedPicks.filter(pick => pick.position > 11).map(pick => pick.element);
        
        const startingPlayers = bootstrapResponse.data.elements.filter(player => startingPlayerIDs.includes(player.id));
        const benchPlayers = bootstrapResponse.data.elements.filter(player => benchPlayerIDs.includes(player.id));

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


        const teamInfoResponse = await axios.get(`https://fantasy.premierleague.com/api/entry/${teamID}/`);

        // Extract manager's name, overall points, and overall rank from the response
        const managerName = `${teamInfoResponse.data.player_first_name} ${teamInfoResponse.data.player_last_name}`;
        const overallPoints = teamInfoResponse.data.summary_overall_points;
        const overallRank = teamInfoResponse.data.summary_overall_rank;

        // Enrich player details with past and upcoming fixtures
        const detailedStartingPlayers = await getPlayerInfo(sortedStartingPlayers, teamsMap);
        const detailedBenchPlayers = await getPlayerInfo(sortedBenchPlayers, teamsMap);

        // Construct the final response
        const responseData = {
            managerName,
            overallRank,
            overallPoints,  // Current gameweek score
            playersStarting: detailedStartingPlayers,
            playersBench: detailedBenchPlayers
        };

        res.json(responseData);

    } catch (error) {
        console.error(error);
        console.log(error.response.data);
        res.status(500).json({ error: 'Failed to fetch data from FPL API' });
    }

    async function getPlayerInfo(players, teamsMap) {
        return await Promise.all(players.map(async (player) => {
            const playerDetailResponse = await axios.get(`https://fantasy.premierleague.com/api/element-summary/${player.id}/`);
            const currentGame = playerDetailResponse.data.history.slice(-1)[0];

            const teamShortMap = {
                "Arsenal" : "ARS",
                "Aston Villa" : "AVL",
                "Bournemouth" : "BOU",
                "Brentford" : "BRE",
                "Brighton" : "BHA",
                "Burnley" : "BUR",
                "Chelsea" : "CHE",
                "Crystal Palace" : "CRY",
                "Everton" : "EVE",
                "Fulham" : "FUL",
                "Liverpool" : "LIV",
                "Luton" : "LUT",
                "Man City" : "MCI",
                "Man Utd" : "MAN",
                "Newcastle" : "NEW",
                "Nott'm Forest" : "NFO",
                "Sheffield Utd" : "SHU",
                "Spurs" : "TOT",
                "West Ham" : "WHU",
                "Wolves" : "WOL"
            };

            return {
                name: player.web_name,
                teamName: teamsMap[player.team],
                // TODO: Update this to be correct depending on if its midweek or a gameweek
                currentFixture: `${teamsMap[currentGame.opponent_team]} (Score: ${currentGame.total_points})`,
                cost: player.now_cost / 10,

                // TODO: Fix last 5 scores to show correctly midweek
                last5Scores: playerDetailResponse.data.history.slice(-6, -1).reverse().map(game => {
                    const oppositionTeam = teamShortMap[teamsMap[game.opponent_team]];
                    return {
                        score: `${game.total_points} (${oppositionTeam})`,
                        fdr: game.difficulty // Extracting FDR from the 'difficulty' field
                    };
                }),
                next5Fixtures: playerDetailResponse.data.fixtures.slice(0, 5).map(fix => {
                    const oppositionTeam = fix.is_home ? fix.team_a : fix.team_h;
                    return {
                        event: fix.event,
                        fixture: teamShortMap[teamsMap[oppositionTeam]],
                        fdr: fix.difficulty
                    };
                })
            };
        }));
    }
});

module.exports = router;
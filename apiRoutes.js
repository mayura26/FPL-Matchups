const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/fpl/:teamID/:gameweek', async (req, res) => {
    try {
        const { teamID, gameweek } = req.params;

        // Fetch general information (players and teams)
        const bootstrapResponse = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/')
        .catch(error => {
            console.log(error.response.data);
        });
        const teamsMap = bootstrapResponse.data.teams.reduce((acc, team) => {
            acc[team.id] = team.name;
            return acc;
        }, {});

        // Fetch team details
        const teamResponse = await axios.get(`https://fantasy.premierleague.com/api/entry/${teamID}/event/${gameweek}/picks/`)
        .catch(error => {
            console.log(error.response.data);
        });
        const playerIDs = teamResponse.data.picks.map(pick => pick.element);
        const players = bootstrapResponse.data.elements.filter(player => playerIDs.includes(player.id));

        const teamInfoResponse = await axios.get(`https://fantasy.premierleague.com/api/entry/${teamID}/`)
        .catch(error => {
            console.log(error.response.data);
        });

        // Extract manager's name, overall points, and overall rank from the response
        const managerName = `${teamInfoResponse.data.player_first_name} ${teamInfoResponse.data.player_last_name}`;
        const overallPoints = teamInfoResponse.data.summary_overall_points;
        const overallRank = teamInfoResponse.data.summary_overall_rank;

        // Enrich player details with past and upcoming fixtures
        const detailedPlayers = await Promise.all(players.map(async player => {
        const playerDetailResponse = await axios.get(`https://fantasy.premierleague.com/api/element-summary/${player.id}/`)
        .catch(error => {
            console.log(error.response.data);
        });
        const currentGame = playerDetailResponse.data.history.slice(-1)[0];
        const currentFixtureTeam = playerDetailResponse.data.fixtures[0].is_home ? playerDetailResponse.data.fixtures[0].team_a : playerDetailResponse.data.fixtures[0].team_h;
            return {
                name: player.first_name + ' ' + player.second_name,
                teamName: teamsMap[player.team],
                currentFixture: `${teamsMap[currentFixtureTeam]} (Score: ${currentGame.total_points})`,
                cost: player.now_cost / 10,
                last5Scores: playerDetailResponse.data.history.slice(-6, -1).reverse().map(game => {
                    const oppositionTeam = teamsMap[game.opponent_team];
                    return {
                        score: `${game.total_points} (${oppositionTeam})`,
                        fdr: game.difficulty // Extracting FDR from the 'difficulty' field
                    };
                }),
                next5Fixtures: playerDetailResponse.data.fixtures.slice(1, 6).map(fix => {
                    const oppositionTeam = fix.is_home ? fix.team_a : fix.team_h;
                    return {
                        event: fix.event,
                        fixture: teamsMap[oppositionTeam],
                        fdr: fix.difficulty // Extracting FDR from the 'difficulty' field
                    };
                })
            };
        }));
        
        // Construct the final response
        const responseData = {
            managerName,
            overallRank,
            overallPoints,  // Current gameweek score
            players: detailedPlayers
        };

        res.json(responseData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data from FPL API' });
    }
});

router.get('/current-gameweek', async (req, res) => {
    try {
        const bootstrapResponse = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/')
        .catch(error => {
            console.log(error.response.data);
        });
        const currentGameweek = bootstrapResponse.data.events.find(event => event.is_current).id;
        res.json({ currentGameweek });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch current gameweek' });
    }
});

module.exports = router;
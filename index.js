const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3001;

app.get('/api/fpl/:teamID/:gameweek', async (req, res) => {
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
        const playerIDs = teamResponse.data.picks.map(pick => pick.element);
        const players = bootstrapResponse.data.elements.filter(player => playerIDs.includes(player.id));

        const teamInfoResponse = await axios.get(`https://fantasy.premierleague.com/api/entry/${teamID}/`);

        // Extract manager's name, overall points, and overall rank from the response
        const managerName = `${teamInfoResponse.data.player_first_name} ${teamInfoResponse.data.player_last_name}`;
        const overallPoints = teamInfoResponse.data.summary_overall_points;
        const overallRank = teamInfoResponse.data.summary_overall_rank;

        // Enrich player details with past and upcoming fixtures
        const detailedPlayers = await Promise.all(players.map(async player => {
            const playerDetailResponse = await axios.get(`https://fantasy.premierleague.com/api/element-summary/${player.id}/`);
            const currentFixtureTeam = playerDetailResponse.data.fixtures[0].is_home ? playerDetailResponse.data.fixtures[0].team_a : playerDetailResponse.data.fixtures[0].team_h;
            return {
                name: player.first_name + ' ' + player.second_name,
                teamName: teamsMap[player.team],
                currentFixture: teamsMap[currentFixtureTeam],
                cost: player.now_cost / 10,
                last5Scores: playerDetailResponse.data.history.slice(-5).map(game => {
                    const oppositionTeam = teamsMap[game.opponent_team];
                    return `${game.total_points} (${oppositionTeam})`;
                }),
                next5Fixtures: playerDetailResponse.data.fixtures.slice(1, 6).map(fix => {
                    const oppositionTeam = fix.is_home ? fix.team_a : fix.team_h;
                    return {
                        event: fix.event,
                        fixture: teamsMap[oppositionTeam]
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

app.get('/api/current-gameweek', async (req, res) => {
    try {
        const bootstrapResponse = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/');
        const currentGameweek = bootstrapResponse.data.events.find(event => event.is_current).id;
        res.json({ currentGameweek });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch current gameweek' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

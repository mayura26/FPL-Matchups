const { getPlayerData, calculateBPS } = require('./fplAPIWrapper');

async function getPlayerInfo(req, player, dataMap) {
    const playerDetailResponse = await getPlayerData(req, player.id);
    const currentGame = playerDetailResponse.data.history.slice(-1)[0];
    const nextGame = playerDetailResponse.data.fixtures[0];
    const oppositionNextTeam = nextGame.is_home ? nextGame.team_a : nextGame.team_h;
    const bpsData = await calculateBPS(req);

    let bonusPoints = 0;
    const playerBonus = bpsData.data.find(bpsPlayer => bpsPlayer.element === player.id);
    if (playerBonus) {
      bonusPoints = playerBonus.bonusPoints;
    }
    currentGame.total_points += bonusPoints;

    return {
        name: player.web_name,
        id: player.id,
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
        PPG: player.points_per_game,
        valueForm: player.value_form,
        valueSeason: player.value_season,
        xG90: player.expected_goals_per_90,
        xA90: player.expected_assists_per_90,
        xGI90: player.expected_goal_involvements_per_90,
        xGC90: player.expected_goals_conceded_per_90,
        CS90: player.clean_sheets_per_90,

        last5Scores: playerDetailResponse.data.history.slice(-6, -1).reverse().map(game => {
            const oppositionTeam = dataMap.teamsShort[dataMap.teams[game.opponent_team]];
            return {
                event: game.round,
                score: game.total_points,
                opposition: oppositionTeam,
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
}



module.exports = {
    getPlayerInfo
  };
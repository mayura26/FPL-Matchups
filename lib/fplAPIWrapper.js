const axios = require('axios');

const getApiData = async (url) => {
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'FPL-Website/1.0'
        }
    });
    return response.data;
}

const getData = async (req, key, url, ttl = 60) => {
    const cachedData = req.cache.get(key);
    let apiData = {
        data: [],
        apiLive: true,
        source: ''
    };

    if (cachedData) {
        apiData.data = req.cache.get(key);
        apiData.source = 'cache';
    } else {
        try {
            apiData.data = await getApiData(url);
            req.cache.set(key, apiData.data, ttl);
            apiData.source = 'api';
        } catch {
            apiData.apiLive = false;
        }
    }
    return apiData;
}

const generateFixData = async (req) => {
    const key = 'fix-data';
    const cachedData = req.cache.get(key);
    let fixturesData = {
        data: [],
        source: ''
    }
    if (cachedData) {
        fixturesData.data = req.cache.get(key);
        fixturesData.source = 'cache';
    } else {
        const bootstrapData = await getBootstrapData(req);
        const gameweekStatus = await getEventStatus(req);

        if (!validateApiResponse(bootstrapData) || !validateApiResponse(gameweekStatus)) {
            console.error("Error getting FPL API data");
            return res.status(500).json({ data: [], apiLive: false });
        }

        const dataMap = await getMaps(bootstrapData);
        const playersInfo = bootstrapData.data.elements;

        // Identify the date today and check if bonus has been added or not.
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const todaysData = gameweekStatus.data.status.find(event => event.date === todayString);
        const currentTime = new Date();

        if (todaysData) {
            const gameweek = todaysData.event;
            const fixtureData = await getFixtureData(req, gameweek);
            let todaysGames = fixtureData.data.filter(game => game.kickoff_time.split('T')[0] === todayString);
            let fixData = [];

            todaysGames.forEach(game => {
                const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
                const gameStartedForBPS = game.started && (currentTime - new Date(game.kickoff_time) >= thirtyMinutes);
                const fixInfo = {
                    teamHome: dataMap.teams[game?.team_h] || 0,
                    teamAway: dataMap.teams[game?.team_a] || 0,
                    teamHomeScore: game?.team_h_score || 0,
                    teamAwayScore: game?.team_a_score || 0,
                    kickOff: game.kickoff_time.split('T')[1].split(':').slice(0, 2).join(':'),
                    minutes: game.minutes,
                    bonusAdded: todaysData.bonus_added,
                    finished: game.finished_provisional,
                    started: game.started
                }
                let curFixBPSPlayer = [];
                let goals = [];
                let assists = [];
                let ownGoals = [];
                let penSaved = [];
                let penMissed = [];
                game.stats.forEach(stat => {
                    let combinedStats = [...stat.a, ...stat.h];
                    if (stat.identifier === 'bps') {
                        if (gameStartedForBPS) {
                            combinedStats.sort((a, b) => b.value - a.value);
                            let bonusPoints = 3;
                            while (curFixBPSPlayer.length < 3 && bonusPoints > 0 && combinedStats.length > 0) {
                                const currentScore = combinedStats[0].value;
                                const playersWithCurrentScore = combinedStats.filter(player => player.value === currentScore);
                                playersWithCurrentScore.forEach(player => player.bonusPoints = bonusPoints);
                                curFixBPSPlayer = [...curFixBPSPlayer, ...playersWithCurrentScore];
                                combinedStats = combinedStats.filter(player => player.value !== currentScore);
                                bonusPoints -= playersWithCurrentScore.length;
                            }
                            curFixBPSPlayer.forEach(player => player.name = playersInfo.find(playerI => playerI.id === player.element).web_name);
                            curFixBPSPlayer.forEach(player => player.team = dataMap.teamsShort[dataMap.teams[playersInfo.find(playerI => playerI.id === player.element).team]]);
                        }
                    } else {
                        combinedStats.forEach(player => {
                            const statInfo = {
                                element: player.element,
                                value: player.value,
                                name: playersInfo.find(playerI => playerI.id === player.element).web_name,
                                team: dataMap.teamsShort[dataMap.teams[playersInfo.find(playerI => playerI.id === player.element).team]]
                            }
                            if (stat.identifier === 'goals_scored') {
                                goals.push(statInfo);
                            } else if (stat.identifier === 'assists') {
                                assists.push(statInfo);
                            } else if (stat.identifier === 'own_goals') {
                                ownGoals.push(statInfo);
                            } else if (stat.identifier === 'penalties_saved') {
                                penSaved.push(statInfo);
                            } else if (stat.identifier === 'penalties_missed') {
                                penMissed.push(statInfo);
                            }
                        });
                    }
                });
                const fixtureData = {
                    fixInfo: fixInfo,
                    BPSData: curFixBPSPlayer,
                    gameStats: {
                        goals: goals,
                        assists: assists,
                        ownGoals: ownGoals,
                        penSaved: penSaved,
                        penMissed: penMissed
                    }
                }
                fixData.push(fixtureData);
            });
            fixturesData.data = fixData;
        } else {
            fixturesData.data = [];
        }

        req.cache.set(key, fixturesData.data, 60);
        fixturesData.source = 'api';
    }

    return fixturesData;
}

const getBootstrapData = async (req) => {
    return await getData(req, 'bootstrap-static', 'https://fantasy.premierleague.com/api/bootstrap-static/', 300);
}

const getEventStatus = async (req) => {
    return await getData(req, 'event-status', 'https://fantasy.premierleague.com/api/event-status/');
}

const getFixtureData = async (req, gameweek) => {
    return await getData(req, `fixtures-GW${gameweek}`, `https://fantasy.premierleague.com/api/fixtures/?event=${gameweek}`);
}

const getTeamData = async (req, teamID) => {
    return await getData(req, `Team-Data-${teamID}`, `https://fantasy.premierleague.com/api/entry/${teamID}/`);
}

const getTeamTransferData = async (req, teamID) => {
    return await getData(req, `Team-Data-${teamID}-transfers`, `https://fantasy.premierleague.com/api/entry/${teamID}/transfers/`);
}

const getTeamGWData = async (req, teamID, gameweek) => {
    return await getData(req, `Team-Data-${teamID}-GW${gameweek}`, `https://fantasy.premierleague.com/api/entry/${teamID}/event/${gameweek}/picks/`);
}

const getPlayerData = async (req, playerID) => {
    return await getData(req, `Player-Data-${playerID}`, `https://fantasy.premierleague.com/api/element-summary/${playerID}/`);
}

const getGWLiveData = async (req, gameweek) => {
    return await getData(req, `Gameweek-Data-${gameweek}`, `https://fantasy.premierleague.com/api/event/${gameweek}/live/`);
}

const getLeagueClassicStandingsData = async (req, leagueID) => {
    return await getData(req, `League-Data-${leagueID}-Standings`, `https://fantasy.premierleague.com/api/leagues-classic/${leagueID}/standings/`);
}

const getLeaguesH2HStandingsData = async (req, leagueID) => {
    return await getData(req, `League-Data-${leagueID}-Standings`, `https://fantasy.premierleague.com/api/leagues-h2h/${leagueID}/standings/`);
}

const getLeaguesH2HGWData = async (req, leagueID, gameweek) => {
    return await getData(req, `League-Data-${leagueID}-GW${gameweek}-H2HResults`, `https://fantasy.premierleague.com/api/leagues-h2h-matches/league/${leagueID}/?event=${gameweek}`);
}

const getMaps = async (bootstrapData) => {
    if (!bootstrapData || !bootstrapData.data) {
        console.error('Failed to access bootstrap data in getMaps');
        return { error: 'Failed to fetch data from the API' };
    }

    const teamsMap = bootstrapData.data.teams.reduce((acc, team) => {
        acc[team.id] = team.name;
        return acc;
    }, {});

    // Map for element types (positions)
    const elementTypesMap = bootstrapData.data.element_types.reduce((acc, type) => {
        acc[type.id] = type.singular_name_short; // or type.singular_name for full name
        return acc;
    }, {});

    const teamShortMap = {
        "Arsenal": "ARS",
        "Aston Villa": "AVL",
        "Bournemouth": "BOU",
        "Brentford": "BRE",
        "Brighton": "BHA",
        "Burnley": "BUR",
        "Chelsea": "CHE",
        "Crystal Palace": "CRY",
        "Everton": "EVE",
        "Fulham": "FUL",
        "Liverpool": "LIV",
        "Luton": "LUT",
        "Man City": "MCI",
        "Man Utd": "MAN",
        "Newcastle": "NEW",
        "Nott'm Forest": "NFO",
        "Sheffield Utd": "SHU",
        "Spurs": "TOT",
        "West Ham": "WHU",
        "Wolves": "WOL"
    };

    const dataMap = {
        teams: teamsMap,
        teamsShort: teamShortMap,
        positions: elementTypesMap
    }

    return dataMap;
}

function validateApiResponse(response) {
    if (!response || !response.data || !response.apiLive) {
        return false;
    } else {
        return true;
    }
}

// FEATURE: [v2 1.0] Create connection to external API for squad data
const getFixtureSquad = async (req) => {
    // use FPL fixture end point to look at all the games happening. if a game is within 30min of starting, pull back the squad as per below. if squad comes then we cache, other wise we try again.
    // get a list of all fixtures that are happening for today.
    // for each fixture pull back that squad list
    // put each fixture against its team IDs
    // put a list of all players starting into one array and on the bench into another array, per team. on the other side we check if the players team is in this array (so they have a live fixture today)
    // ad if they aren't in the starting/bench, unplayed, and if they are on the bench, benched
    return [];
}

module.exports = {
    getApiData,
    getBootstrapData,
    getEventStatus,
    getFixtureData,
    generateFixData,
    getTeamData,
    getTeamTransferData,
    getTeamGWData,
    getPlayerData,
    getGWLiveData,
    getLeagueClassicStandingsData,
    getLeaguesH2HStandingsData,
    getLeaguesH2HGWData,
    getMaps,
    validateApiResponse
}

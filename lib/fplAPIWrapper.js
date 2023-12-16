const axios = require('axios');

const getApiData = async (url) => {
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'FPL-Website/1.0'
        }
    });
    return response.data;
}

const getData = async (req, key, url) => {
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
            req.cache.set(key, apiData.data, 60);
            apiData.source = 'api';
        } catch {
            apiData.apiLive = false;
        }
    }
    return apiData;
}

const calculateBPS = async (req) => {
    const key = 'live-bps';
    const cachedData = req.cache.get(key);
    let bpsData = {
        data: [],
        source: ''
    }
    if (cachedData) {
        bpsData.data = req.cache.get(key);
        bpsData.source = 'cache';
    } else {
        const gameweekStatus = await getEventStatus(req);
        // Identify the date today and check if bonus has been added or not.
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const todaysData = gameweekStatus.data.status.find(event => event.date === todayString);
        const currentTime = new Date();

        if (!todaysData.bonus_added) {
            const gameweek = todaysData.event;
            const fixtureData = await getFixtureData(req, gameweek);
            let todaysGames = fixtureData.data.filter(game => game.kickoff_time.split('T')[0] === todayString);
            todaysGames = todaysGames.filter(game => {
                const kickoffTime = new Date(game.kickoff_time);    
                const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
                return game.started && (currentTime - kickoffTime >= thirtyMinutes);
            });
            let bpsPlayers = [];
            todaysGames.forEach(game => {
                const playerStats = game.stats.find(stat => stat.identifier === 'bps');
                if (playerStats) {
                    let combinedPlayerStats = [...playerStats.a, ...playerStats.h];
                    combinedPlayerStats.sort((a, b) => b.value - a.value);
                    let bonusPoints = 3;
                    let curFixBPSPlayer = [];
                    while (curFixBPSPlayer.length < 3 && bonusPoints > 0 && combinedPlayerStats.length > 0) {
                        const currentScore = combinedPlayerStats[0].value;
                        const playersWithCurrentScore = combinedPlayerStats.filter(player => player.value === currentScore);
                        playersWithCurrentScore.forEach(player => player.bonusPoints = bonusPoints);
                        curFixBPSPlayer = [...curFixBPSPlayer, ...playersWithCurrentScore];
                        combinedPlayerStats = combinedPlayerStats.filter(player => player.value !== currentScore);
                        bonusPoints -= playersWithCurrentScore.length;
                    }
                    curFixBPSPlayer.forEach(player => player.fix = game.id);
                    bpsPlayers = [...bpsPlayers, ...curFixBPSPlayer];
                }
                
            });
            bpsData.data = bpsPlayers;
        } else {
            bpsData.data = [];
        }
        req.cache.set(key, bpsData.data, 60);
        bpsData.source = 'api';
    }

    return bpsData;
}

const getBootstrapData = async (req) => {
    return await getData(req, 'bootstrap-static', 'https://fantasy.premierleague.com/api/bootstrap-static/');
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

// FEATURE: [4] Create connection to external API for squad data
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
    calculateBPS,
    getTeamData,
    getTeamTransferData,
    getTeamGWData,
    getPlayerData,
    getGWLiveData,
    getLeagueClassicStandingsData,
    getLeaguesH2HStandingsData,
    getLeaguesH2HGWData,
    getMaps
}

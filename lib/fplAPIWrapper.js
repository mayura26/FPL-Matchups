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

const getBootstrapData = async (req) => {
    return await getData(req, 'bootstrap-static', 'https://fantasy.premierleague.com/api/bootstrap-static/');
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


module.exports = {
    getApiData,
    getBootstrapData,
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

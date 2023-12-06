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
            console.error(error);
            apiData.apiLive = false;
        }
    }
    return apiData;
}

const getBootstrapData = async (req) => {
    return await getData(req, 'bootstrap-static', 'https://fantasy.premierleague.com/api/bootstrap-static/');
}

module.exports = {
    getApiData,
    getBootstrapData
}

const { MongoClient } = require('mongodb');
const { getApiData } = require('./fplAPIWrapper');

const args = process.argv.slice(2);
let MONGODB;
let init = false;

// Find MongoDB and init arguments
for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('MONGODB=')) {
        MONGODB = args[i].split('=')[1];
    } else if (args[i] === 'init') {
        init = true;
    }
}

if (!MONGODB) {
    console.error('MONGODB argument is missing');
    process.exit(1);
}

const uri = `mongodb+srv://user:${MONGODB}@cluster0.mneoc9t.mongodb.net/FPLMatchups?retryWrites=true&w=majority`; // replace with your MongoDB Atlas connection string
const client = new MongoClient(uri);

let teamDataArray = [];

const getAndStoreTeamData = async () => {
    const maxPage = 100000; // 50 results per page
    const firstPage = 1;
    const logInterval = 100; 
    const writeInterval = 1000; 

    const args = process.argv.slice(2);

    console.log(`Starting update of page from ${firstPage} to ${maxPage} with log of ${logInterval} and mode of ${args.includes('init') ? 'Initialise' : 'Append'}`);
    console.log("Connecting to MongoDB");
    await client.connect();
    console.log("Connected to MongoDB");
    const collection = client.db("FPLMatchups").collection("teamData"); 

    if (init) {
        await collection.deleteMany({});
        console.log("Initialised MongoDB");
    }

    for (let i = firstPage; i <= maxPage; i++) {
        try {
            const url = `https://fantasy.premierleague.com/api/leagues-classic/314/standings/?page_standings=${i}`
            const leagueData = await getApiData(url);
            if (leagueData && leagueData.standings && leagueData.standings.results) {
                leagueData.standings.results.forEach(player => {
                    const playerInfo = {
                        teamID: player.entry,
                        playerName: player.player_name,
                        teamName: player.entry_name,
                        rank: player.rank
                    };
                    teamDataArray.push(playerInfo);
                });
            }
            if (i % logInterval === 0) {
                console.log(`Currently at page ${i} of ${maxPage}`);
            }

            // Write to MongoDB every logInterval iterations
            if (i % writeInterval === 0) {
                await collection.insertMany(teamDataArray);
                teamDataArray = []; // Clear the array after writing to MongoDB.
                console.log(`Written to MongoDB with page ${i} of ${maxPage}`);
            }
        } catch (error) {
            console.error(`Failed to get data for page: ${i}`, error);
        }
    }

    // Write any remaining data to MongoDB after the loop
    if (teamDataArray.length > 0) {
        await collection.insertMany(teamDataArray);
    }

    await client.close();

    console.log("Completed");
}

getAndStoreTeamData();

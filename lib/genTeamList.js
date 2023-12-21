//FEATURE: [5] Pull all team IDs from 1 to x and store in a local file
const { getApiData } = require('./fplAPIWrapper');
const fs = require('fs');
let teamDataArray = [];

const getAndStoreTeamData = async () => {
    const maxPage = 10; // 50 results per page
    const firstPage = 1;
    const writeInterval = 1000; // Set the interval for writing to disk
    const logInterval = 100; // Set the interval for logging
    const filePath = 'teamData.json';
    
    const args = process.argv.slice(2);
    if (args[0] === 'init') {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    console.log(`Starting update of page from ${firstPage} to ${maxPage} with file write of ${writeInterval}, log of ${logInterval} and mode of ${args.includes('init') ? 'Initialise' : 'Append'}`);

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

            // Write to disk every writeInterval iterations
            if (i % writeInterval === 0) {
                if (fs.existsSync(filePath)) {
                    let existingData;
                    try {
                        existingData = JSON.parse(fs.readFileSync(filePath));
                    } catch (error) {
                        console.error(`Failed to parse existing data in file: ${filePath}. Overwriting file.`, error);
                        fs.writeFileSync(filePath, JSON.stringify(teamDataArray, null, 2));
                        teamDataArray = []; // Clear the array after writing to disk.
                        console.log(`Fresh disk write with page ${i} of ${maxPage}`);
                        continue;
                    }
                    const combinedData = existingData.concat(teamDataArray);
                    fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2));
                    teamDataArray = []; // Clear the array after writing to disk. This is a better way to reset the array as it allows the old array to be garbage collected if there are no other references to it, potentially freeing up memory.
                    console.log(`Written to disk with page ${i} of ${maxPage}`);
                } else {
                    fs.writeFileSync(filePath, JSON.stringify(teamDataArray, null, 2));
                    teamDataArray = []; // Clear the array after writing to disk.
                    console.log(`Fresh disk write with page ${i} of ${maxPage}`);
                }
            }
        } catch (error) {
            console.error(`Failed to get data for page: ${i}`, error);
        }
    }

    // Write any remaining data to disk after the loop
    if (teamDataArray.length > 0) {
        if (fs.existsSync(filePath)) {
            const existingData = JSON.parse(fs.readFileSync(filePath));
            const combinedData = existingData.concat(teamDataArray);
            fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2));
        } else {
            fs.writeFileSync(filePath, JSON.stringify(teamDataArray, null, 2));
        }
    }

    console.log("Completed");
}

getAndStoreTeamData();

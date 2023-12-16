//FEATURE: [5] Pull all team IDs from 1 to x and store in a local file
const { getApiData } = require('./fplAPIWrapper');
const fs = require('fs');
const teamDataArray = [];

const getAndStoreTeamData = async () => {
    const maxTeamID = 7000000;
    const firstTeamID = 1;
    const writeInterval = 100000; // Set the interval for writing to disk
    const logInterval = 1000; // Set the interval for logging
    const filePath = 'teamData.json';
    
    const args = process.argv.slice(2);
    if (args[0] === 'init') {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    console.log(`Starting update of TeamID from ${firstTeamID} to ${maxTeamID} with file write of ${writeInterval}, log of ${logInterval} and mode of ${args.includes('init') ? 'Initialise' : 'Append'}`);

    for (let i = firstTeamID; i <= maxTeamID; i++) {
        try {
            const url = `https://fantasy.premierleague.com/api/entry/${i}/`
            const teamData = await getApiData(url);
            if (teamData) {
                const teamInfo = {
                    teamID: i,
                    teamName: teamData.name,
                    playerName: `${teamData.player_first_name} ${teamData.player_last_name}`
                };
                teamDataArray.push(teamInfo);
            }
            if (i % logInterval === 0) {
                console.log(`Currently at TeamID ${i} of ${maxTeamID}`);
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
                        teamDataArray.length = 0; // Clear the array after writing to disk
                        console.log(`Fresh disk write with TeamID ${i} of ${maxTeamID}`);
                        continue;
                    }
                    const combinedData = existingData.concat(teamDataArray);
                    fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2));
                    teamDataArray.length = 0; // Clear the array after writing to disk
                    console.log(`Written to disk with TeamID ${i} of ${maxTeamID}`);
                } else {
                    fs.writeFileSync(filePath, JSON.stringify(teamDataArray, null, 2));
                    teamDataArray.length = 0; // Clear the array after writing to disk
                    console.log(`Fresh disk write with TeamID ${i} of ${maxTeamID}`);
                }
            }
        } catch (error) {
            console.error(`Failed to get data for team ID: ${i}`, error);
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

// TODO: Add chips to score calc
const { getPlayerData, calculateBPS, getTeamGWData, validateApiResponse } = require('./fplAPIWrapper');

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

const calculateTotalPoints = async (teamDetails) => {
    if (!teamDetails || !teamDetails.startingPlayers || !teamDetails.benchPlayers) {
        console.error('Failed to get teamdetails to calculate points');
        return 0; // or throw an error, or return a suitable default value
    }

    let totalPoints = 0;
    teamDetails.startingPlayers.forEach(detail => {
        totalPoints += detail.gameWeekScore;
    });

    let captain = teamDetails.startingPlayers.find(player => player.captainStatus === 'C');
    let viceCaptain = teamDetails.startingPlayers.find(player => player.captainStatus === 'VC');

    // If captain or vice-captain is not found in the starting players, check the bench
    if (!captain) {
        captain = teamDetails.benchPlayers.find(player => player.captainStatus === 'C');
    }
    if (!viceCaptain) {
        viceCaptain = teamDetails.benchPlayers.find(player => player.captainStatus === 'VC');
    }

    if (captain.playStatus !== 'unplayed') {
        totalPoints += captain.gameWeekScore;
    } else if (viceCaptain) {
        totalPoints += viceCaptain.gameWeekScore;
    }
    // Subtract any penalty points (hits) from the total points
    totalPoints -= teamDetails.transferCost;

    // Add points from bench players who have a substatus of 'In'
    teamDetails.benchPlayers.forEach(player => {
        if (player.subStatus === 'In') {
            totalPoints += player.gameWeekScore;
        }
    });

    return totalPoints;
};

const getTeamDetails = async (req, teamID, gameweek, gwLive, fixtureData, bpsData, bootstrapData, dataMap) => {
    try {
        const teamResponse = await getTeamGWData(req, teamID, gameweek);

        if (!validateApiResponse(teamResponse) || !validateApiResponse(fixtureData)) {
            console.error("Error getting FPL API data");
            return [];
        }

        const currentGameweek = bootstrapData.data.events.find(event => event.is_current).id;
        const isCurrentGameweek = currentGameweek == gameweek ? true : false;
        const playersInfo = bootstrapData.data.elements;
        const playerStartingIDs = teamResponse.data.picks.filter(pick => pick.position <= 11).map(pick => pick.element);
        const playerBenchIDs = teamResponse.data.picks.filter(pick => pick.position > 11).map(pick => pick.element);
        // Step 2: Fetch team details
        const teamStartingPlayers = playersInfo.filter(player => playerStartingIDs.includes(player.id));
        const teamBenchPlayers = playersInfo.filter(player => playerBenchIDs.includes(player.id));

        // Step 3: Enrich player details
        const unsortedStartingPlayers = await getPlayerDetails(teamStartingPlayers, teamResponse, playersInfo, isCurrentGameweek);
        const unsortedBenchPlayers = await getPlayerDetails(teamBenchPlayers, teamResponse, playersInfo, isCurrentGameweek);
        const transferCost = teamResponse.data.entry_history.event_transfers_cost;

        // Sort the benchPlayers arrays based on the pick position
        const startingPlayers = unsortedStartingPlayers.sort((a, b) => a.pickPosition - b.pickPosition);
        const benchPlayers = unsortedBenchPlayers.sort((a, b) => a.pickPosition - b.pickPosition);

        // Do auto subs by checking starting players for subs
        startingPlayers.forEach((player) => {
            // If the player hasn't played, set their subStatus to 'Out'
            if (player.playStatus === 'unplayed') {
                player.subStatus = 'Out';
                // Find a player in benchPlayers to sub in
                for (let j = 0; j < benchPlayers.length; j++) {
                    // If the bench player hasn't played, set their subStatus to 'In' and break the loop
                    if (benchPlayers[j].playStatus !== 'unplayed' && benchPlayers[j].subStatus !== 'In') {
                        // Check if the number of players in each position does not go below the minimum requirement
                        const numGoalkeepers = startingPlayers.filter(p => p.position === 'GKP').length - (player.position === 'GKP' ? 1 : 0) + (benchPlayers[j].position === 'GKP' ? 1 : 0);
                        const numDefenders = startingPlayers.filter(p => p.position === 'DEF').length - (player.position === 'DEF' ? 1 : 0) + (benchPlayers[j].position === 'DEF' ? 1 : 0);
                        const numMidfielders = startingPlayers.filter(p => p.position === 'MID').length - (player.position === 'MID' ? 1 : 0) + (benchPlayers[j].position === 'MID' ? 1 : 0);
                        const numForwards = startingPlayers.filter(p => p.position === 'FWD').length - (player.position === 'FWD' ? 1 : 0) + (benchPlayers[j].position === 'FWD' ? 1 : 0);

                        if (numGoalkeepers === 1 && numDefenders >= 3 && numMidfielders >= 2 && numForwards >= 1) {
                            benchPlayers[j].subStatus = 'In';
                            break;
                        }
                    }
                }
            }
        });

        const activeStartingPlayers = startingPlayers ? startingPlayers.filter(player => player.playStatus === 'playing').length : 0;
        const activeBenchPlayers = benchPlayers ? benchPlayers.filter(player => player.subStatus === 'In' && player.playStatus === 'playing').length : 0;
        const remainStartingPlayers = startingPlayers ? startingPlayers.filter(player => player.playStatus === 'notplayed').length : 0;
        const remainBenchPlayers = benchPlayers ? benchPlayers.filter(player => player.subStatus === 'In' && player.playStatus === 'notplayed').length : 0;
        let activePlayers = activeStartingPlayers + activeBenchPlayers;
        let remainPlayer = remainStartingPlayers + remainBenchPlayers;

        let captain = startingPlayers.find(player => player.captainStatus === 'C');
        if (!captain) {
            captain = benchPlayers.find(player => player.captainStatus === 'C');
        }
        if (captain && captain.playStatus == 'playing') {
            activePlayers += 1;
        } else if (captain && captain.playStatus == 'notplayed') {
            remainPlayer += 1;
        } else if (captain && captain.playStatus === 'unplayed') {
            viceCaptain = startingPlayers.find(player => player.captainStatus === 'VC');
            if (!viceCaptain) {
                viceCaptain = benchPlayers.find(player => player.captainStatus === 'VC');
            }
            if (viceCaptain) {
                viceCaptain.finalGameWeekPoints = viceCaptain.gameWeekScore * 2;
                if (viceCaptain.playStatus == 'playing') {
                    activePlayers += 1;
                } else if (viceCaptain.playStatus == 'notplayed') {
                    remainPlayer += 1;
                }
            }
        }

        return { startingPlayers, benchPlayers, transferCost, activePlayers, remainPlayer };
    } catch (error) {
        console.error(`Error generating matchup data. TeamID: ${teamID}`, error);
        throw error;
    }

    async function getPlayerDetails(players, teamResponse, playersInfo, isCurrentGameweek) {
        return await Promise.all(players.map(async (player) => {
            const playerDetailResponse = await getPlayerData(req, player.id);
            const playerInfo = playersInfo.find(playerInf => playerInf.id === player.id);
            if (!validateApiResponse(playerDetailResponse)) {
                console.error("Error getting FPL API data");
                return [];
            }
            const gameWeekLiveData = gwLive.data.elements.find(element => element.id === player.id);
            const gameWeekData = playerDetailResponse.data.history.filter(history => history.round === gameweek);
            const finalMatch = gameWeekData[gameWeekData.length - 1];
            const captainId = teamResponse.data.picks.find(pick => pick.is_captain).element;
            const viceCaptainId = teamResponse.data.picks.find(pick => pick.is_vice_captain).element;

            // Get current date/time in UTC
            const now = new Date();
            const currentTimeUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

            // Parse the kickoff time as UTC
            let kickoffTimeUTC;
            let minutesPlayed = 0;
            if (finalMatch) {
                kickoffTimeUTC = new Date(finalMatch.kickoff_time).getTime(); // This is already in UTC
                minutesPlayed = finalMatch.minutes;
            } else {
                kickoffTimeUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
            }
            const twoHoursAfterKickoff = kickoffTimeUTC + (2 * 60 * 60 * 1000); // Adding 2 hours (in milliseconds) to the kickoff time

            let playedStatus;
            let finalMatchFinished = false;
            if (finalMatch) {
                const fixture = fixtureData.data?.find(fix => fix.id === finalMatch.fixture);
                if (fixture && fixture.finished_provisional === true) {
                    finalMatchFinished = true;
                }
            }

            // FEATURE: [v2 1.1] Check fixtures and if player not in squad, then set to unplayed. If final match = today, and team is in this array of fixturesquads.
            if (playerInfo.chance_of_playing_this_round != null && playerInfo.chance_of_playing_this_round == 0 && minutesPlayed == 0 && isCurrentGameweek) {
                playedStatus = "unplayed";
            } else if (currentTimeUTC > kickoffTimeUTC) {
                if (finalMatchFinished || currentTimeUTC > twoHoursAfterKickoff) {
                    if (minutesPlayed == 0 && (finalMatchFinished || currentTimeUTC > twoHoursAfterKickoff)) {
                        playedStatus = "unplayed";
                    } else {
                        playedStatus = "played";
                    }
                } else if (minutesPlayed > 0) {
                    playedStatus = "playing";
                } else if (currentTimeUTC - kickoffTimeUTC >= 5 * 60 * 1000) {
                    playedStatus = "benched";
                }
            }
            else {
                playedStatus = "notplayed";
            }

            let captainStatus = 'N';
            if (player.id === captainId) {
                captainStatus = 'C';
            } else if (player.id === viceCaptainId) {
                captainStatus = 'VC';
            }

            let subStatus = 'N';
            const subInStatus = teamResponse.data.automatic_subs.find(pick => pick.element_in === player.id);
            const subOutStatus = teamResponse.data.automatic_subs.find(pick => pick.element_out === player.id);
            if (subInStatus) {
                subStatus = 'In';
            } else if (subOutStatus) {
                subStatus = 'Out';
            }
            
            // TODO: Refactor this to use the new data structure
            let bonusPoints = 0;
            const playerBonus = bpsData.data.find(bpsPlayer => bpsPlayer.element === player.id && bpsPlayer.element !== 0);
            if (playerBonus) {
                bonusPoints = playerBonus.bonusPoints;
            }
            const gameweekPoints = gameWeekLiveData ? gameWeekLiveData.stats.total_points + bonusPoints : 0;

            let finalGameWeekPoints = gameweekPoints;
            if (player.id === captainId) {
                finalGameWeekPoints = gameweekPoints * 2;
            }

            return {
                id: player.id,
                name: player.web_name,
                teamName: dataMap.teams[player.team],
                position: dataMap.positions[player.element_type],
                price: player.now_cost / 10,
                gameWeekScore: gameweekPoints,
                finalGameWeekPoints: finalGameWeekPoints,
                playStatus: playedStatus,
                captainStatus: captainStatus,
                pickPosition: teamResponse.data.picks.find(pick => pick.element === player.id).position,
                subStatus: subStatus
            };
        }));
    }
};

function detailBPSData(bpsData, playersInfo, dataMap, fixtureData) {
    bpsData.data.forEach(player => {
        const fixTeamHome = dataMap.teams[fixtureData.data.find(fix => fix.id === player.fix)?.team_h] || 0;
        const fixTeamAway = dataMap.teams[fixtureData.data.find(fix => fix.id === player.fix)?.team_a] || 0;
        const fixTeamHomeScore = fixtureData.data.find(fix => fix.id === player.fix)?.team_h_score || 0;
        const fixTeamAwayScore = fixtureData.data.find(fix => fix.id === player.fix)?.team_a_score || 0;
        if (player.element === 0) {
            player.name = "Blank";
            player.team = "";
            player.fixture = `${fixTeamHome} ${fixTeamHomeScore}-${fixTeamAwayScore} ${fixTeamAway}`;
        } else {
            player.name = playersInfo.find(playerI => playerI.id === player.element).web_name;
            player.team = dataMap.teamsShort[dataMap.teams[playersInfo.find(playerI => playerI.id === player.element).team]];
            player.fixture = `${fixTeamHome} ${fixTeamHomeScore}-${fixTeamAwayScore} ${fixTeamAway}`;
        }
    });
    return bpsData.data;
};

module.exports = {
    getPlayerInfo,
    getTeamDetails,
    calculateTotalPoints,
    detailBPSData
};

// FEATURE: Add option to compare player with another player
import React, { useState, useEffect, useContext } from 'react';
import './TeamAnalysis.css';
import './Shared.css';
import { TeamIDContext } from './TeamIDContext';

function scoreClass(score) {
    if (score <= 2) return 'score-red';
    if (score <= 5) return 'score-orange';
    if (score <= 10) return 'score-green';
    return 'score-blue';
}

function TeamAnalysis() {
    const { teamID } = useContext(TeamIDContext);
    const [gameweek, setGameweek] = useState(null);  // Initialize as null
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch the current gameweek when the component mounts
    useEffect(() => {
        const fetchCurrentGameweek = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/game-data');
                const data = await response.json();
                if (!data.apiLive) {
                    alert("The FPL API is not live.");
                } else {
                    setGameweek(data.data.currentGameweek);
                }
            } catch (error) {
                alert("Error fetching game data", error);
                console.error("Error fetching game data", error);
            }
        };

        fetchCurrentGameweek();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/ta/${teamID}/${gameweek}`);
                const data = await response.json();
                if (!data.apiLive) {
                    alert("The FPL API is not live.");
                } else {
                    setTeamData(data.data);
                }
            } catch (error) {
                alert("Error fetching team gw data", error);
                console.error("Error fetching team gw data:", error);
            }
            setLoading(false);
        };
        if (gameweek) {
            fetchData();
        }
    }, [gameweek, teamID]);

    return (
        <div className="main-container" data-testid="team-analysis">
            {loading ? (
                <div className="loading-bar"></div>
            ) : (
                teamData && (
                    <div className="team-data">
                        <div className="player-data">
                            <div className='manager-name'>
                                <h2>{teamData.managerName}</h2>
                            </div>
                            <div className='player-info'>
                                <div>Current Score: {teamData.overallPoints} </div>
                                <div>Rank: {teamData.overallRank}</div>
                            </div>
                        </div>
                        <div className="players-data">
                            <PlayerData players={teamData.playersStarting} benchPlayers={false} />
                            <PlayerData players={teamData.playersBench} benchPlayers={true} />
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

const PlayerData = ({ players, benchPlayers }) => {
    return (
        <div>
            <h3 className='team-type-header'>{benchPlayers ? "Bench" : "Starters"}</h3>
            <div className="players-data-set">
                {/* FEATURE: Click on player to bring up popup to compare with second player of choice. */}
                {players.map(player => (
                    <PlayerCard player={player} />
                ))}
            </div>
        </div>
    );
};

export const PlayerCard = ({ player }) => {
    return (
        <div key={player.name} className="player-frame">
            <div className="player-card-row">
                <div className="player-name">{player.name}</div>
                <div className="player-price">£{player.cost}</div>
                <div className="player-team">{player.teamName}</div>
            </div>
            <div className="player-card-row">
                {/* TODO: Update this text, depending on whether gameweek is over or not. */}
                <div className="player-current-fixture">Current Fixture: {player.currentGame.team}</div>
                {/* TODO: Add expected points next to points */}
                {/* TODO: Add form and ICT */}
                <div className={`player-score ${scoreClass(parseInt(player.currentGame.score))}`}>
                    {player.currentGame.score} [xP: {player.currentGame.xP}]
                </div>
                <div className="player-stats">
                    {/* BUG: xGi needs to be on next line */}
                    {(player.position === 'GKP' || player.position === 'DEF') ? (`xGC: ${player.currentGame.xGC}` + (player.currentGame.xGI > 0.4 ? `xGI: ${player.currentGame.xGI}` : '')) : `xGI: ${player.currentGame.xGI}`}
                </div>
            </div>
            <div className="player-card-row-divider"></div>
            <div className="player-card-row">
                {player.last5Scores.map((fixture, index) => (
                    <div key={index} className={`player-fixture ${scoreClass(parseInt(fixture.score.split(' ')[0]))}`}>
                        {/* TODO: Add xGi/xGc next to result as next line*/}
                        {/* TODO: Add ICT */}
                        {fixture.score}
                    </div>
                ))}
            </div>
            <div className="player-card-row-divider"></div>
            <div className="player-card-row">
                {player.next5Fixtures.map((fixture, index) => (
                    <div key={index} className={`player-fixture-next fdr-${fixture.fdr}`}>
                        <div>{fixture.fixture}</div>
                        <div>(GW{fixture.event})</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TeamAnalysis;

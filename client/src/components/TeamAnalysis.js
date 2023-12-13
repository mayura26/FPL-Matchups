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
    const [gamedata, setGamedata] = useState(null);  // Initialize as null
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
                    setGamedata(data.data);
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
                const response = await fetch(`/api/ta/${teamID}/${gamedata.currentGameweek}`);
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
        if (gamedata) {
            fetchData();
        }
    }, [gamedata, teamID]);

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
                            <PlayerData players={teamData.playersStarting} benchPlayers={false} gamedata={gamedata} />
                            <PlayerData players={teamData.playersBench} benchPlayers={true} gamedata={gamedata} />
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

const PlayerData = ({ players, benchPlayers, gamedata }) => {
    return (
        <div>
            <h3 className='team-type-header'>{benchPlayers ? "Bench" : "Starters"}</h3>
            <div className="players-data-set">
                {/* FEATURE: Click on player to bring up popup to compare with second player of choice. */}
                {players.map(player => (
                    <PlayerCard key={player.id} player={player} gamedata={gamedata} />
                ))}
            </div>
        </div>
    );
};

export const PlayerCard = ({ player, gamedata }) => {
    const [showDetails, setShowDetails] = useState(false);
    return (
        <div key={player.name} className="player-frame">
            <div className="player-card-row">
                <div className="player-name">{player.name}</div>
                <div className="player-form">Form: {player.form}</div>
                <div className="player-form">ICT: {player.ICT}</div>
                <div className="player-price">£{player.cost}</div>
                <div className="player-team">{player.teamName}</div>
            </div>
            <div className="player-card-row">
                <div className="player-current-fixture"><div>Live Fixture:</div> <div className='player-live-fixture-opp'>{player.currentGame.team}</div></div>
                <div className={`player-score ${scoreClass(parseInt(player.currentGame.score))}`}>
                    <div className='player-substat player-points'>{player.currentGame.score}</div>
                    <div className='player-substat'>xP: {player.currentGame.xP}</div>
                </div>
                <div className="player-stats">
                    <div className="player-substat">xG: {player.currentGame.xG}</div>
                    <div className="player-substat">xA: {player.currentGame.xA}</div>
                </div>
                <div className="player-stats">
                    <div className="player-substat">xGC: {player.currentGame.xGC}</div>
                    <div className="player-substat">ICT: {player.currentGame.ICT}</div>
                </div>
            </div>
            {gamedata.isFinished && (
                <div className="player-card-row">
                    <div className="player-upcoming-fixture">Upcoming: {player.upcomingGame.team}</div>
                    <div className="player-upcoming-xP">FDR: {player.upcomingGame.fdr}</div>
                    <div className="player-upcoming-xP">xP: {player.upcomingGame.xP}</div>
                </div>
            )}
            <div className="player-card-row-divider"></div>
            <div className="player-card-row ripple-row" onClick={() => setShowDetails(!showDetails)}>
                {player.last5Scores.map((fixture, index) => (
                    <div key={index} className={`player-fixture ${scoreClass(parseInt(fixture.score.split(' ')[0]))}`}>
                        {fixture.score} GW{fixture.event}
                    </div>
                ))}
            </div>
            {showDetails && (
                <div className="player-card-row">
                    {player.last5Scores.map((fixture, index) => (
                        <div key={index} className={`player-fixture-details ${showDetails ? 'visible' : ''}`}>
                            {/* TODO: Show xGi for def and xG/XA for attackers */}
                            {fixture.minutes > 0 ? (
                                <>
                                    {['GKP', 'DEF'].includes(player.position) ? (
                                        <>
                                            <div className={`player-substat ${fixture.xGC < 0.2 ? 'high-high-substat' : fixture.xGC < 0.5 ? 'high-substat' : fixture.xGC < 1.0 ? 'medium-substat' : 'low-substat'}`}>xGC: {fixture.xGC}</div>
                                            <div className={`player-substat ${fixture.xGI < 0.2 ? 'low-substat' : fixture.xGI < 0.4 ? 'medium-substat' : fixture.xGI < 1.0 ? 'high-substat' : 'high-high-substat'}`}>xGI: {fixture.xGI}</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className={`player-substat ${fixture.xG < 0.3 ? 'low-substat' : fixture.xG < 0.6 ? 'medium-substat' : fixture.xG < 1.0 ? 'high-substat' : 'high-high-substat'}`}>xG: {fixture.xG}</div>
                                            <div className={`player-substat ${fixture.xA < 0.3 ? 'low-substat' : fixture.xA < 0.6 ? 'medium-substat' : fixture.xA < 1.0 ? 'high-substat' : 'high-high-substat'}`}>xA: {fixture.xA}</div>
                                        </>
                                    )}
                                    <div className={`player-substat ${fixture.ICT < 5 ? 'low-substat' : fixture.ICT < 10 ? 'medium-substat' : fixture.ICT < 15 ? 'high-substat' : 'high-high-substat'}`}>ICT: {fixture.ICT}</div>
                                </>
                            ) : (
                                <>
                                    <div className="player-substat">DNP</div>
                                    <div className="player-substat">DNP</div>
                                    <div className="player-substat">DNP</div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
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

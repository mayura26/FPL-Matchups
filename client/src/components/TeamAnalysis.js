// TeamAnalysis.js
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
    const { teamID, updateTeamID } = useContext(TeamIDContext);
    const [gameweek, setGameweek] = useState('1');  // Initialize as null
    const [teamData, setTeamData] = useState(null);

    // Fetch the current gameweek when the component mounts
    useEffect(() => {
        const fetchCurrentGameweek = async () => {
            try {
                const response = await fetch('/api/current-gameweek');
                const data = await response.json();
                setGameweek(data.currentGameweek);
            } catch (error) {
                console.error("Error fetching current gameweek:", error);
            }
        };

        fetchCurrentGameweek();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch(`/api/ta/${teamID}/${gameweek}`);
            const data = await response.json();
            setTeamData(data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const clearTeamID = () => {
        updateTeamID("");
    };

    return (
        <div className="main-container">
            <div className="input-mainrow">
                <div className="input-row">
                    <div className="input-container">
                        <label htmlFor="teamID">Team ID:</label>
                        <input
                            type="text"
                            value={teamID}
                            onChange={(e) => updateTeamID(e.target.value)}
                        />
                    </div>
                    <button onClick={clearTeamID}>Clear</button>
                </div>
                <div className="input-row">
                    <div className="input-container">
                        <input
                            className="gameweek-display"
                            type="text"
                            value={"GW" + gameweek}
                            readOnly
                        />
                    </div>
                    <button onClick={fetchData} disabled={!teamID || !gameweek} style={{ opacity: (gameweek && teamID) ? 1 : 0.5 }}>Fetch Squad</button>
                </div>
            </div>

            {teamData && (
                <div className="team-data">
                    <div className="player-data">
                        <h2>{teamData.managerName}</h2>
                        <p>Current Score: <span className="score">{teamData.overallPoints}</span></p>
                        <p>Rank: <span className="rank">{teamData.overallRank}</span></p>
                    </div>
                    <div className="players-data">
                        <PlayerData players={teamData.playersStarting} title={"Starting Team"} />
                        <PlayerData players={teamData.playersBench} title={"Bench"} />
                    </div>
                </div>
            )}
        </div>
    );
}

const PlayerData = ({ players, title }) => {
    return (
        <div>
        <h3 className='team-type-header'>{title}</h3>
        <div className="players-data-set">   
            {/* TODO: Split player information to standalone file and restyle to flexbox */}
            {players.map(player => (
                <div key={player.name} className="player-frame">
                    <div className="player-card-row">
                        <div className="player-name">{player.name}</div>
                        <div className="player-price">£{player.cost}</div>
                        <div className="player-team">{player.teamName}</div>
                    </div>
                    <div className="player-card-row">
                        <div className="player-current-fixture">Current Fixture: {player.currentFixture}</div>
                        {/* TODO: Add expected points next to points */}
                        {/* TODO: Add form and ICT */}
                        <div className={`player-score ${scoreClass(parseInt(player.currentGameScore))}`}>
                            {player.currentGameScore}
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
            ))}
        </div>
        </div>
    );
};

export default TeamAnalysis;




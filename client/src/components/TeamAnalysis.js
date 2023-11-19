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
    const [gameweek, setGameweek] = useState(null);;  // Initialize as null
    const [maxGameweek, setMaxGameweek] = useState('1');
    const [teamData, setTeamData] = useState(null);

    // Fetch the current gameweek when the component mounts
    useEffect(() => {
        const fetchCurrentGameweek = async () => {
            try {
                const response = await fetch('/api/current-gameweek');
                const data = await response.json();
                setGameweek(data.currentGameweek);
                setMaxGameweek(data.currentGameweek);
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
                        <label htmlFor="gameweek">Gameweek:</label>
                        <select value={gameweek} onChange={(e) => setGameweek(e.target.value)}>
                            {Array.from({ length: maxGameweek }, (_, i) => i + 1).map(week => (
                                <option key={week} value={week}>GW{week}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={fetchData}>Fetch Players</button>
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
                        <PlayerData players={teamData.playersBench} title={"Bench"}/>
                    </div>
                </div>
            )}
        </div>
    );
}

const PlayerData = ({players, title}) => {
    return (
    <div className="players-data-set">
        <h3 className='team-type-header'>{title}</h3>
        {/* TODO: Split player information to standalone file and restyle to flexbox */}
    {players.map(player => (
        <div key={player.name} className="player-frame">
            <h3 className="player-name">{player.name}</h3>
            <p>Current Fixture: {player.currentFixture}</p>

            <table className="fixtures-table">
                <thead>
                    <tr>
                        <th colSpan="5">Last 5 Fixtures</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        {player.last5Scores.map((fixture, index) => (
                            <td key={index} className={`fdr-${fixture.fdr} ${scoreClass(parseInt(fixture.score.split(' ')[0]))}`}>
                                {fixture.score}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>


            <table className="fixtures-table">
                <thead>
                    <tr>
                        <th colSpan="5">Next 5 Fixtures</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        {player.next5Fixtures.map((fixture, index) => (
                            <td key={index} className={`fdr-${fixture.fdr}`}>
                                {fixture.fixture} (GW: {fixture.event})
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    ))}
    </div>
    );
};

export default TeamAnalysis;




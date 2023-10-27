// TeamAnalysis.js
import React, { useState, useEffect } from 'react';
import './TeamAnalysis.css';

function TeamAnalysis() {
    const [teamID, setTeamID] = useState("948006");
    const [gameweek, setGameweek] = useState(null);  // Initialize as null
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
            const response = await fetch(`/api/fpl/${teamID}/${gameweek}`);
            const data = await response.json();
            setTeamData(data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const clearTeamID = () => {
        setTeamID("");
    };

    useEffect(() => {
        if (gameweek) {
            fetchData();
        }
    }, [teamID, gameweek]);

    return (
        <div className="team-analysis-container">
            <input 
                type="text" 
                value={teamID} 
                onChange={(e) => setTeamID(e.target.value)} 
                placeholder="Enter Team ID" 
            />
            <button onClick={clearTeamID}>Clear</button>
            <select value={gameweek} onChange={(e) => setGameweek(e.target.value)}>
                {Array.from({ length: 38 }, (_, i) => i + 1).map(week => (
                    <option key={week} value={week}>GW{week}</option>
                ))}
            </select>
            <button onClick={fetchData}>Fetch Players</button>

            {teamData && (
                <div className="team-data">
                    <h2>{teamData.managerName}</h2>
                    <p>Current Score: {teamData.currentScore}</p>
                    <p>Rank: {teamData.rank}</p>
                    <ul>
                        {teamData.players.map(player => (
                            <li key={player.name}>
                                <strong>{player.name}</strong> ({player.teamName})<br />
                                Current Fixture: {player.currentFixture}<br />
                                Cost: {player.cost}<br />
                                Last 5 Scores: {player.last5Scores.join(', ')}<br />
                                Next 5 Fixtures: {player.next5Fixtures.map(fix => `${fix.fixture} (GW: ${fix.event})`).join(', ')}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default TeamAnalysis;

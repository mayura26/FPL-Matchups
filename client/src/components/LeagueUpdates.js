// LeagueUpdates.js
// FIXME: Update calls to new API structures
import React, { useState, useEffect, useContext } from 'react';
import './LeagueUpdates.css';
import './Shared.css';
import { TeamIDContext } from './TeamIDContext';

function LeagueUpdates() {
    const { teamID, updateTeamID } = useContext(TeamIDContext);
    const [leagues, setLeagues] = useState([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState('');
    const [gameweek, setGameweek] = useState('1');
    const [maxGameweek, setMaxGameweek] = useState('1');
    const [leagueChanges, setLeagueChanges] = useState([]);

    const fetchData = async () => {
        try {
            const response = await fetch(`/api/lu/league-teams/${selectedLeagueId}/${gameweek}`);
            const data = await response.json();

            if (!data.apiLive) {
                alert("The FPL API is not live.");
            } else {
                setLeagueChanges(data.data);
            }
        } catch (error) {
            alert("Error fetching league standing data", error);
            console.error("Error fetching league standing data", error);
        }
    };

    useEffect(() => {
        const fetchCurrentGameweek = async () => {
            try {
                const response = await fetch('/api/current-gameweek');
                const data = await response.json();

                if (!data.apiLive) {
                    alert("The FPL API is not live.");
                } else {
                    setGameweek(data.data.currentGameweek);
                    setMaxGameweek(data.data.currentGameweek);
                }
            } catch (error) {
                alert("Error fetching game data", error);
                console.error("Error fetching game data", error);
            }
        };

        fetchCurrentGameweek();
    }, []);

    useEffect(() => {
        const fetchLeagues = async () => {
            if (teamID) {
                try {
                    const response = await fetch(`/api/lu/team-leagues/${teamID}`);
                    const data = await response.json();

                    if (!data.apiLive) {
                        alert("The FPL API is not live.");
                    } else {
                        setLeagues(data.data);
                    }
                } catch (error) {
                    alert("Error fetching leagues data", error);
                    console.error('Error fetching leagues:', error);
                }
            }
        };
        fetchLeagues();
    }, [teamID]);

    return (
        <div className='main-container'>
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
                    <button onClick={() => updateTeamID('')}>Clear</button>
                </div>
                {leagues.length > 0 && (
                    <div className="input-row">
                        <div className="input-container">
                            <label htmlFor="leagues">Select League:</label>
                            <select value={selectedLeagueId} onChange={(e) => setSelectedLeagueId(e.target.value)}>
                                <option value="">Select a league</option>
                                {leagues.map((league) => (
                                    <option key={league.id} value={league.id}>{league.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-container">
                            <label htmlFor="gameweek">Gameweek:</label>
                            <select value={gameweek} onChange={(e) => setGameweek(e.target.value)}>
                                {Array.from({ length: maxGameweek }, (_, i) => i + 1).map(week => (
                                    <option key={week} value={week}>GW{week}</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={fetchData} disabled={!selectedLeagueId} style={{ opacity: selectedLeagueId ? 1 : 0.5 }}>Fetch</button>
                    </div>
                )}
            </div>
            {leagueChanges.length > 0 && (
                <table className="league-changes-table info-table">
                    <thead>
                        <tr className="league-changes-header">
                            <th>Manager Name</th>
                            <th>Team Name</th>
                            <th>Position</th>
                            <th>Transfer In</th>
                            <th>Transfer Out</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leagueChanges.map((change) => (
                            change.transfers.map((transfer, index) => (
                                <tr key={`${change.managerName}-${index}`} className="league-change-row">
                                    {index === 0 && (
                                        <>
                                            <td rowSpan={change.transfers.length} className="manager-name">{change.managerName}</td>
                                            <td rowSpan={change.transfers.length} className="team-name">{change.teamName}</td>
                                            <td rowSpan={change.transfers.length} className="position">{change.position}</td>
                                        </>
                                    )}
                                    {/* TODO: Highlight common players in or out */}
                                    {/* TODO: Add click to bring up player card */}
                                    {/* TODO: Click on person to bring up their team */}
                                    <td className="player-in">In: {transfer.playerIn.name} ({transfer.playerIn.club}) - £{transfer.playerIn.value / 10}m</td>
                                    <td className="player-out">Out: {transfer.playerOut.name} ({transfer.playerOut.club}) - £{transfer.playerOut.value / 10}m</td>
                                </tr>
                            ))
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default LeagueUpdates;




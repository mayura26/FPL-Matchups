// FEATURE: [6] Add livescoreboard
// FEATURE: [6.5] Add live squad score per players team and live league rank

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './LeagueUpdates.css';
import './Shared.css';
import { TeamIDContext } from './TeamIDContext';
import { PlayerCard } from './PlayerCard';
import { LoadingBar } from './Shared';

function LeagueUpdates() {
    const { teamID, updateTeamID } = useContext(TeamIDContext);
    const [leagues, setLeagues] = useState([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState('');
    const [gameweek, setGameweek] = useState('1');
    const [maxGameweek, setMaxGameweek] = useState('1');
    const [leagueChanges, setLeagueChanges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingInputs, setLoadingInputs] = useState(true);
    const [playerCardOpen, setPlayerCardOpen] = useState(false);
    const [managerCardOpen, setManagerCardOpen] = useState(false);
    const [selectedPlayerData, setSelectedPlayerData] = useState([]);
    const [selectedManagerData, setSelectedManagerData] = useState([]);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
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
        setLoading(false);
    };

    useEffect(() => {
        const fetchCurrentGameweek = async () => {
            try {
                const response = await fetch('/api/game-data');
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
                        if (data.data.length > 0) {
                            setLeagues(data.data);
                        } else {
                            alert("No leagues found");
                            setLeagues([]);
                        }
                        setLoadingInputs(false);
                    }
                } catch (error) {
                    alert("Error fetching leagues data", error);
                    console.error('Error fetching leagues:', error);
                }
            }
        };
        fetchLeagues();
    }, [teamID]);

    const PlayerCardPopup = ({ isOpen, onClose, selectedPlayerData }) => {
        if (!isOpen) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <PlayerCard player={selectedPlayerData} showNextFix={true} />
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        );
    };

    const ManagerCardPopup = ({ isOpen, onClose, selectedManagerData }) => {
        if (!isOpen) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className='manager-popup-info'>
                        <div className="manager-popup-name-info">
                            <div>
                                <h1>{selectedManagerData.managerName}</h1>
                            </div>
                            <div>
                                <h2>{selectedManagerData.teamName}</h2>
                            </div>
                        </div>
                        <div className='manager-popup-info-btns'>
                            <button className='ripple-btn' onClick={() => loadManagerSquad(selectedManagerData.teamID)}>Fetch Squad</button>
                            <button onClick={onClose}>Close</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const loadManagerSquad = (teamID) => {
        updateTeamID(teamID);
        navigate("/team-analysis");
    }

    const handleRowClick = async (playerID) => {
        try {
            const playersResponse = await fetch(`/api/h2h/player-matchup/${playerID}`);
            const playerResponseData = await playersResponse.json();

            if (playerResponseData.length > 0 && !playerResponseData.apiLive) {
                alert("The FPL API is not live.");
            } else {
                if (playerResponseData.data) {
                    setSelectedPlayerData(playerResponseData.data);
                    setPlayerCardOpen(true);
                } else {
                    setSelectedPlayerData([]);
                }
            }
        } catch (error) {
            alert("Error fetching player matchup", error);
            console.error("Error fetching player matchup:", error);
        }
    };

    const handleManagerRowClick = async (manager) => {
        setSelectedManagerData(manager);
        setManagerCardOpen(true);
    };

    return (
        <div className='main-container'>
            {loadingInputs ? (
                <div className="loading-wheel"></div>
            ) : (
                <div className="input-mainrow">
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
                            <button className='ripple-btn' onClick={fetchData} disabled={!selectedLeagueId} style={{ opacity: selectedLeagueId ? 1 : 0.5 }}>Fetch</button>
                        </div>
                    )}
                </div>
            )}
            {loading ? (
                <LoadingBar animationDuration={leagues.find(league => Number(league.id) === Number(selectedLeagueId)) ? leagues.find(league => Number(league.id) === Number(selectedLeagueId)).numberOfTeams/10 : 0} />
            ) : (
                leagueChanges.length > 0 && (
                    <>
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
                                    change.transfers.map((transfer, index) => {
                                        return (
                                            <tr key={`${change.managerName}-${index}`} className="league-change-row">
                                                {index === 0 && (
                                                    <>
                                                        <td style={{ wordWrap: "break-word" }}
                                                            rowSpan={change.transfers.length}
                                                            className="manager-name-table ripple-row"
                                                            title={`Team ID: ${change.teamID}`}
                                                            onClick={() => handleManagerRowClick(change)}>
                                                            {change.managerName}
                                                        </td>
                                                        <td style={{ wordWrap: "break-word" }} rowSpan={change.transfers.length} className="team-name">{change.teamName}</td>
                                                        <td rowSpan={change.transfers.length} className="position">{change.position}
                                                            {change.rankChange !== 0 && <br></br>}
                                                            {change.rankChange > 0 && (change.rankChange > 4 ? <span className="rank-up">{change.rankChange} 🔼</span> : Array.from({ length: change.rankChange }).map((_, i) => <span key={i} className="rank-up">🔼</span>))}
                                                            {change.rankChange < 0 && (Math.abs(change.rankChange) > 4 ? <span className="rank-down">{Math.abs(change.rankChange)} 🔻</span> : Array.from({ length: Math.abs(change.rankChange) }).map((_, i) => <span key={i} className="rank-down">🔻</span>))}
                                                        </td>
                                                    </>
                                                )}
                                                <td
                                                    className={`player-in ${transfer.playerIn.transferCount > 4 ? 'player-in-gt4' :
                                                        transfer.playerIn.transferCount > 3 ? 'player-in-gt3' :
                                                            transfer.playerIn.transferCount > 2 ? 'player-in-gt2' :
                                                                transfer.playerIn.transferCount > 1 ? 'player-in-gt1' :
                                                                    ''} ripple-row`}
                                                    onClick={() => handleRowClick(transfer.playerIn.id)}>
                                                    In: {transfer.playerIn.name} ({transfer.playerIn.club}) - £{transfer.playerIn.value / 10}m
                                                </td>
                                                <td
                                                    className={`player-out ${transfer.playerOut.transferCount > 4 ? 'player-out-gt4' :
                                                        transfer.playerOut.transferCount > 3 ? 'player-out-gt3' :
                                                            transfer.playerOut.transferCount > 2 ? 'player-out-gt2' :
                                                                transfer.playerOut.transferCount > 1 ? 'player-out-gt1' :
                                                                    ''} ripple-row`}
                                                    onClick={() => handleRowClick(transfer.playerOut.id)}>
                                                    Out: {transfer.playerOut.name} ({transfer.playerOut.club}) - £{transfer.playerOut.value / 10}m
                                                </td>
                                            </tr>
                                        );
                                    })
                                ))}
                            </tbody>
                        </table>
                        <PlayerCardPopup
                            isOpen={playerCardOpen}
                            onClose={() => setPlayerCardOpen(false)}
                            selectedPlayerData={selectedPlayerData}
                        />
                        <ManagerCardPopup
                            isOpen={managerCardOpen}
                            onClose={() => setManagerCardOpen(false)}
                            selectedManagerData={selectedManagerData}
                        />
                    </>
                )
            )}
        </div>
    );
}

export default LeagueUpdates;

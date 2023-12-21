// Home.js
import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import './Shared.css';
import logo from '../NavBarLogo.png'; // Assuming the logo is stored in the assets folder
import { TeamIDContext } from './TeamIDContext';

const Home = () => {
    const { teamID, updateTeamID } = useContext(TeamIDContext);
    const [gameData, setGameData] = useState([]);
    const [playerResultData, seplayerResultData] = useState([]);
    const [searchPopOpen, setSearchPopOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const searchPlayer = async (playerName) => {
        setLoading(true);
        if (playerName && playerName.length > 0) {
            try {
                const response = await fetch(`/api/find-player/${playerName}`);
                const data = await response.json();

                if (data.data.length === 0) {
                    alert("No matches.");
                } else {
                    seplayerResultData(data.data);
                }
            } catch (error) {
                alert("Error fetching league standing data", error);
                console.error("Error fetching league standing data", error);
            }
        }
        setLoading(false);
    };

    const SearchPopup = ({ isOpen, onClose }) => {
        if (!isOpen) return null;
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="input-mainrow">
                        <div className="input-row">
                            <div className="input-container">
                                <label htmlFor="playerName">Player Name:</label>
                                <input type="text" id="playerName" name="playerName" />
                            </div>
                            <button className='ripple-btn' onClick={() => searchPlayer(document.getElementById('playerName').value)}>Fetch</button>
                        </div>

                    </div>
                    <div className='search-results'>
                        {loading ? (<>
                            <div className="loading-wheel"></div>
                        </>
                        ) : (
                            playerResultData.length > 0 ? (
                                <table className="live-table info-table">
                                    <thead>
                                        <tr>
                                            <th>Player Name</th>
                                            <th>Team Name</th>
                                            <th>Rank</th>
                                        </tr>
                                    </thead>
                                    {playerResultData.map((player) => (
                                        <tbody>
                                            <tr>
                                                <td>{player.playerName}</td>
                                                <td>{player.teamName}</td>
                                                <td>{player.rank}</td>
                                            </tr>
                                        </tbody>
                                    ))}
                                </table>
                            ) : (
                                <></>
                            )
                        )}
                    </div>
                    <div>
                        <button onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        const fetchGameData = async () => {
            try {
                const response = await fetch('/api/game-data');
                const data = await response.json();
                setGameData(data);
            } catch (error) {
                console.error("Error fetching game data:", error);
            }
        };

        fetchGameData();
    }, []);

    const clearTeamID = () => {
        updateTeamID("");
    };

    return (
        <div className="main-container">
            <div className='logo-container'>
                <img src={logo} alt="FPL Logo" className="logo" />
            </div>
            <br></br>
            <div>
                <h1>Welcome to FPL Matchups</h1>
                <p>This tool provides detailed team analysis, league updates and head-to-head matchups for your FPL teams.</p>
                <p>Each matchup is broken down to a player vs player, and you can click on the row to see the players stats, and on their previous game fixtures, to see more stats.</p>
                <p>On league updates, you can see what players are being transferred in and out. Click on the player to bring up their stats. Click on the manager to bring up their team.</p>
                <p>Enter your Team ID below to get started. Click on the home logo to get back.</p>
            </div>
            <br></br>
            <div className='home-inputs'>
                <div className="input-mainrow">
                    <div className="input-row">
                        <div className="input-container">
                            <label htmlFor="teamId">Team ID:</label>
                            <input
                                type="text"
                                id="teamId"
                                placeholder="Enter your team ID"
                                value={teamID}
                                onChange={(e) => updateTeamID(e.target.value)}
                                className="team-id-input"
                            />
                        </div>
                        <button onClick={clearTeamID}>Clear</button>
                    </div>
                    {gameData.data && (
                        <div className="input-row">
                            <div className="input-container">
                                <label htmlFor="currentGameweek">Current GW:</label>
                                <input
                                    type="text"
                                    id="currentGameweek"
                                    value={"GW" + gameData.data.currentGameweek}
                                    readOnly
                                    className="readOnly-input"
                                />
                            </div>
                            <div className="input-container">
                                <label htmlFor="gameweekActive">GW Status:</label>
                                <input
                                    type="text"
                                    id="gameweekActive"
                                    value={gameData.data.isFinished ? "Done" : "Active"}
                                    readOnly
                                    className="readOnly-input"
                                />
                            </div>
                            <div className="input-container">
                                <label htmlFor="apiLive">API Status:</label>
                                <input
                                    type="text"
                                    id="apiLive"
                                    value={gameData.apiLive ? "Live" : "Error"}
                                    readOnly
                                    className="readOnly-input"
                                />
                            </div>
                        </div>
                    )}
                    {gameData.data && (
                        <Link className='link-btn ripple-btn' to={(!teamID || !gameData.data.currentGameweek) ? "#" : "/team-analysis"} style={{ opacity: (gameData.data.currentGameweek && teamID) ? 1 : 0.5, pointerEvents: (!teamID || !gameData.data.currentGameweek) ? "none" : "auto" }}>Fetch Squad</Link>
                    )}
                    {/*IN-PROGRESS: [5] Add dropdown for team selection by player name 
                    Need to create an endpoint which can loop through all teamID from say 1 to 10mil and get the playername, team name, teamID. Then we need to store this data offline*/}
                </div>
                <div className="input-mainrow home-input-second-row">
                    <div className="input-row">
                        <div className="input-container">
                            <button className='ripple-btn' onClick={() => updateTeamID('948006')}>Set to Example User</button>
                        </div>
                        <div className="input-container">
                            <button className='ripple-btn' onClick={() => setSearchPopOpen(true)}>Search</button>
                        </div>
                    </div>
                </div>
            </div>
            <SearchPopup
                isOpen={searchPopOpen}
                onClose={() => {
                    seplayerResultData([]);
                    setSearchPopOpen(false);
                }}
            />
        </div>
    );
};

export default Home;

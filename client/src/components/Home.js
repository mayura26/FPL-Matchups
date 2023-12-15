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
                    {/*FEATURE: Add dropdown for team selection by player name */}
                </div>
                <div className="input-mainrow home-input-second-row">
                    <div className="input-row">
                        <div className="input-container">
                            <button className='ripple-btn' onClick={() => updateTeamID('948006')}>Set to Example User</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;

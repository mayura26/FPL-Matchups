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
            {/*TODO: Update logo to be suitable for matchups */}
            <div className='logo-container'>
                <img src={logo} alt="FPL Logo" className="logo" />
            </div>
            <br></br>
            <div>
                <h1>Welcome to the FPL Analysis Tool</h1>
                <p>This tool provides detailed analysis and head-to-head matchups for Fantasy Premier League (FPL) teams.</p>
                <p>Explore your league standings, compare teams, and get the latest updates on player performance.</p>
                <p>Enter your Team ID below and click on top banner to get started</p>
            </div>
            <br></br>
            <div  className='home-inputs'>
                {/*BUG: Get this div centered */}
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
                                    value={gameData.data.isFinished ? "Finished" : "Active"}
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
                        // FIXME: Add check that teamID is valid
                        <Link className='link-btn' to={(!teamID || !gameData.data.currentGameweek) ? "#" : "/team-analysis"} style={{ opacity: (gameData.data.currentGameweek && teamID) ? 1 : 0.5, pointerEvents: (!teamID || !gameData.data.currentGameweek) ? "none" : "auto" }}>Fetch Squad</Link>
                    )}
                    {/*TODO: Add dropdown for team selection by player name */}
                    {/*TODO: Add go button with option of Example user */}
                    {/*TODO: Remove teamID from everypage & move gameweek current to here and make it a context */}
                    {/*TODO: Add status of connection to FPL */}
                    {/* FIXME: Return error to screen if API isn't working and disable the go button on the home page.*/}
                </div>
            </div>
        </div>
    );
};

// FIXME: Add popup for errors

export default Home;

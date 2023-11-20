// Home.js
import React, { useContext } from 'react';
import './Home.css';
import './Shared.css';
import logo from '../NavBarLogo.png'; // Assuming the logo is stored in the assets folder
import { TeamIDContext } from './TeamIDContext';

const Home = () => {
    const { teamID, updateTeamID } = useContext(TeamIDContext);

    return (
        <div className="main-container">
            <div className='logo-container'>
                <img src={logo} alt="FPL Logo" className="logo" />
            </div>
            <br></br>
            <div>
                <h1>Welcome to the FPL Analysis Tool</h1>
                <p>This tool provides detailed analysis and head-to-head matchups for Fantasy Premier League (FPL) teams.</p>
                <p>Explore your league standings, compare teams, and get the latest updates on player performance.</p>
                <p>Enter your Team ID below to get started.</p>
            </div>
            <br></br>
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
                </div>
            </div>
        </div>
    );
};

export default Home;

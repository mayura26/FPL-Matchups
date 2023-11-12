// Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../NavBarLogo.png'; 

function Navbar() {
    return (
        <div className="navbar">
        <div className="navbar-logo-container">
            <img src={logo} alt="Logo" className="navbar-logo" />
        </div>
        <div className="navbar-links">
            <Link to="/team-analysis">Team Analysis</Link>
            <Link to="/head2head-matchups">Head2Head Matchups</Link>
            <Link to="/league-updates">League Updates</Link>
        </div>
    </div>
    );
}

export default Navbar;

// Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../NavBarLogo.png';

function Navbar() {
    return (
        <div className="navbar">
            <div className="navbar-logo-container">
                <Link to="/">
                    <img src={logo} alt="Logo" className="navbar-logo" />
                </Link>
            </div>
            <div className="navbar-links">
                {/*TODO: Highlight page you are on */}
                <Link to="/team-analysis">Team Analysis</Link>
                <Link to="/head2head-matchups">Head2Head Matchups</Link>
                <Link to="/league-updates">League Updates</Link>
            </div>
            {/*TODO: Add little sep bar below navbar */}
        </div>
    );
}

export default Navbar;

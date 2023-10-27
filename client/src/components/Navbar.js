// Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
    return (
        <div className="navbar">
            <Link to="/team-analysis">Team Analysis</Link>
            <Link to="/head2head-matchups">Head2Head Matchups</Link>
            <Link to="/league-updates">League Updates</Link>
        </div>
    );
}

export default Navbar;

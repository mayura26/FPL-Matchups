import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../NavBarLogo.png';

function Navbar() {
    return (
        <div className="navBarHolder">
            <div className="navbar">
                <div className="navbar-logo-container">
                    <Link to="/">
                        <img src={logo} alt="Logo" className="navbar-logo" />
                    </Link>
                </div>
                <div className="navbar-links">
                    <Link to="/team-analysis" className="navbar-link">Team Analysis</Link>
                    <Link to="/head2head-matchups" className="navbar-link">Head2Head Matchups</Link>
                    <Link to="/league-updates" className="navbar-link">League Updates</Link>
                </div>
            </div>
            <div className="splitBar"></div>
        </div>
    );
}

export default Navbar;

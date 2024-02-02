import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';  // Importing the global styles
import Navbar from './components/Navbar';
import Home from './components/Home';
import TeamAnalysis from './components/TeamAnalysis';
import Head2HeadMatchups from './components/Head2HeadMatchups';
import LeagueUpdates from './components/LeagueUpdates';
import { TeamContextProvider } from './components/Context';

function App() {
    const location = useLocation();

    useEffect(() => {
        window.gtag('config', 'G-NP8DZJQYTH', {
          page_path: location.pathname, // Specify the current path
        });
      }, [location]);

    return (
        <TeamContextProvider>
            <div className="app-container">
                {location.pathname === "/" ? null : <Navbar />}
                <div className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/team-analysis" element={<TeamAnalysis />} />
                        <Route path="/head2head-matchups" element={<Head2HeadMatchups />} />
                        <Route path="/league-updates" element={<LeagueUpdates />} />
                    </Routes>
                </div>
            </div>
        </TeamContextProvider>
    );
}

const WrappedApp = () => {
    return (
        <Router>
            <App />
        </Router>
    );
};

export default WrappedApp;

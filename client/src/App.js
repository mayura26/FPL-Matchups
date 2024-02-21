import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './components/Home';
import TeamAnalysis from './components/TeamAnalysis';
import Head2HeadMatchups from './components/Head2HeadMatchups';
import LeagueUpdates from './components/LeagueUpdates';
import { TeamContextProvider } from './components/Context';
import InstallPwaPopup from './components/InstallPwaPopup';

// FEATURE: [v2 6.0] Push alerts when player in your team does something

function App() {
    const location = useLocation();

    const sendAdBlockDetectionToGA4 = (adBlockDetected) => {
        if (window.gtag) {
            window.gtag('event', 'ad_block_detected', {
                'event_category': 'Ad Block',
                'event_label': 'AdBlock Detected',
                'value': adBlockDetected ? 1 : 0,
            });
        }
    };

    useEffect(() => {
        window.gtag('config', 'G-NP8DZJQYTH', {
            page_path: location.pathname, // Specify the current path
        });
    }, [location]);

    useEffect(() => {
        // Set a slight delay to ensure all scripts have had a chance to load
        setTimeout(() => {
            const adBlockDetected = !document.getElementById('adblock-detector');
            if (adBlockDetected) {
                // Send event to GA4
                sendAdBlockDetectionToGA4(adBlockDetected);
            }
        }, 5000); // Adjust the timeout as needed
    }, []);

    return (
        <TeamContextProvider>
            <div className="app-container">
                {location.pathname === "/" ? null : <Navbar />}
                <InstallPwaPopup />
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

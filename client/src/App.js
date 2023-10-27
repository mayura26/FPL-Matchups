import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';  // Importing the global styles
import Navbar from './components/Navbar';
import TeamAnalysis from './components/TeamAnalysis';
import Head2HeadMatchups from './components/Head2HeadMatchups';
import LeagueUpdates from './components/LeagueUpdates';

function App() {
    return (
        <div className="app-container">
        <Router>
            <Navbar />
            <Routes>
                <Route path="/team-analysis" element={<TeamAnalysis />} />
                <Route path="/head2head-matchups" element={<Head2HeadMatchups />} />
                <Route path="/league-updates" element={<LeagueUpdates />} />
            </Routes>
        </Router>
        </div>
    );
}

export default App;
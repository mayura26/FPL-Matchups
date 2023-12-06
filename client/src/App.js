import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';  // Importing the global styles
import Navbar from './components/Navbar';
import Home from './components/Home';
import TeamAnalysis from './components/TeamAnalysis';
import Head2HeadMatchups from './components/Head2HeadMatchups';
import LeagueUpdates from './components/LeagueUpdates';
import { TeamIDProvider } from './components/TeamIDContext';

function App() {
    return (
        <TeamIDProvider>
            <div className="app-container">
                <Router>
                    <Routes>
                        <Route path="/" element={<Home />}/>
                        <Route path="/team-analysis" element={<><Navbar /><TeamAnalysis /></>} />
                        <Route path="/head2head-matchups" element={<><Navbar /><Head2HeadMatchups /></>} />
                        <Route path="/league-updates" element={<><Navbar /><LeagueUpdates /></>} />
                    </Routes>
                </Router>
            </div>
        </TeamIDProvider>
    );
}

export default App;
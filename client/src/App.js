import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, MemoryRouter } from 'react-router-dom';
import './App.css';  // Importing the global styles
import Navbar from './components/Navbar';
import Home from './components/Home';
import TeamAnalysis from './components/TeamAnalysis';
import Head2HeadMatchups from './components/Head2HeadMatchups';
import LeagueUpdates from './components/LeagueUpdates';
import { TeamIDProvider } from './components/TeamIDContext';

function App() {
    const location = useLocation();

    return (
        <TeamIDProvider>
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
        </TeamIDProvider>
    );
}

const WrappedApp = () => {
    const RouterComponent = process.env.NODE_ENV === 'test' ? MemoryRouter : Router;
    return (
        <RouterComponent>
            <App />
        </RouterComponent>
    );
};

export default WrappedApp;

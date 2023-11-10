// Head2HeadMatchups.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Head2HeadMatchups.css';

const Head2HeadMatchups = () => {
const [teamId, setTeamId] = useState('948006');
const [leagues, setLeagues] = useState([]);
const [selectedLeagueId, setSelectedLeagueId] = useState('');

const handleTeamIdChange = (e) => {
    setTeamId(e.target.value);
};

const clearTeamID = () => {
  setTeamId("");
};

useEffect(() => {
    if (teamId) {
    axios.get(`/api/h2h/leagues/${teamId}`)
        .then(response => {
            console.log(response.data); // Log the data here to inspect its structure
            const leaguesArray = Array.isArray(response.data) ? response.data : [];
            setLeagues(leaguesArray);
        })
        .catch(error => {
        console.error('Error fetching leagues:', error);
        });
    }
}, [teamId]); 

// Handlers and JSX go here...
return (
  <div className='head2head-container'>
  <div className="input-mainrow">
  <div className="input-row">
      <div className="input-container">
      <label htmlFor="teamID">Team ID:</label>
              <input 
                  type="text" 
                  value={teamId} 
                  placeholder="Enter Team ID" 
              />
      </div>
      <button onClick={clearTeamID}>Clear</button>
  </div>
      {leagues.length > 0 && (
        <div className="input-row">
        <div className="input-container">
        <label htmlFor="league">Select League:</label>
          <select value={selectedLeagueId} onChange={(e) => setSelectedLeagueId(e.target.value)}>
            <option value="">Select a league</option>
            {leagues.map((league) => (
              <option key={league.id} value={league.id}>{league.name}</option>
            ))}
          </select>
          </div>
          <button>Fetch League</button>
      </div>
      )}
      </div>
      </div>
  );
}

export default Head2HeadMatchups;
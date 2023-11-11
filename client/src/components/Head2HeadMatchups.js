// Head2HeadMatchups.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Head2HeadMatchups.css';

const Head2HeadMatchups = () => {
const [teamId, setTeamId] = useState('948006');
const [leagues, setLeagues] = useState([]);
const [selectedLeagueId, setSelectedLeagueId] = useState('');
const [gameweek, setGameweek] = useState(null); 
const [leagueData, setLeagueData] = useState(null);
const [selectedMatchup, setSelectedMatchup] = useState(null);
const [teamDetails, setTeamDetails] = useState({ team1: null, team2: null });

    // Function to handle row click
    const onRowClick = async (teamId1, teamId2) => {
      setSelectedMatchup({ teamId1, teamId2 });
      try {
          //const response = await fetch(`/api/team-details/${teamId1}/${teamId2}`);
          //const data = await response.json();
          setTeamDetails({ team1: 'red', team2: 'blue'});
      } catch (error) {
          console.error("Error fetching team details:", error);
      }
  };

// Fetch the current gameweek when the component mounts
useEffect(() => {
  const fetchCurrentGameweek = async () => {
      try {
          const response = await fetch('/api/current-gameweek');
          const data = await response.json();
          setGameweek(data.currentGameweek);
      } catch (error) {
          console.error("Error fetching current gameweek:", error);
      }
  };

  fetchCurrentGameweek();
}, []);

const fetchData = async () => {
  try {
      const response = await fetch(`/api/h2h/leagues/${selectedLeagueId}/${gameweek}`);
      const data = await response.json();
      setLeagueData(data);
  } catch (error) {
      console.error("Error fetching data:", error);
  }
};

const clearTeamID = () => {
  setTeamId("");
};

useEffect(() => {
    if (teamId) {
    axios.get(`/api/h2h/leagues/${teamId}`)
        .then(response => {
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
          <div className="input-container">
                <label htmlFor="gameweek">Gameweek:</label>
                <select value={gameweek} onChange={(e) => setGameweek(e.target.value)}>
                    {Array.from({ length: 38 }, (_, i) => i + 1).map(week => (
                        <option key={week} value={week}>GW{week}</option>
                    ))}
                </select>
            </div>
          <button onClick={fetchData}>Fetch League</button>
      </div>
      )}
      </div>
      {leagueData && (
            <table className="matchup-table">
                <thead>
                    <tr>
                        <th>Team 1</th>
                        <th>Score</th>
                        <th>Team 2</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                {leagueData.map(match => (
                        <tr key={match.id} onClick={() => onRowClick(match.entry_1_entry, match.entry_2_entry)} className="clickable-row">
                            <td className={match.entry_1_points > match.entry_2_points ? 'winner' : ''}>
                                {match.entry_1_name} ({match.entry_1_player_name})
                            </td>
                            <td className={match.entry_1_points > match.entry_2_points ? 'winner' : ''}>
                                {match.entry_1_points}
                            </td>
                            <td className={match.entry_2_points > match.entry_1_points ? 'winner' : ''}>
                                {match.entry_2_name} ({match.entry_2_player_name})
                            </td>
                            <td className={match.entry_2_points > match.entry_1_points ? 'winner' : ''}>
                                {match.entry_2_points}
                            </td>
                        </tr>
                ))}
            {/* Conditional rendering of team details */}
            {selectedMatchup && (
                <td colSpan="2">
                <div className="team-details">
                    {/* Render team details here */}
                    <TeamDetails teamData={teamDetails.team1} />
                    <TeamDetails teamData={teamDetails.team2} />
                </div>
                </td>
            )}
           </tbody>
       </table>
      )}
   </div>
  );
}

// Component to display team details
function TeamDetails({ teamData }) {
  if (!teamData) return null;

  return (
      <div>
          { teamData.team1 }
      </div>
  );
}

export default Head2HeadMatchups;
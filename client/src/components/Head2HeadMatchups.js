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
const [selectedMatchupId, setSelectedMatchupId] = useState(null);
const [teamDetails, setTeamDetails] = useState({ team1Id: null, team2Id: null });

const toggleMatchupDetails = async (matchupId, team1Id, team2Id) => {
    if (selectedMatchupId === matchupId) {
      setSelectedMatchupId(null);
    } else {
      setSelectedMatchupId(matchupId);
  
      // Fetch team details for both teams
      const team1Details = await fetchTeamDetails(team1Id);
      const team2Details = await fetchTeamDetails(team2Id);
  
      setTeamDetails({
        team1Id: team1Details,
        team2Id: team2Details
      });
    }
  };

  const fetchTeamDetails = async (teamId) => {
    try {
      //const response = await fetch(`/api/team-details/${teamId}`);
      //if (!response.ok) {
    //    throw new Error('Network response was not ok');
    //  }
      //return await response.json();
      return teamId;
    } catch (error) {
      console.error('Error fetching team details:', error);
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
      <div>
        {leagueData.map((match, index) => (
          <div key={match.id} className="matchup-container">
            <div className="matchup-summary" onClick={() => toggleMatchupDetails(match.id, match.entry_1_entry, match.entry_2_entry)}>
              <table className="matchup-table">
                <tbody>
                  <tr>
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
                </tbody>
              </table>
            </div>
            {selectedMatchupId === match.id && (
                <div className="team-details">
                        <TeamDetails teamId={teamDetails.team1Id} />
                        <TeamDetails teamId={teamDetails.team2Id} />
                </div>
            )}
          </div>
        ))}
      </div>
    )}
   </div>
  );
}

function TeamDetails({ teamId }) {
    return (
      <div className="team-details">
        <p>Team ID: {teamId}</p>
      </div>
    );
  }
  

export default Head2HeadMatchups;
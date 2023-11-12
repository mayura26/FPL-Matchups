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
  const [matchupData, setMatchupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hideCommonPlayers, setHideCommonPlayers] = useState(false);

  const toggleMatchupDetails = async (matchupId, team1Id, team2Id) => {
    if (selectedMatchupId === matchupId) {
      // If the same matchup is clicked, collapse it
      setSelectedMatchupId(null);
      setMatchupData(null); // Also clear the matchup data
    } else {
      setSelectedMatchupId(matchupId);
      await fetchMatchupData(team1Id,team2Id, gameweek);
    }
  };

  // Fetch matchup data
  const fetchMatchupData = async (team1Id, team2Id, gameweek) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/h2h/team-matchup/${team1Id}/${team2Id}/${gameweek}`);
      const data = await response.json();
      setMatchupData(data);
    } catch (error) {
      console.error('Error fetching matchup data:', error);
    } finally {
      setLoading(false);
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
          loading ? (
            <p>Loading...</p>
          ) : (

                matchupData && (
                  <div className={`matchup-details ${selectedMatchupId === match.id ? 'open' : ''}`}>
                    <button onClick={() => setHideCommonPlayers(!hideCommonPlayers)}>
                      {hideCommonPlayers ? 'Show' : 'Hide'} Common Players
                    </button>
                    <MatchupDetails
                    team1Details={matchupData.team1Details}
                    team2Details={matchupData.team2Details}
                      hideCommonPlayers={hideCommonPlayers}
                    />
                  </div>
                )
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PlayerRow = ({ player1, player2, hideCommon }) => {
// Hide the row if hideCommon is true and both players are the same (identified by ID)
if (hideCommon && player1 && player2 && player1.id === player2.id) {
  return null;
}

  const player1Class = player1 && player1.gameWeekScore > 0 ? 'player played' : 'player';
  const player2Class = player2 && player2.gameWeekScore > 0 ? 'player played' : 'player';

  return (
    <tr className="player-row">
      <td className={player1Class}>{player1 ? player1.name : ''}</td>
      <td className={player1Class}>{player1 ? player1.position : ''}</td>
      <td className={player1Class}>{player1 ? player1.gameWeekScore : ''}</td>
      <td className={player2Class}>{player2 ? player2.name : ''}</td>
      <td className={player2Class}>{player2 ? player2.position : ''}</td>
      <td className={player2Class}>{player2 ? player2.gameWeekScore : ''}</td>
    </tr>
  );
};

const MatchupDetails = ({ team1Details, team2Details, hideCommonPlayers }) => {
  const alignedPlayers = alignPlayers(team1Details, team2Details);
  return (
    <div className="matchup-table-container">
    <table className="matchup-table">
      <thead>
        <tr>
          <th>Player (Team 1)</th>
          <th>Position</th>
          <th>Score</th>
          <th>Player (Team 2)</th>
          <th>Position</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        {alignedPlayers.map(({ player1, player2 }, index) => (
          <PlayerRow
            key={index}
            player1={player1}
            player2={player2}
            hideCommon={hideCommonPlayers}
          />
        ))}
      </tbody>
    </table>
    </div>
  );
};

const alignPlayers = (team1Details, team2Details) => {
  const positions = ['GKP', 'DEF', 'MID', 'FWD'];
  const alignedPlayers = [];

  positions.forEach(position => {
    let players1 = team1Details.filter(player => player.position === position);
    let players2 = team2Details.filter(player => player.position === position);

    // Align players by ID
    let matched = new Set();
    players1.forEach(p1 => {
      const matchingPlayerIndex = players2.findIndex(p2 => p1.id === p2.id);
      if (matchingPlayerIndex !== -1) {
        alignedPlayers.push({ player1: p1, player2: players2[matchingPlayerIndex] });
        matched.add(players2[matchingPlayerIndex].id);
        players2.splice(matchingPlayerIndex, 1);
      }
    });

    // Align remaining players by position
    players1 = players1.filter(p1 => !matched.has(p1.id));
    players1.forEach(p1 => {
      if (players2.length > 0) {
        alignedPlayers.push({ player1: p1, player2: players2.shift() });
      } else {
        alignedPlayers.push({ player1: p1, player2: null });
      }
    });

    players2.forEach(p2 => {
      alignedPlayers.push({ player1: null, player2: p2 });
    });
  });

  return alignedPlayers;
};

export default Head2HeadMatchups;
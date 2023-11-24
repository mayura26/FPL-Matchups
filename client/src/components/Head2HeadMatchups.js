// Head2HeadMatchups.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './Head2HeadMatchups.css';
import './Shared.css';
import { TeamIDContext } from './TeamIDContext';

const Head2HeadMatchups = () => {
  const { teamID, updateTeamID } = useContext(TeamIDContext);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [gameweek, setGameweek] = useState('1');
  const [maxGameweek, setMaxGameweek] = useState('1');
  const [leagueData, setLeagueData] = useState(null);
  const [selectedMatchupId, setSelectedMatchupId] = useState(null);
  const [matchupData, setMatchupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hideCommonPlayers, setHideCommonPlayers] = useState(false);
  const [hidePlayedPlayers, setHidePlayedPlayers] = useState(false);

  const toggleMatchupDetails = async (matchupId, team1Id, team2Id) => {
    if (selectedMatchupId === matchupId) {
      // If the same matchup is clicked, collapse it
      setSelectedMatchupId(null);
      setMatchupData(null); // Also clear the matchup data
    } else {
      setSelectedMatchupId(matchupId);
      await fetchMatchupData(team1Id, team2Id, gameweek);
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
        setMaxGameweek(data.currentGameweek);
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
      // TODO: Add loading indicator
      setLeagueData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const clearTeamID = () => {
    updateTeamID("");
  };

  useEffect(() => {
    if (teamID && teamID !== "") {
      axios.get(`/api/h2h/leagues/${teamID}`)
        .then(response => {
          if (response.data.length > 0) {
            setLeagues(response.data);
          } else {
            // TODO: Add popup no leagues found
            setLeagues([]);
          }
        })
        .catch(error => {
          console.error('Error fetching leagues:', error);
        });
    }
  }, [teamID]);

  // Handlers and JSX go here...
  return (
    <div className='main-container'>
      <div className="input-mainrow">
        <div className="input-row">
          <div className="input-container">
            <label htmlFor="teamID">Team ID:</label>
            <input
              type="text"
              value={teamID}
              onChange={(e) => updateTeamID(e.target.value)}
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
                {Array.from({ length: maxGameweek }, (_, i) => i + 1).map(week => (
                  <option key={week} value={week}>GW{week}</option>
                ))}
              </select>
            </div>
            <button onClick={fetchData} disabled={!selectedLeagueId} style={{ opacity: selectedLeagueId ? 1 : 0.5 }}>Fetch</button>
          </div>
        )}
      </div>
      {leagueData && (
        <div className="matchups-container">
          {leagueData.map((match, index) => (
            <div key={match.id} className="matchup-container">
              <div className="matchup-summary" onClick={() => toggleMatchupDetails(match.id, match.entry_1_entry, match.entry_2_entry)}>
                <table className="matchup-table info-table">
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
                      <div className='hide-btns'>
                        <button onClick={() => setHideCommonPlayers(!hideCommonPlayers)}>
                          {hideCommonPlayers ? 'Show' : 'Hide'} Common Players
                        </button>
                        <button onClick={() => setHidePlayedPlayers(!hidePlayedPlayers)}>
                          {hidePlayedPlayers ? 'Show' : 'Hide'} Played Players
                        </button>
                      </div>
                      <MatchupDetails
                        team1Details={matchupData.team1Details.startingPlayers}
                        team2Details={matchupData.team2Details.startingPlayers}
                        hideCommonPlayers={hideCommonPlayers}
                        hidePlayedPlayers={hidePlayedPlayers}
                        heading={"Starting"}
                      />
                      <MatchupDetails
                        team1Details={matchupData.team1Details.benchPlayers}
                        team2Details={matchupData.team2Details.benchPlayers}
                        hideCommonPlayers={hideCommonPlayers}
                        hidePlayedPlayers={hidePlayedPlayers}
                        heading={"Bench"}
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

const PlayerRow = ({ player1, player2, hideCommon, hidePlayed }) => {
  // Hide the row if hideCommon is true and both players are the same (identified by ID)
  if ((hideCommon && player1 && player2 && player1.id === player2.id) ||
    (hidePlayed &&
      ((player1 && player2 && player1.playStatus === "played" && player2.playStatus === "played") ||
        (player1 && player1.playStatus === "played" && player2 == null) ||
        (player2 && player2.playStatus === "played" && player1 == null)))) {
    return null;
  }

  // TODO: Need to have a popup when you click the players name showing minutes played, team they play for points, expected points

  // Highlight player if they are captain or vice-captain and double their gameweek points if captain
  const player1Score = player1 && player1.captainStatus === 'C' ? player1.gameWeekScore * 2 : player1 ? player1.gameWeekScore : '';
  const player2Score = player2 && player2.captainStatus === 'C' ? player2.gameWeekScore * 2 : player2 ? player2.gameWeekScore : '';
  const player1Class = player1 ? `player ${player1.playStatus} ${player1.captainStatus}` : 'player';
  const player2Class = player2 ? `player ${player2.playStatus} ${player2.captainStatus}` : 'player';
  const player1Name = player1 && (player1.captainStatus === 'C' || player1.captainStatus === 'VC') ? player1.name + ` (${player1.captainStatus})`: player1 ? player1.name : '';
  const player2Name = player2 && (player2.captainStatus === 'C' || player2.captainStatus === 'VC') ? player2.name + ` (${player2.captainStatus})`: player2 ? player2.name : '';

  return (
    <tr className="player-row">
      <td className={player1Class}>{player1Name}</td>
      <td className={player1Class}>{player1 ? player1.position : ''}</td>
      <td className={player1Class}>{player1Score}</td>
      <td className={player2Class}>{player2Name}</td>
      <td className={player2Class}>{player2 ? player2.position : ''}</td>
      <td className={player2Class}>{player2Score}</td>
    </tr>
  );
};

const MatchupDetails = ({ team1Details, team2Details, hideCommonPlayers, hidePlayedPlayers, heading }) => {
  const alignedPlayers = alignPlayers(team1Details, team2Details);
  // TODO: Add live score indication
  return (   
    <div className="matchup-table-container">
      <table className="matchup-table info-table">
        <thead>
          <tr><th className='team-type-heading' colSpan={"100%"}>{heading}</th></tr>
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
              hidePlayed={hidePlayedPlayers}
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
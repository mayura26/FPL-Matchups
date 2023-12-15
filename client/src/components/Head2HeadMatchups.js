// FEATURE: Show matchups for the coming week
import React, { useState, useEffect, useContext } from 'react';
import './Head2HeadMatchups.css';
import './Shared.css';
import { TeamIDContext } from './TeamIDContext';
import { PlayerCardSlim } from './PlayerCard';

const Head2HeadMatchups = () => {
  const { teamID } = useContext(TeamIDContext);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [gameweek, setGameweek] = useState('1');
  const [maxGameweek, setMaxGameweek] = useState('1');
  const [fetchedGameweek, setFetchedGameweek] = useState('');
  const [leagueData, setLeagueData] = useState(null);
  const [selectedMatchupId, setSelectedMatchupId] = useState(null);
  const [matchupData, setMatchupData] = useState(null);
  const [loadingMatchup, setLoadingMatchup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingInputs, setLoadingInputs] = useState(true);
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

  // Fetch the current gameweek when the component mounts
  useEffect(() => {
    const fetchCurrentGameweek = async () => {
      try {
        const response = await fetch('/api/game-data');
        const data = await response.json();

        if (!data.apiLive) {
          alert("The FPL API is not live.");
        } else {
          setGameweek(data.data.currentGameweek);
          setMaxGameweek(data.data.currentGameweek);
        }
      } catch (error) {
        alert("Error fetching game data", error);
        console.error("Error fetching game data", error);
      }
    };

    fetchCurrentGameweek();
  }, []);

  useEffect(() => {
    const fetchLeagueData = async () => {
      if (teamID && teamID !== "") {
        try {
          const response = await fetch(`/api/h2h/leagues/${teamID}`);
          const data = await response.json();

          if (!data.apiLive) {
            alert("The FPL API is not live.");
          } else {
            if (data.data.length > 0) {
              setLeagues(data.data);
            } else {
              alert("No leagues found");
              setLeagues([]);
            }
            setLoadingInputs(false);
          }
        } catch (error) {
          alert("Error fetching league list", error);
          console.error("Error fetching league list:", error);
        }
      }
    };

    fetchLeagueData();
  }, [teamID]);

  const fetchData = async () => {
    setLoading(true);
    setFetchedGameweek(gameweek);
    try {
      const response = await fetch(`/api/h2h/leagues/${selectedLeagueId}/${gameweek}`);
      const data = await response.json();
      if (!data.apiLive) {
        alert("The FPL API is not live.");
      } else {
        setLeagueData(data.data);
      }
    } catch (error) {
      alert("Error fetching league data", error);
      console.error("Error fetching league data:", error);
    }
    setLoading(false);
  };

  // Fetch matchup data
  const fetchMatchupData = async (team1Id, team2Id, gameweek) => {
    setLoadingMatchup(true);
    try {
      const response = await fetch(`/api/h2h/team-matchup/${team1Id}/${team2Id}/${gameweek}`);
      const data = await response.json();

      if (!data.apiLive) {
        alert("The FPL API is not live.");
      } else {
        setMatchupData(data.data);
      }
    } catch (error) {
      alert("Error fetching matchup data", error);
      console.error('Error fetching matchup data:', error);
    } finally {
      setLoadingMatchup(false);
    }
  };

  return (
    <div className='main-container'>
      {loadingInputs ? (
        <div className="loading-wheel"></div>
      ) : (
        leagues.length > 0 ? (
          <div className="input-mainrow">
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
                <button className='ripple-btn' onClick={fetchData} disabled={!selectedLeagueId} style={{ opacity: selectedLeagueId ? 1 : 0.5 }}>Fetch</button>
              </div>
            )}
          </div>
        ) : (
          <></>
        )
      )}

      {loading ? (
        <div className="loading-bar"></div>
      ) : (
        leagueData && (
          <div className="matchups-container">
            {leagueData.results.map((match, index) => (
              <div key={match.id} className="matchup-container">
                <div className="matchup-summary" onClick={() => toggleMatchupDetails(match.id, match.entry_1_entry, match.entry_2_entry)}>
                  <table className="matchup-table info-table results-table">
                    <tbody>
                      <tr className='ripple-row'>
                        <td className={match.entry_1_livepoints > match.entry_2_livepoints ? 'winner' : (match.entry_1_livepoints === match.entry_2_livepoints ? 'draw' : 'loser')} title={`Team ID: ${match.entry_1_entry}`}>
                          {leagueData.managerData[match.entry_1_entry] ? (
                            <>
                              <span>{match.entry_1_name}</span><span>({match.entry_1_player_name})</span><span>P: {leagueData.managerData[match.entry_1_entry].points} R: {leagueData.managerData[match.entry_1_entry].rank}</span><span>{"[" + leagueData.managerData[match.entry_1_entry].matches_won}-{leagueData.managerData[match.entry_1_entry].matches_drawn}-{leagueData.managerData[match.entry_1_entry].matches_lost + "]"}</span>
                            </>
                          ) : (
                            <>
                              <span>{match.entry_1_name}</span><span>({match.entry_1_player_name})</span>
                            </>
                          )}
                        </td>
                        <td>
                          {Number(fetchedGameweek) === Number(maxGameweek) ? (
                            <>
                              <pre>Official: {match.entry_1_points} - {match.entry_2_points}</pre>
                              <pre>Live: {match.entry_1_livepoints} - {match.entry_2_livepoints}</pre>
                            </>
                          ) :
                            (
                              <>
                                <pre>{match.entry_1_points} - {match.entry_2_points}</pre>
                              </>
                            )}
                        </td>
                        <td className={match.entry_2_livepoints > match.entry_1_livepoints ? 'winner' : (match.entry_1_livepoints === match.entry_2_livepoints ? 'draw' : 'loser')} title={`Team ID: ${match.entry_2_entry}`}>
                          {leagueData.managerData[match.entry_2_entry] ? (
                            <>
                              <span>{match.entry_2_name}</span><span>({match.entry_2_player_name})</span><span>P: {leagueData.managerData[match.entry_2_entry].points} R: {leagueData.managerData[match.entry_2_entry].rank}</span><span>{"[" + leagueData.managerData[match.entry_2_entry].matches_won}-{leagueData.managerData[match.entry_2_entry].matches_drawn}-{leagueData.managerData[match.entry_2_entry].matches_lost + "]"}</span>
                            </>
                          ) : (
                            <>
                              <span>{match.entry_2_name}</span><span>({match.entry_2_player_name})</span>
                            </>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {selectedMatchupId === match.id && (
                  loadingMatchup ? (
                    <div className="loading-wheel"></div>
                  ) : (
                    matchupData && (
                      <>
                        <div className={`matchup-details ${selectedMatchupId === match.id ? 'open' : ''}`}>
                          <div className='hide-btns'>
                            <button onClick={() => setHideCommonPlayers(!hideCommonPlayers)}>
                              {hideCommonPlayers ? 'Show' : 'Hide'} Common Players
                            </button>
                            <button onClick={() => setHidePlayedPlayers(!hidePlayedPlayers)}>
                              {hidePlayedPlayers ? 'Show' : 'Hide'} Played Players
                            </button>
                          </div>
                          {Number(fetchedGameweek) === Number(maxGameweek) && (
                            <div className={`live-lead ${Math.abs(match.entry_1_livepoints - match.entry_2_livepoints) < 6 ? 'small-lead' : Math.abs(match.entry_1_livepoints - match.entry_2_livepoints) < 12 ? 'medium-lead' : Math.abs(match.entry_1_livepoints - match.entry_2_livepoints) < 20 ? 'large-lead' : 'extra-large-lead'}`}>
                              Live Lead: {Math.abs(match.entry_1_livepoints - match.entry_2_livepoints)}
                            </div>
                          )}
                          <MatchupDetailsStarting
                            team1Details={matchupData.team1Details.startingPlayers}
                            team2Details={matchupData.team2Details.startingPlayers}
                            hideCommonPlayers={hideCommonPlayers}
                            hidePlayedPlayers={hidePlayedPlayers}
                          />
                          <MatchupDetailsBench
                            team1Details={matchupData.team1Details.benchPlayers}
                            team2Details={matchupData.team2Details.benchPlayers}
                            hideCommonPlayers={hideCommonPlayers}
                            hidePlayedPlayers={hidePlayedPlayers}
                          />
                        </div>
                      </>
                    )
                  ))}
              </div>
            ))}
            {(Number(fetchedGameweek) === Number(maxGameweek) && leagueData.bpsData.data.length > 0) ? (
              <div className="bps-data">
                <h2>BPS Data (Live)</h2>
                <table className="bps-table info-table">
                  <thead>
                    <tr>
                      <th>Player Name</th>
                      <th>BPS</th>
                      <th>Bonus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leagueData.bpsData.data.map((player, index) => (
                      <tr key={index}>
                        <td>{player.name}</td>
                        <td>{player.value}</td>
                        <td>{player.bonusPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <></>
            )}
          </div>
        )
      )}
    </div>
  );
}

const PlayerRow = ({ player1, player2, hideCommon, hidePlayed }) => {
  const [showPlayer1Card, setShowPlayer1Card] = useState(false);
  const [showPlayer2Card, setShowPlayer2Card] = useState(false);
  const [player1Data, setPlayer1Data] = useState(null);
  const [player2Data, setPlayer2Data] = useState(null);

  // Hide the row if hideCommon is true and both players are the same (identified by ID)
  if ((hideCommon && player1 && player2 && player1.id === player2.id) ||
    (hidePlayed &&
      ((player1 && player2 && player1.playStatus === "played" && player2.playStatus === "played") ||
        (player1 && player1.playStatus === "played" && player2 == null) ||
        (player2 && player2.playStatus === "played" && player1 == null)))) {
    return null;
  }

  const player1Score = player1 ? player1.gameWeekScore : '';
  const player2Score = player2 ? player2.gameWeekScore : '';
  const player1Class = player1 ? `player ${player1.playStatus} ${player1.captainStatus}` : 'player';
  const player2Class = player2 ? `player ${player2.playStatus} ${player2.captainStatus}` : 'player';
  let player1Name = player1 && (player1.captainStatus === 'VC' || player1.captainStatus === 'C') ? player1.name + ` (${player1.captainStatus})` : player1 ? player1.name : '';
  let player2Name = player2 && (player2.captainStatus === 'VC' || player2.captainStatus === 'C') ? player2.name + ` (${player2.captainStatus})` : player2 ? player2.name : '';

  const getSinglePlayerStatus = (playerScore) => {
    let playerStatus = '';
    if (playerScore >= 8) {
      playerStatus = '🏆';
    } else if (playerScore >= 4) {
      playerStatus = '✅';
    } else if (playerScore > 1) {
      playerStatus = '🟠';
    } else {
      playerStatus = '💥';
    }
    return playerStatus;
  }

  // Determine the status of the players based on their scores
  let player1Status = player1 ? '' : null;
  let player2Status = player2 ? '' : null;
  if (player1 && player2) {
    if ((player1.playStatus === 'played' || player1.playStatus === 'playing') && (player2.playStatus === 'played' || player2.playStatus === 'playing')) {
      if (player1Score > player2Score) {
        player1Status = (player1Score - player2Score >= 5) ? '🏆' : '✅';
        player2Status = (player1Score - player2Score >= 5) ? '💥' : '❌';
      } else if (player1Score < player2Score) {
        player1Status = (player2Score - player1Score >= 5) ? '💥' : '❌';
        player2Status = (player2Score - player1Score >= 5) ? '🏆' : '✅';
      } else if (player1Score === player2Score) {
        player1Status = '🔵'; // Draw
        player2Status = '🔵'; // Draw
      }
    } else if ((player1.playStatus === 'played' || player1.playStatus === 'playing') && (player2.playStatus === 'unplayed')) {
      player1Status = getSinglePlayerStatus(player1Score);
    } else if ((player2.playStatus === 'played' || player2.playStatus === 'playing') && (player1.playStatus === 'unplayed')) {
      player2Status = getSinglePlayerStatus(player2Score);
    }
  } else if (player1 && !player2) {
    if (player1.playStatus === 'played' || player1.playStatus === 'playing') {
      player1Status = getSinglePlayerStatus(player1Score);
    }
  } else if (!player1 && player2) {
    if (player2.playStatus === 'played' || player2.playStatus === 'playing') {
      player2Status = getSinglePlayerStatus(player2Score);
    }
  }

  if (player1 && (player1.playStatus === 'unplayed' || player1.subStatus === "Out")) {
    player1Status = '🔻';
  } else if (player1 && player1.subStatus === "In") {
    player1Name += ' 🔼'
  }

  if (player2 && (player2.playStatus === 'unplayed' || player2.subStatus === "Out")) {
    player2Status = '🔻';
  } else if (player2 && player2.subStatus === "In") {
    player2Name += ' 🔼'
  }

  const handleRowClick = async () => {
    try {
      if (showPlayer1Card || showPlayer2Card) {
        setShowPlayer1Card(false);
        setShowPlayer2Card(false);
      } else {
        if (player1 || player2) {
          let player1ResponseData = [];
          let player2ResponseData = [];

          if (player1) {
            const players1Response = await fetch(`/api/h2h/player-matchup/${player1.id}`);
            player1ResponseData = await players1Response.json();
          }

          if (player2) {
            const players2Response = await fetch(`/api/h2h/player-matchup/${player2.id}`);
            player2ResponseData = await players2Response.json();
          }

          if ((player1ResponseData.length > 0 && !player1ResponseData.apiLive) || (player2ResponseData.length > 0 && !player2ResponseData.apiLive)) {
            alert("The FPL API is not live.");
          } else {
            if (player1ResponseData.data) {
              setPlayer1Data(player1ResponseData.data);
              setShowPlayer1Card(true);
            } else {
              setPlayer1Data([]);
            }
            if (player2ResponseData.data) {
              setPlayer2Data(player2ResponseData.data);
              setShowPlayer2Card(true);
            } else {
              setPlayer2Data([]);
            }
          }
        }
      }
    } catch (error) {
      alert("Error fetching player matchup", error);
      console.error("Error fetching player matchup:", error);
    }
  };

  const playerCardPopup = (showPlayer1Card || showPlayer2Card) ? (
    <>
      {player1Data && (
        showPlayer1Card ? (
          <td className="player-card-popup" colSpan={4}>
            <PlayerCardSlim player={player1Data} />
          </td>
        ) : (
          <td className="player-card-popup" colSpan={4}></td>
        )
      )}
      {player2Data && (
        showPlayer2Card ? (
          <td className="player-card-popup" colSpan={4}>
            <PlayerCardSlim player={player2Data} showNextFix={false} />
          </td>
        ) : (
          <td className="player-card-popup" colSpan={4}></td>
        )
      )}
    </>
  ) : null;

  return (
    <>
      <tr className="player-row ripple-row" onClick={handleRowClick}>
        <td className={player1Class}>{player1Name}</td>
        <td className={player1Class}>{player1 ? player1.position : ''}</td>
        <td className={player1Class}>{player1Score}</td>
        <td className={player1Class}>{player1Status}</td>
        <td className={player2Class}>{player2Name}</td>
        <td className={player2Class}>{player2 ? player2.position : ''}</td>
        <td className={player2Class}>{player2Score}</td>
        <td className={player2Class}>{player2Status}</td>
      </tr>
      <tr>{playerCardPopup}</tr>
    </>
  );
};

const PlayerRowBench = ({ player1, player2 }) => {
  const player1Score = player1 ? player1.gameWeekScore : '';
  const player2Score = player2 ? player2.gameWeekScore : '';
  const player1Class = player1 ? `player ${player1.playStatus} ${player1.captainStatus}` : 'player';
  const player2Class = player2 ? `player ${player2.playStatus} ${player2.captainStatus}` : 'player';
  const player1Name = player1 && (player1.captainStatus === 'VC' || player1.captainStatus === 'C') ? player1.name + ` (${player1.captainStatus})` : player1 ? player1.name : '';
  const player2Name = player2 && (player2.captainStatus === 'VC' || player2.captainStatus === 'C') ? player2.name + ` (${player2.captainStatus})` : player2 ? player2.name : '';

  let player1Status = player1 ? (player1.playStatus === 'unplayed' ? '☠️' : player1.playStatus === 'not-played' ? '' : '➖') : null; // Ready symbol if played, dead symbol if not
  let player2Status = player2 ? (player2.playStatus === 'unplayed' ? '☠️' : player2.playStatus === 'not-played' ? '' : '➖') : null;  // Ready symbol if played, dead symbol if not
  if (player1 && player1.subStatus === "Out") {
    player1Status = '🔻';
  } else if (player1 && player1.subStatus === "In") {
    player1Status += '🔼';
  }

  if (player2 && player2.subStatus === "Out") {
    player2Status = '🔻';
  } else if (player2 && player2.subStatus === "In") {
    player2Status += '🔼';
  }
  return (
    <tr className="player-row">
      <td className={player1Class}>{player1Name}</td>
      <td className={player1Class}>{player1 ? player1.position : ''}</td>
      <td className={player1Class}>{player1Score}</td>
      <td className={player1Class}>{player1Status}</td>
      <td className={player2Class}>{player2Name}</td>
      <td className={player2Class}>{player2 ? player2.position : ''}</td>
      <td className={player2Class}>{player2Score}</td>
      <td className={player2Class}>{player2Status}</td>
    </tr>
  );
};

const MatchupDetailsStarting = ({ team1Details, team2Details, hideCommonPlayers, hidePlayedPlayers }) => {
  const alignedPlayers = alignPlayers(team1Details, team2Details);
  return (
    <div className="matchup-table-container">
      <table className="matchup-table info-table">
        <thead>
          <tr><th className='team-type-heading' colSpan={"100%"}>Starting</th></tr>
          <tr>
            <th>Player</th>
            <th>Pos.</th>
            <th>P</th>
            <th>S</th>
            <th>Player</th>
            <th>Pos.</th>
            <th>P</th>
            <th>S</th>
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

const MatchupDetailsBench = ({ team1Details, team2Details, hideCommonPlayers, hidePlayedPlayers }) => {
  return (
    <div className="matchup-table-container">
      <table className="matchup-table info-table">
        <thead>
          <tr><th className='team-type-heading' colSpan={"100%"}>Bench</th></tr>
          <tr>
            <th>Player</th>
            <th>Pos.</th>
            <th>P</th>
            <th>S</th>
            <th>Player</th>
            <th>Pos.</th>
            <th>P</th>
            <th>S</th>
          </tr>
        </thead>
        <tbody>
          {team1Details.sort((a, b) => a.pickPosition - b.pickPosition).map((player1, index1) => {
            const player2 = team2Details.sort((a, b) => a.pickPosition - b.pickPosition)[index1] || null;
            return (
              <PlayerRowBench
                key={index1}
                player1={player1}
                player2={player2}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const alignPlayers = (team1Details, team2Details) => {
  const positions = ['GKP', 'DEF', 'MID', 'FWD'];
  const alignedPlayers = [];
  const captains = { team1: null, team2: null };

  // First, find the captains, store them separately.
  team1Details.forEach(player => {
    if (player.captainStatus === 'C') {
      captains.team1 = player;
    }
  });
  team2Details.forEach(player => {
    if (player.captainStatus === 'C') {
      captains.team2 = player;
    }
  });

  positions.forEach(position => {
    let players1 = team1Details.filter(player => player.position === position).sort((a, b) => b.price - a.price);
    let players2 = team2Details.filter(player => player.position === position).sort((a, b) => b.price - a.price);

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

  // Add captains at the end of the array, aligned with each other
  // If the captain's playStatus is 'unplayed', then the viceCaptain is put in place
  let team1Player = captains.team1 || team1Details.find(player => player.captainStatus === 'VC');
  let team2Player = captains.team2 || team2Details.find(player => player.captainStatus === 'VC');

  if (team1Player && team1Player.playStatus === 'unplayed') {
    team1Player = team1Details.find(player => player.captainStatus === 'VC') || team1Player;
  }

  if (team2Player && team2Player.playStatus === 'unplayed') {
    team2Player = team2Details.find(player => player.captainStatus === 'VC') || team2Player;
  }

  alignedPlayers.push({ player1: team1Player, player2: team2Player });

  return alignedPlayers;
};

export default Head2HeadMatchups;
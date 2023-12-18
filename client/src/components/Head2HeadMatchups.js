// FEATURE: [1] Show matchups for the coming week
import React, { useState, useEffect, useContext, useCallback } from 'react';
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
  const [selectedMatchupTeam1ID, setSelectedMatchupTeam1ID] = useState(null);
  const [selectedMatchupTeam2ID, setSelectedMatchupTeam2ID] = useState(null);
  const [matchupData, setMatchupData] = useState(null);
  const [loadingMatchup, setLoadingMatchup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingInputs, setLoadingInputs] = useState(true);
  const [hideCommonPlayers, setHideCommonPlayers] = useState(false);
  const [hidePlayedPlayers, setHidePlayedPlayers] = useState(false);
  const [bpsDataVisible, setBpsDataVisible] = useState(false);
  const [liveScoreboardVisible, setLiveScoreboardVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [idleTime, setIdleTime] = useState(0);

  const toggleMatchupDetails = async (matchupId, team1Id, team2Id) => {
    if (selectedMatchupId === matchupId) {
      // If the same matchup is clicked, collapse it
      setSelectedMatchupId(null);
      setSelectedMatchupTeam1ID(null);
      setSelectedMatchupTeam2ID(null);
      setMatchupData(null); // Also clear the matchup data
    } else {
      setSelectedMatchupId(matchupId);
      setSelectedMatchupTeam1ID(team1Id);
      setSelectedMatchupTeam2ID(team2Id);
      await fetchMatchupData(team1Id, team2Id, gameweek);
    }
  };

  const fetchData = useCallback(async (showLoad) => {
    if (showLoad) {
      setLoading(true);
    }
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
  }, [selectedLeagueId, gameweek]);

  // Fetch matchup data
  const fetchMatchupData = useCallback(async (team1Id, team2Id, gameweek) => {
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
  }, []);

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

  useEffect(() => {
    const idleInterval = setInterval(() => {
      setIdleTime((prevIdleTime) => prevIdleTime + 1);
    }, 6000); // Increment idle time every minute

    // Reset idle time on mouse movement or keypress
    const resetIdleTime = () => setIdleTime(0);
    window.addEventListener('mousemove', resetIdleTime);
    window.addEventListener('keypress', resetIdleTime);

    return () => {
      // Clean up when component unmounts
      clearInterval(idleInterval);
      window.removeEventListener('mousemove', resetIdleTime);
      window.removeEventListener('keypress', resetIdleTime);
    };
  }, []);

  useEffect(() => {
    if (idleTime > 5) { // If user has been idle for more than 5 minutes
      setAutoRefresh(false); // Turn off auto-refresh
    }
  }, [idleTime]);

  useEffect(() => {
    let intervalId;

    if (autoRefresh) {
      // Fetch data immediately when autoRefresh is triggered
      if (teamID && gameweek) {
        fetchData(false);
        if (selectedMatchupId && selectedMatchupTeam1ID && selectedMatchupTeam2ID) {
          fetchMatchupData(selectedMatchupTeam1ID, selectedMatchupTeam2ID, gameweek);
        }
      }

      // Then set the interval for subsequent fetches
      intervalId = setInterval(() => {
        if (teamID && gameweek) {
          fetchData(false);
          if (selectedMatchupId && selectedMatchupTeam1ID && selectedMatchupTeam2ID) {
            fetchMatchupData(selectedMatchupTeam1ID, selectedMatchupTeam2ID, gameweek);
          }
        }
      }, 60000); // Refresh every minute
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId); // Clear the interval when the component unmounts or autoRefresh changes to false
      }
    };
  }, [autoRefresh, gameweek, selectedMatchupId, selectedMatchupTeam1ID, selectedMatchupTeam2ID, teamID, fetchData, fetchMatchupData]);

  return (
    <div className='main-container'>
      {loadingInputs ? (
        <div className="loading-wheel"></div>
      ) : (
        leagues.length > 0 ? (
          <>
            <div className="input-mainrow">
              {leagues.length > 0 && (
                <>
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
                    <button className='ripple-btn' onClick={() => fetchData(true)} disabled={!selectedLeagueId} style={{ opacity: selectedLeagueId ? 1 : 0.5 }}>Fetch</button>
                  </div>
                  <div className="input-row">
                    <div className="input-container">
                      <label htmlFor="refresh-switch">Refresh</label>
                      <label className="switch" id="refresh-switch">
                        <input type="checkbox" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} disabled={!leagueData} />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <></>
        )
      )}

      {loading ? (
        <div className="loading-bar"></div>
      ) : (
        leagueData && (
          <>
            <div className="matchups-container">
              {leagueData.results.map((match, index) => (
                <div key={match.id} className="matchup-container">
                  <div className="matchup-summary" onClick={match.entry_1_entry && match.entry_2_entry ? () => toggleMatchupDetails(match.id, match.entry_1_entry, match.entry_2_entry) : undefined} style={{ pointerEvents: match.entry_1_entry && match.entry_2_entry ? 'auto' : 'none' }}>
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
                        {Number(fetchedGameweek) === Number(maxGameweek) && (
                          <>
                            <tr>
                              <td className='blank-result-row' colSpan={'100%'}></td>
                            </tr>
                            <tr className='live-lead-row'>
                              <td colspan={'100%'} className={`live-lead ${Math.abs(match.entry_1_livepoints - match.entry_2_livepoints) < 6 ? 'small-lead' : Math.abs(match.entry_1_livepoints - match.entry_2_livepoints) < 12 ? 'medium-lead' : Math.abs(match.entry_1_livepoints - match.entry_2_livepoints) < 20 ? 'large-lead' : 'extra-large-lead'}`}>
                                Live Lead: {Math.abs(match.entry_1_livepoints - match.entry_2_livepoints)}
                              </td>
                            </tr>
                          </>
                        )}
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
                            <MatchupDetailsGen
                              team1Details={matchupData.team1Details}
                              team2Details={matchupData.team2Details}
                            />
                            <MatchupDetailsStarting
                              team1Details={matchupData.team1Details.startingPlayers}
                              team2Details={matchupData.team2Details.startingPlayers}
                              hideCommonPlayers={hideCommonPlayers}
                              hidePlayedPlayers={hidePlayedPlayers}
                            />
                            <MatchupDetailsBench
                              team1Details={matchupData.team1Details.benchPlayers}
                              team2Details={matchupData.team2Details.benchPlayers}
                            />
                          </div>
                        </>
                      )
                    ))}
                </div>
              ))}
              {(Number(fetchedGameweek) === Number(maxGameweek)) ? (
                <>
                  <div className='live-data'>
                    <h2 className='ripple-row' onClick={() => setLiveScoreboardVisible(!liveScoreboardVisible)}>Live Scoreboard</h2>
                    {liveScoreboardVisible && (
                      <table className="live-table info-table">
                        <thead>
                          <tr>
                            <th>Player Name</th>
                            <th>Team</th>
                            <th>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leagueData.results
                            .flatMap(match => [
                              ...(typeof match.entry_1_livepoints === 'number' ? [{ name: match.entry_1_name, playername: match.entry_1_player_name, score: match.entry_1_livepoints }] : []),
                              ...(typeof match.entry_2_livepoints === 'number' ? [{ name: match.entry_2_name, playername: match.entry_2_player_name, score: match.entry_2_livepoints }] : [])
                            ])
                            .sort((a, b) => b.score - a.score)
                            .map((player, index) => (
                              <tr key={index}>
                                <td>{player.playername}</td>
                                <td>{player.name}</td>
                                <td>{player.score}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {leagueData.bpsData.data.length > 0 ? (
                    <div className="live-data">
                      <h2 className='ripple-row' onClick={() => setBpsDataVisible(!bpsDataVisible)}>BPS Data (Live)</h2>
                      {bpsDataVisible && (
                        <table className="live-table info-table">
                          <thead>
                            <tr>
                              <th>Player Name</th>
                              <th>Team</th>
                              <th>BPS</th>
                              <th>Bonus</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leagueData.bpsData.data
                              .reduce((acc, player, index, arr) => {
                                if (index === 0 || player.fixture !== arr[index - 1].fixture) {
                                  acc.push(
                                    <tr className='bps-fixture-row' key={`fixture-${index}`}>
                                      <td colSpan="4">{player.fixture}</td>
                                    </tr>
                                  );
                                }
                                acc.push(
                                  <tr key={index}>
                                    <td>{player.name}</td>
                                    <td>{player.team}</td>
                                    <td>{player.value}</td>
                                    <td>{player.bonusPoints}</td>
                                  </tr>
                                );
                                return acc;
                              }, [])}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ) : (
                    <></>
                  )}
                </>
              ) : (
                <></>
              )}
            </div>
          </>
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
  const [loadingPlayerCard, setLoadingPlayerCard] = useState(false);

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
    } else if ((player1.playStatus === 'played' || player1.playStatus === 'playing') && (player2.playStatus === 'unplayed' || player2.playStatus === 'notplayed')) {
      player1Status = getSinglePlayerStatus(player1Score);
    } else if ((player2.playStatus === 'played' || player2.playStatus === 'playing') && (player1.playStatus === 'unplayed' || player1.playStatus === 'notplayed')) {
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
    player1Status = '☠️';
    player1Name += ' 🔻'
  } else if (player1 && player1.subStatus === "In") {
    player1Name += ' 🔼'
  }

  if (player2 && (player2.playStatus === 'unplayed' || player2.subStatus === "Out")) {
    player2Status = '☠️';
    player2Name += ' 🔻'
  } else if (player2 && player2.subStatus === "In") {
    player2Name += ' 🔼'
  }

  if (player1 && player1.playStatus === 'notplayed') {
    player1Status = '⏳';
  } else if (player1 && player1.playStatus === 'benched') {
    player1Status = '🪑';
  }

  if (player2 && player2.playStatus === 'notplayed') {
    player2Status = '⏳';
  } else if (player2 && player2.playStatus === 'benched') {
    player2Status = '🪑';
  }

  const handleRowClick = async () => {
    try {
      if (showPlayer1Card || showPlayer2Card) {
        setShowPlayer1Card(false);
        setShowPlayer2Card(false);
      } else {
        if (player1 || player2) {
          setLoadingPlayerCard(true);
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
        setLoadingPlayerCard(false);
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
      <tr>
        {loadingPlayerCard ? (
          <td colSpan={8}>
            <div className="loading-wheel"></div>
          </td>
        ) : (
          playerCardPopup
        )}
      </tr>
    </>
  );
};

const PlayerRowBench = ({ player1, player2 }) => {
  const player1Score = player1 ? player1.gameWeekScore : '';
  const player2Score = player2 ? player2.gameWeekScore : '';
  const player1Class = player1 ? `player ${player1.playStatus} ${player1.captainStatus}` : 'player';
  const player2Class = player2 ? `player ${player2.playStatus} ${player2.captainStatus}` : 'player';
  let player1Name = player1 && (player1.captainStatus === 'VC' || player1.captainStatus === 'C') ? player1.name + ` (${player1.captainStatus})` : player1 ? player1.name : '';
  let player2Name = player2 && (player2.captainStatus === 'VC' || player2.captainStatus === 'C') ? player2.name + ` (${player2.captainStatus})` : player2 ? player2.name : '';

  let player1Status = player1 ? (player1.playStatus === 'unplayed' ? '☠️' : player1.playStatus === 'not-played' ? '' : '➖') : null; // Ready symbol if played, dead symbol if not
  let player2Status = player2 ? (player2.playStatus === 'unplayed' ? '☠️' : player2.playStatus === 'not-played' ? '' : '➖') : null;  // Ready symbol if played, dead symbol if not

  if (player1 && player1.subStatus === "Out") {
    player1Status = '☠️';
    player1Name += ' 🔻';
  } else if (player1 && player1.subStatus === "In") {
    player1Name += ' 🔼';
    if (player1.playStatus === 'played' || player1.playStatus === 'playing') {
      player1Status = getSinglePlayerStatus(player1Score);
    } else if (player1.playStatus === 'benched') {
      player1Status = '🪑';
    }
  }

  if (player2 && player2.subStatus === "Out") {
    player2Status = '☠️';
    player2Name += ' 🔻';
  } else if (player2 && player2.subStatus === "In") {
    player2Name += ' 🔼';
    if (player2.playStatus === 'played' || player2.playStatus === 'playing') {
      player2Status = getSinglePlayerStatus(player1Score);
    } else if (player1.playStatus === 'benched') {
      player2Status = '🪑';
    }
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

const MatchupDetailsBench = ({ team1Details, team2Details }) => {
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

const MatchupDetailsGen = ({ team1Details, team2Details }) => {
  return (
    <div className="matchup-table-container">
      <table className="matchup-table info-table">
        <thead>
          <tr>
            <th>Transfer</th>
            <th>In Play</th>
            <th>Remain</th>
            <th>Transfer</th>
            <th>In Play</th>
            <th>Remain</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{team1Details.transferCost * -1}</td>
            <td>{team1Details.startingPlayers.filter(player => player.playStatus === 'playing').length + team1Details.benchPlayers.filter(player => player.subStatus === 'In' && player.playStatus === 'playing').length}</td>
            <td>{team1Details.startingPlayers.filter(player => player.playStatus === 'notplayed').length + team1Details.benchPlayers.filter(player => player.subStatus === 'In' && player.playStatus === 'notplayed').length}</td>
            <td>{team2Details.transferCost * -1}</td>
            <td>{team2Details.startingPlayers.filter(player => player.playStatus === 'playing').length + team2Details.benchPlayers.filter(player => player.subStatus === 'In' && player.playStatus === 'playing').length}</td>
            <td>{team2Details.startingPlayers.filter(player => player.playStatus === 'notplayed').length + team2Details.benchPlayers.filter(player => player.subStatus === 'In' && player.playStatus === 'notplayed').length}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const alignPlayers = (team1Details, team2Details) => {
  const positions = ['GKP', 'DEF', 'MID', 'FWD'];
  let alignedPlayers = [];
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

  // For each player1 in alignedPlayers which doesn't have a player2, select player2 with closest price from remaining players2
  // Get all the player2s that aren't matched
  let unmatchedPlayers2 = alignedPlayers.filter(p => p.player1 === null).map(p => p.player2);
  let toRemovePlayer2Ids = [];
  // For each player1 in alignedPlayers which doesn't have a player2, select player2 with closest price from unmatchedPlayers2
  alignedPlayers.forEach(alignedPlayer => {
    if (!alignedPlayer.player2) {
      let closestPlayer2;
      let closestPriceDiff = Infinity;
      unmatchedPlayers2.forEach(p2 => {
        const priceDiff = Math.abs(alignedPlayer.player1.price - p2.price);
        if (priceDiff < closestPriceDiff) {
          closestPlayer2 = p2;
          closestPriceDiff = priceDiff;
        }
      });
      if (closestPlayer2) {
        alignedPlayer.player2 = closestPlayer2;
        unmatchedPlayers2 = unmatchedPlayers2.filter(p2 => p2.id !== closestPlayer2.id);
        toRemovePlayer2Ids.push(closestPlayer2.id);
      }
    }
  });

  alignedPlayers = alignedPlayers.filter(alignedPlayer => alignedPlayer.player1 !== null || !toRemovePlayer2Ids.includes(alignedPlayer.player2.id));

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
import React, { useState } from 'react';
import './Components.css';
import './Shared.css';

function scoreClass(score) {
  if (score <= 2) return 'score-red';
  if (score <= 5) return 'score-orange';
  if (score <= 10) return 'score-green';
  return 'score-blue';
}
// FEATURE: [v2 4.1] Create ultra slim cards
export const PlayerCard = ({ player, showNextFix = true }) => {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <div key={player.name} className="player-frame">
      <div className="player-card-row">
        <div className="player-name">{player.name}</div>
        <div className="player-form">Form: {player.form}</div>
        <div className="player-price">£{player.cost}</div>
        <div className="player-team">{player.teamName}</div>
      </div>
      <div className="player-card-row">
        {['GKP', 'DEF'].includes(player.position) ? (
          <>
            <div className="player-base-stats player-ICT">ICT: {player.ICT}</div>
            <div className='player-base-stats'>xGI/90: {player.xGI90}</div>
            <div className='player-base-stats'>xGC/90: {player.xGC90}</div>
            <div className='player-base-stats'>CS/90: {player.CS90}</div>
          </>
        ) : (
          <>
            <div className="player-base-stats player-ICT">ICT: {player.ICT}</div>
            <div className='player-base-stats'>xG/90: {player.xG90}</div>
            <div className='player-base-stats'>xA/90: {player.xA90}</div>
          </>
        )}
      </div>
      <div className="player-card-row">
        <div className="player-current-fixture"><div>Live Fixture:</div> <div className='player-live-fixture-opp'>{player.currentGame.team}</div></div>
        <div className={`player-score ${scoreClass(parseInt(player.currentGame.score))}`}>
          <div className='player-substat player-points'>{player.currentGame.score} | {player.currentGame.minutes}'</div>
          <div className='player-substat'>xP: {player.currentGame.xP}</div>
        </div>
        <div className="player-stats">
          <div className={`player-substat ${player.currentGame.xG < 0.3 ? 'low-substat' : player.currentGame.xG < 0.6 ? 'medium-substat' : player.currentGame.xG < 1.0 ? 'high-substat' : 'high-high-substat'}`}>xG: {player.currentGame.xG}</div>
          <div className={`player-substat ${player.currentGame.xA < 0.3 ? 'low-substat' : player.currentGame.xA < 0.6 ? 'medium-substat' : player.currentGame.xA < 1.0 ? 'high-substat' : 'high-high-substat'}`}>xA: {player.currentGame.xA}</div>
        </div>
        <div className="player-stats">
          <div className={`player-substat ${player.currentGame.xGC < 0.2 && player.currentGame.minutes > 0 ? 'high-high-substat' : player.currentGame.xGC < 0.5 && player.currentGame.minutes > 0 ? 'high-substat' : player.currentGame.xGC < 1.0 && player.currentGame.minutes > 0 ? 'medium-substat' : 'low-substat'}`}>xGC: {player.currentGame.xGC}</div>
          <div className={`player-substat ${player.currentGame.ICT < 5 ? 'low-substat' : player.currentGame.ICT < 10 ? 'medium-substat' : player.currentGame.ICT < 15 ? 'high-substat' : 'high-high-substat'}`}>ICT: {player.currentGame.ICT}</div>
        </div>
      </div>
      {showNextFix && (
        <div className="player-card-row player-row-double-topborder player-row-double-botborder">
          <div className="player-upcoming-fixture">Upcoming: {player.upcomingGame.team}</div>
          <div className={`player-upcoming-xP fdr-faded-${player.upcomingGame.fdr}`}>FDR: {player.upcomingGame.fdr}</div>
          <div className={`player-upcoming-xP ${scoreClass(parseInt(player.upcomingGame.xP))}`}>xP: {player.upcomingGame.xP}</div>
        </div>
      )}
      <div className="player-card-row-divider"></div>
      <div className="player-card-row ripple-row player-row-double-topborder player-row-double-botborder" onClick={() => setShowDetails(!showDetails)}>
        {player.last5Scores.map((fixture, index) => (
          <div key={index} className={`player-fixture ${scoreClass(parseInt(fixture.score))}`}>
            {fixture.score} ({fixture.opposition}) GW{fixture.event}
          </div>
        ))}
      </div>
      {showDetails && (
        <div className="player-card-row">
          {player.last5Scores.map((fixture, index) => (
            <div key={index} className={`player-fixture-details player-row-double-botborder ${showDetails ? 'visible' : ''}`}>
              {fixture.minutes > 0 ? (
                <>
                  {['GKP', 'DEF'].includes(player.position) ? (
                    <>
                      <div className={`player-substat ${fixture.xGC < 0.2 && fixture.minutes >= 60 ? 'high-high-substat' : fixture.xGC < 0.5 && fixture.minutes >= 60  ? 'high-substat' : fixture.xGC < 1.0 && fixture.minutes >= 60 ? 'medium-substat' : 'low-substat'}`}>xGC: {fixture.xGC}</div>
                      <div className={`player-substat ${fixture.xGI < 0.2 ? 'low-substat' : fixture.xGI < 0.4 ? 'medium-substat' : fixture.xGI < 1.0 ? 'high-substat' : 'high-high-substat'}`}>xGI: {fixture.xGI}</div>
                    </>
                  ) : (
                    <>
                      <div className={`player-substat ${fixture.xG < 0.3 ? 'low-substat' : fixture.xG < 0.6 ? 'medium-substat' : fixture.xG < 1.0 ? 'high-substat' : 'high-high-substat'}`}>xG: {fixture.xG}</div>
                      <div className={`player-substat ${fixture.xA < 0.3 ? 'low-substat' : fixture.xA < 0.6 ? 'medium-substat' : fixture.xA < 1.0 ? 'high-substat' : 'high-high-substat'}`}>xA: {fixture.xA}</div>
                    </>
                  )}
                  <div className={`player-substat ${fixture.ICT < 5 ? 'low-substat' : fixture.ICT < 10 ? 'medium-substat' : fixture.ICT < 15 ? 'high-substat' : 'high-high-substat'}`}>ICT: {fixture.ICT}</div>
                </>
              ) : (
                <>
                  <div className="player-substat">DNP</div>
                  <div className="player-substat">DNP</div>
                  <div className="player-substat">DNP</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="player-card-row-divider"></div>
      <div className="player-card-row">
        {player.next5Fixtures.map((fixture, index) => (
          <div key={index} className={`player-fixture-next fdr-${fixture.fdr}`}>
            <div>{fixture.fixture}</div>
            <div>(GW{fixture.event})</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// BUG: Fix double borders on fixtures
// FEATURE: [2.0] Click on playername to bring up popup to compare with second player of choice. 
export const PlayerCardSlim = ({ player }) => {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <div key={player.name} className="player-frame-slim">
      <div className="player-card-row">
        <div className="player-name player-name-slim">{player.name}</div>
        <div className="player-price">£{player.cost}</div>
        <div className="player-team">{player.teamName}</div>
      </div>
      <div className="player-card-row">
        <div className="player-base-stats">Form: {player.form}</div>
        <div className="player-base-stats">ICT: {player.ICT}</div>
      </div>
      <div className="player-card-row">
        {['GKP', 'DEF'].includes(player.position) ? (
          <>
            <div className='player-base-stats'>xGI/90: {player.xGI90}</div>
            <div className='player-base-stats'>xGC/90: {player.xGC90}</div>
          </>
        ) : (
          <>
            <div className='player-base-stats'>xG/90: {player.xG90}</div>
            <div className='player-base-stats'>xA/90: {player.xA90}</div>
          </>
        )}
      </div>
      <div className="player-card-row">
        <div className="player-current-fixture"><div>Live Fixture:</div> <div className='player-live-fixture-opp'>{player.currentGame.team}</div></div>
        <div className={`player-score ${scoreClass(parseInt(player.currentGame.score))}`}>
          <div className='player-substat player-points'>{player.currentGame.score}</div>
          <div className='player-substat'>xP: {player.currentGame.xP}</div>
        </div>
      </div>
      <div className="player-card-row">
        <div className="player-stats">
          <div className={`player-substat ${player.currentGame.xG < 0.3 ? 'low-substat' : player.currentGame.xG < 0.6 ? 'medium-substat' : player.currentGame.xG < 1.0 ? 'high-substat' : 'high-high-substat'}`}>xG: {player.currentGame.xG}</div>
          <div className={`player-substat ${player.currentGame.xA < 0.3 ? 'low-substat' : player.currentGame.xA < 0.6 ? 'medium-substat' : player.currentGame.xA < 1.0 ? 'high-substat' : 'high-high-substat'}`}>xA: {player.currentGame.xA}</div>
        </div>
        <div className="player-stats">
          <div className={`player-substat ${player.currentGame.minutes >= 60 && player.currentGame.xGC < 0.2 ? 'high-high-substat' : player.currentGame.minutes >= 60 && player.currentGame.xGC < 0.5 ? 'high-substat' : player.currentGame.minutes >= 60 &&  player.currentGame.xGC < 1.0 ? 'medium-substat' : 'low-substat'}`}>xGC: {player.currentGame.xGC}</div>
          <div className={`player-substat ${player.currentGame.ICT < 5 ? 'low-substat' : player.currentGame.ICT < 10 ? 'medium-substat' : player.currentGame.ICT < 15 ? 'high-substat' : 'high-high-substat'}`}>ICT: {player.currentGame.ICT}</div>
        </div>
      </div>
      <div className="player-card-row-divider"></div>

      <div className="player-card-row-divider"></div>
      <div className="player-card-row ripple-row" onClick={() => setShowDetails(!showDetails)}>
        {player.last5Scores.slice(0, 3).map((fixture, index) => (
          <div key={index} className={`player-fixture ${showDetails ? '' : 'player-row-no-botborder player-fixture-rounded-border'} ${scoreClass(parseInt(fixture.score))}`}>
            <div>{fixture.score}</div>
            <div>({fixture.opposition})</div>
          </div>
        ))}
      </div>
      {showDetails && (
        <div className="player-card-row">
          {player.last5Scores.slice(0, 3).map((fixture, index) => (
            <div key={index} className={`player-fixture-details  ${showDetails ? 'player-row-no-botborder player-fixture-rounded-border visible' : ''}`}>
              {fixture.minutes > 0 ? (
                <>
                  {['GKP', 'DEF'].includes(player.position) ? (
                    <>
                      <div className={`player-substat ${fixture.minutes >= 60 && fixture.xGC < 0.2 ? 'high-high-substat' : fixture.minutes >= 60 && fixture.xGC < 0.5 ? 'high-substat' : fixture.minutes >= 60 &&  fixture.xGC < 1.0 ? 'medium-substat' : 'low-substat'}`}>xGC: {fixture.xGC}</div>
                      <div className={`player-substat ${fixture.xGI < 0.2 ? 'low-substat' : fixture.xGI < 0.4 ? 'medium-substat' : fixture.xGI < 1.0 ? 'high-substat' : 'high-high-substat'}`}>xGI: {fixture.xGI}</div>
                    </>
                  ) : (
                    <>
                      <div className={`player-substat ${fixture.xG < 0.3 ? 'low-substat' : fixture.xG < 0.6 ? 'medium-substat' : fixture.xG < 1.0 ? 'high-substat' : 'high-high-substat'}`}>xG: {fixture.xG}</div>
                      <div className={`player-substat ${fixture.xA < 0.3 ? 'low-substat' : fixture.xA < 0.6 ? 'medium-substat' : fixture.xA < 1.0 ? 'high-substat' : 'high-high-substat'}`}>xA: {fixture.xA}</div>
                    </>
                  )}
                  <div className={`player-substat ${fixture.ICT < 5 ? 'low-substat' : fixture.ICT < 10 ? 'medium-substat' : fixture.ICT < 15 ? 'high-substat' : 'high-high-substat'}`}>ICT: {fixture.ICT}</div>
                </>
              ) : (
                <>
                  <div className="player-substat">DNP</div>
                  <div className="player-substat">DNP</div>
                  <div className="player-substat">DNP</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const LiveLeagueScoreBoard = ({ leagueData, showRank = false }) => {
  const [liveScoreboardVisible, setLiveScoreboardVisible] = useState(false);
  const [teamDetailsVisible, setTeamDetailsVisible] = useState({});

  const toggleTeamDetails = (index) => {
    setTeamDetailsVisible(prevState => ({ ...prevState, [index]: !prevState[index] }));
  };

  return (
    <div className='live-data'>
      <h2 className='ripple-row' onClick={() => setLiveScoreboardVisible(!liveScoreboardVisible)}>
        {liveScoreboardVisible ? 'Live Scoreboard ▴' : 'Live Scoreboard ▾'}
      </h2>
      {liveScoreboardVisible && (
        <table className="live-table info-table slim-table">
          <thead>
            <tr>
              <th>Player Name</th>
              <th>Score</th>
              <th>Live</th>
              <th>Rem</th>
              {showRank &&
                <>
                  <th>Rank</th>
                </>
              }
            </tr>
          </thead>
          <tbody>
            {leagueData
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <>
                  <tr key={index} className='ripple-row' onClick={() => toggleTeamDetails(index)}>
                    <td>{player.playername} ({player.name}) {player.teamDetails.chipActive !== 'None' ? <span className={`chip-${player.teamDetails.chipActive}`}>{`${player.teamDetails.chipActive}`}</span> : ''}</td>
                    <td>{player.score}</td>
                    <td>{player.teamDetails.activePlayers}</td>
                    <td>{player.teamDetails.remainPlayer}</td>
                    {showRank &&
                      <>
                        <td>{player.rank}({player.rankChange > 0 ? <span className='green-arrow'>{`${player.rankChange}▲`}</span> : player.rankChange < 0 ? <span className='red-arrow'>{`${player.rankChange * -1}▼`}</span> : '➖'})</td>
                      </>
                    }
                  </tr>
                  <tr key={`team-${index}`}>
                    {teamDetailsVisible[index] && (
                      <td colSpan="100%">
                        <table className="matchup-table info-table">
                          <thead>
                            <tr>
                              {player.teamDetails.chipActive !== 'None' && (
                                <th>Chip</th>
                              )}
                              <th>Transfer</th>
                              <th>In Play</th>
                              <th>Remain</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                            {player.teamDetails.chipActive !== 'None' && (
                                <td>{player.teamDetails.chipActive}</td>
                              )}
                              <td>{player.teamDetails.transferCost * -1}</td>
                              <td>{player.teamDetails.activePlayers}</td>
                              <td>{player.teamDetails.remainPlayer}</td>
                            </tr>
                          </tbody>
                        </table>
                        <TeamDetailsStarting
                          teamDetails={player.teamDetails.startingPlayers}
                        />
                        <TeamDetailsBench
                          teamDetails={player.teamDetails.benchPlayers}
                        />
                      </td>
                    )}
                  </tr>
                </>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export const FixDataTable = ({ FixData }) => {
  const [fixDataVisible, setFixDataVisible] = useState(false);
  return (
    FixData && FixData.length > 0 ? (
      <div className="live-data">
        <h2 className='ripple-row' onClick={() => setFixDataVisible(!fixDataVisible)}>
          {fixDataVisible ? 'Fixture Data (Live) ▴' : 'Fixture Data (Live) ▾'}
        </h2>
        {fixDataVisible && (
          <table className="live-table info-table">
            <tbody>
              {FixData.map((fixture, index) => (
                <FixtureRow fixture={fixture} key={index} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    ) : (
      <></>
    )
  );
};

const FixtureRow = ({ fixture, key }) => {
  const [showFixtureDetails, setShowFixtureDetails] = useState(false);
  const colSpan = fixture.fixInfo.started && !fixture.fixInfo.finished ? 4 : 5;
  let fixtureClass = fixture.fixInfo.started && !fixture.fixInfo.finished ? 'bps-fixture-live' : fixture.fixInfo.finished ? 'bps-fixture-finished' : '';
  const fixtureTitle = `${fixture.fixInfo.teamHome} ${fixture.fixInfo.teamHomeScore}-${fixture.fixInfo.teamAwayScore} ${fixture.fixInfo.teamAway}`;
  const kickoffTime = new Date(fixture.fixInfo.kickOff);
  const localKickoffTime = kickoffTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const fixDataExists = fixture.BPSData.length > 0 || fixture.gameStats.goals.length > 0 || fixture.gameStats.assists.length > 0 || fixture.gameStats.ownGoals.length > 0 || fixture.gameStats.penSaved.length > 0 || fixture.gameStats.penMissed.length > 0;
  fixDataExists ? fixtureClass += ' ripple-row' : fixtureClass += '';
  return (
    <>
      <tr className={`bps-fixture-row ${fixtureClass}`} key={`fixture-${key}`} onClick={() => fixDataExists && setShowFixtureDetails(!showFixtureDetails)}>
        <td colSpan={colSpan}>{showFixtureDetails ? `${fixtureTitle} ▴` : `${fixtureTitle} ▾`}</td>
        {fixture.fixInfo.started && !fixture.fixInfo.finished && (
          <td>{fixture.fixInfo.minutes}'</td>
        )}
        <td colSpan={2}>{localKickoffTime}</td>
      </tr>
      {showFixtureDetails && (
        <>
          <FixtureStatsRow statsData={fixture.BPSData} type='BPS' minutesShown={fixture.fixInfo.started && !fixture.fixInfo.finished}/>
          <FixtureStatsRow statsData={fixture.gameStats.goals} type='Goals' minutesShown={fixture.fixInfo.started && !fixture.fixInfo.finished}/>
          <FixtureStatsRow statsData={fixture.gameStats.assists} type='Assists' minutesShown={fixture.fixInfo.started && !fixture.fixInfo.finished}/>
          <FixtureStatsRow statsData={fixture.gameStats.ownGoals} type='Own Goals' minutesShown={fixture.fixInfo.started && !fixture.fixInfo.finished}/>
          <FixtureStatsRow statsData={fixture.gameStats.penSaved} type='Pen Saved' minutesShown={fixture.fixInfo.started && !fixture.fixInfo.finished}/>
          <FixtureStatsRow statsData={fixture.gameStats.penMissed} type='Pen Missed' minutesShown={fixture.fixInfo.started && !fixture.fixInfo.finished}/>
          <FixtureStatsRow statsData={fixture.gameStats.redCards} type='Red Card' minutesShown={fixture.fixInfo.started && !fixture.fixInfo.finished}/>
        </>
      )}
    </>
  )
}

// TODO: Add player card popup on click
const FixtureStatsRow = ({ statsData, type, minutesShown }) => {
  const colSpan = minutesShown ? 4 : 3;
  return (
    <>
      {statsData.length > 0 && (
        <>
          <tr className='stat-heading'><td colSpan={100}>{type}</td></tr>  
          <tr className='stat-sub-heading'>
            <td colSpan={colSpan} width={'60%'}>Player</td>
            <td>Team</td>
            {type === 'BPS' ? (
              <>
                <td>BPS</td>
                <td>Points</td>
              </>
            ) : (
              <td colSpan={2}>{type}</td>
            )}
          </tr>
          {statsData
            .sort((a, b) => b.value - a.value)
            .map((player, index) => (
              <tr className='stat-row' key={`player-${index}`}>
                <td colSpan={colSpan}>{player.name}</td>
                <td>{player.team}</td>
                <td colSpan={type === 'BPS' ? 1 : 2}>{player.value}</td>
                {type === 'BPS' && (
                  <td>{player.bonusPoints}</td>
                )}
              </tr>
            ))}
        </>
      )}
    </>
  );
}

const TeamDetailsStarting = ({ teamDetails }) => {
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
          </tr>
        </thead>
        <tbody>
          {teamDetails.map((player, index) => (
            <PlayerSingleRow
              key={index}
              player={player}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TeamDetailsBench = ({ teamDetails }) => {
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
          </tr>
        </thead>
        <tbody>
          {teamDetails.map((player, index) => (
            <PlayerSingleRow
              key={index}
              player={player}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};


const PlayerSingleRow = ({ player }) => {
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const [loadingPlayerCard, setLoadingPlayerCard] = useState(false);

  const playerScore = player ? player.finalGameWeekPoints : '';

  const playerClass = player ? `player ${player.playStatus} ${player.captainStatus}` : 'player';
  let playerName = player && (player.captainStatus === 'VC' || player.captainStatus === 'C') ? player.name + ` (${player.captainStatus})` : player ? player.name : '';

  // Determine the status of the players based on their scores
  let playerStatus = player ? '' : null;

  if (player) {
    if (player.playStatus === 'played' || player.playStatus === 'playing') {
      playerStatus = getSinglePlayerStatus(playerScore);
    }
  }

  if (player && (player.playStatus === 'unplayed' || player.subStatus === "Out")) {
    playerStatus = '☠️';
    if (player.subStatus === "Out") {
      playerName += ' 🔻';
    }
  } else if (player && player.subStatus === "In") {
    playerName += ' 🔼'
  }

  if (player && player.playStatus === 'notplayed') {
    playerStatus = '⏳';
  } else if (player && player.playStatus === 'benched') {
    playerStatus = '🪑';
  }

  const handleRowClick = async () => {
    try {
      if (showPlayerCard) {
        setShowPlayerCard(false);
      } else {
        if (player) {
          setLoadingPlayerCard(true);
          let playerResponseData = [];

          if (player) {
            const playersResponse = await fetch(`/api/h2h/player-matchup/${player.id}`);
            playerResponseData = await playersResponse.json();
          }

          if (playerResponseData.length > 0 && !playerResponseData.apiLive) {
            alert("The FPL API is not live.");
          } else {
            if (playerResponseData.data) {
              setPlayerData(playerResponseData.data);
              setShowPlayerCard(true);
            } else {
              setPlayerData([]);
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

  const playerCardPopup = showPlayerCard ? (
    <>
      {playerData && (
        showPlayerCard ? (
          <td className="player-card-popup" colSpan={4}>
            <PlayerCardSlim player={playerData} />
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
        <td className={playerClass}>{playerName}</td>
        <td className={playerClass}>{player ? player.position : ''}</td>
        <td className={playerClass}>{playerScore}</td>
        <td className={playerClass}>{playerStatus}</td>
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


export const getSinglePlayerStatus = (playerScore) => {
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
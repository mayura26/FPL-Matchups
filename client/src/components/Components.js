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
export const PlayerCard = ({ player, showNextFix=true }) => {
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
          <div className='player-substat player-points'>{player.currentGame.score}</div>
          <div className='player-substat'>xP: {player.currentGame.xP}</div>
        </div>
        <div className="player-stats">
          <div className="player-substat">xG: {player.currentGame.xG}</div>
          <div className="player-substat">xA: {player.currentGame.xA}</div>
        </div>
        <div className="player-stats">
          <div className="player-substat">xGC: {player.currentGame.xGC}</div>
          <div className="player-substat">ICT: {player.currentGame.ICT}</div>
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
      <div className="player-card-row ripple-row" onClick={() => setShowDetails(!showDetails)}>
        {player.last5Scores.map((fixture, index) => (
          <div key={index} className={`player-fixture ${scoreClass(parseInt(fixture.score))}`}>
            {fixture.score} ({fixture.opposition}) GW{fixture.event}
          </div>
        ))}
      </div>
      {showDetails && (
        <div className="player-card-row">
          {player.last5Scores.map((fixture, index) => (
            <div key={index} className={`player-fixture-details ${showDetails ? 'visible' : ''}`}>
              {fixture.minutes > 0 ? (
                <>
                  {['GKP', 'DEF'].includes(player.position) ? (
                    <>
                      <div className={`player-substat ${fixture.xGC < 0.2 ? 'high-high-substat' : fixture.xGC < 0.5 ? 'high-substat' : fixture.xGC < 1.0 ? 'medium-substat' : 'low-substat'}`}>xGC: {fixture.xGC}</div>
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
          <div className="player-substat">xG: {player.currentGame.xG}</div>
          <div className="player-substat">xA: {player.currentGame.xA}</div>
        </div>
        <div className="player-stats">
          <div className="player-substat">xGC: {player.currentGame.xGC}</div>
          <div className="player-substat">ICT: {player.currentGame.ICT}</div>
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
                      <div className={`player-substat ${fixture.xGC < 0.2 ? 'high-high-substat' : fixture.xGC < 0.5 ? 'high-substat' : fixture.xGC < 1.0 ? 'medium-substat' : 'low-substat'}`}>xGC: {fixture.xGC}</div>
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
              <th>Active</th>
              <th>Rem</th>
              {showRank &&
                <>
                  <th>Rank</th>
                  <th>Chg</th>
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
                    <td>{player.playername} ({player.name})</td>
                    <td>{player.score}</td>
                    <td>{player.teamDetails.activePlayers}</td>
                    <td>{player.teamDetails.remainPlayer}</td>
                    {showRank &&
                      <>
                        <td>{player.liveRank}</td>
                        <td>{player.liveChange > 0 ? `${player.liveChange}🔼` : player.liveChange < 0 ? `${player.liveChange * -1}🔻` : '➖'}</td>
                      </>
                    }
                  </tr>
                  <tr key={`team-${index}`}>
                    {teamDetailsVisible[index] && (
                      <td colSpan="100%">
                          <table className="matchup-table info-table">
                            <thead>
                              <tr>
                                <th>Transfer</th>
                                <th>In Play</th>
                                <th>Remain</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
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

// FEATURE: [5.0] Show goals and assists as a row for each fixture
// TODO: Add kickoff time to each game
export const BPSTable = ({ BPSData }) => {
  const [bpsDataVisible, setBpsDataVisible] = useState(false);
  return (
    BPSData.length > 0 ? (
      <div className="live-data">
        <h2 className='ripple-row' onClick={() => setBpsDataVisible(!bpsDataVisible)}>
          {bpsDataVisible ? 'BPS Data (Live) ▴' : 'BPS Data (Live) ▾'}
        </h2>
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
              {BPSData
                .reduce((acc, player, index, arr) => {
                  if (index === 0 || player.fixture !== arr[index - 1].fixture) {
                    acc.push(
                      <tr className='bps-fixture-row' key={`fixture-${index}`}>
                        <td colSpan="4">{player.fixture}</td>
                      </tr>
                    );
                  }
                  if (player.element > 0) {
                    acc.push(
                      <tr key={index}>
                        <td>{player.name}</td>
                        <td>{player.team}</td>
                        <td>{player.value}</td>
                        <td>{player.bonusPoints}</td>
                      </tr>
                    );
                  };

                  return acc;
                }, [])}
            </tbody>
          </table>
        )}
      </div>
    ) : (
      <></>
    )
  );
};

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
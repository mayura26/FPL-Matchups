import React, { useState } from 'react';
import './PlayerCard.css';
import './Shared.css';

function scoreClass(score) {
    if (score <= 2) return 'score-red';
    if (score <= 5) return 'score-orange';
    if (score <= 10) return 'score-green';
    return 'score-blue';
}

export const PlayerCard = ({ player, showNextFix }) => {
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
                <div className="player-card-row">
                    <div className="player-upcoming-fixture">Upcoming: {player.upcomingGame.team}</div>
                    <div className="player-upcoming-xP">FDR: {player.upcomingGame.fdr}</div>
                    <div className="player-upcoming-xP">xP: {player.upcomingGame.xP}</div>
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

// FEATURE: [3] Click on playername to bring up popup to compare with second player of choice. 
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
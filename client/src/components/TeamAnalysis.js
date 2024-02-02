import React, { useState, useEffect, useContext } from 'react';
import './TeamAnalysis.css';
import './Shared.css';
import { TeamContext } from './Context';
import { PlayerCard } from './Components';
import { LoadingBar } from './Shared';

function TeamAnalysis() {
    const { teamID } = useContext(TeamContext);
    const [gamedata, setGamedata] = useState(null);  // Initialize as null
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.title = 'FPL Matchup | Team Analysis';
      }, []);

    // Fetch the current gameweek when the component mounts
    useEffect(() => {
        const fetchCurrentGameweek = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/game-data');
                const data = await response.json();
                if (!data.apiLive) {
                    alert("The FPL API is not live.");
                } else {
                    setGamedata(data.data);
                }
            } catch (error) {
                alert("Error fetching game data", error);
                console.error("Error fetching game data", error);
            }
        };

        fetchCurrentGameweek();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/ta/${teamID}/${gamedata.currentGameweek}`);
                const data = await response.json();
                if (!data.apiLive) {
                    alert("The FPL API is not live.");
                } else {
                    if (data.data === false) {
                        alert("Team ID does not exist");
                    } else {
                        setTeamData(data.data);
                    }
                }
            } catch (error) {
                alert("Error fetching team gw data", error);
                console.error("Error fetching team gw data:", error);
            }
            setLoading(false);
        };
        if (gamedata) {
            fetchData();
        }
    }, [gamedata, teamID]);

    return (
        <div className="main-container" data-testid="team-analysis">
            {loading ? (
                <LoadingBar animationDuration={6} />
            ) : (
                teamData && (
                    <div className="team-data">
                        <div className="player-data">
                            <div className='manager-name'>
                                {/* FEATURE: [v2 3.0] Add compare to another team with popup being H2H popup */}
                                <h2>{teamData.managerName}</h2>
                            </div>
                            <div className='player-info'>
                                <div>Current Score: {teamData.overallPoints} </div>
                                <div>Rank: {teamData.overallRank}</div>
                            </div>
                        </div>
                        <div className="players-data">
                            <PlayerData players={teamData.playersStarting} benchPlayers={false} gamedata={gamedata} />
                            <PlayerData players={teamData.playersBench} benchPlayers={true} gamedata={gamedata} />
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

const PlayerData = ({ players, benchPlayers, gamedata }) => {
    // Group players by their positions
    const playersGroupedByPosition = players.reduce((groups, player) => {
        const position = player.position;
        if (!groups[position]) {
            groups[position] = [];
        }
        groups[position].push(player);
        return groups;
    }, {});

    return (
        <div>
            <h3 className='team-type-header'>{benchPlayers ? "Bench" : "Starters"}</h3>
            {benchPlayers ? (
                <div className="players-data-set">
                    {players.map(player => (
                        <PlayerCard key={player.id} player={player} showNextFix={gamedata.isFinshed} />
                    ))}
                </div>
            ) : (
                <div className="players-data-set">
                    {Object.entries(playersGroupedByPosition).map(([position, players]) => (
                        <>
                            
                            <div className='positions-set' key={position}>
                            <h4 className='position-header'>{position}</h4>
                                {players.map(player => (
                                    <PlayerCard key={player.id} player={player} showNextFix={gamedata.isFinshed} />
                                ))}
                            </div>
                        </>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeamAnalysis;

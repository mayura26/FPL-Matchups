import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
export const TeamContext = createContext();

export const TeamContextProvider = ({ children }) => {
    const [teamID, setTeamID] = useState("948006");
    const [h2HLeagueID, setH2HLeagueID] = useState(null);
    const [classicLeagueID, setClassicLeagueID] = useState(null);

    useEffect(() => {
        // Check if a teamID is stored in cookies
        const storedTeamID = Cookies.get('TeamID');
        if (storedTeamID) {
            setTeamID(storedTeamID);
        }

        const storedH2HLeagueID = Cookies.get('H2HLeagueID');
        if (storedH2HLeagueID) {
            setH2HLeagueID(storedH2HLeagueID);
        }

        const storedClassicLeagueID = Cookies.get('ClassicLeagueID');
        if (storedClassicLeagueID) {
            setClassicLeagueID(storedClassicLeagueID);
        }

    }, []);

    const updateTeamID = (newTeamID) => {
        setTeamID(newTeamID);
        updateH2HLeagueID(null); // Reset H2HLeagueID
        updateClassicLeagueID(null); // Reset ClassicLeagueID
        Cookies.set('TeamID', newTeamID); // Save to cookies
    };

    const updateH2HLeagueID = (newH2HLeagueID) => {
        setH2HLeagueID(newH2HLeagueID);
        Cookies.set('H2HLeagueID', newH2HLeagueID); // Save to cookies
    };

    const updateClassicLeagueID = (newClassicLeagueID) => {
        setClassicLeagueID(newClassicLeagueID);
        Cookies.set('ClassicLeagueID', newClassicLeagueID); // Save to cookies
    };

    return (
        <TeamContext.Provider value={{ teamID, updateTeamID, h2HLeagueID, updateH2HLeagueID, classicLeagueID, updateClassicLeagueID }}>
            {children}
        </TeamContext.Provider>
    );
};

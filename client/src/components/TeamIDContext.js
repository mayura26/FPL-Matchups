import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const TeamIDContext = createContext();

export const TeamIDProvider = ({ children }) => {
    const [teamID, setTeamID] = useState("948006");

    useEffect(() => {
        // Check if a teamID is stored in cookies
        const storedTeamID = Cookies.get('teamID');
        if (storedTeamID) {
            setTeamID(storedTeamID);
        }
    }, []);

    const updateTeamID = (newTeamID) => {
        setTeamID(newTeamID);
        Cookies.set('teamID', newTeamID, { expires: 7 }); // Save to cookies
    };

    return (
        <TeamIDContext.Provider value={{ teamID, updateTeamID }}>
            {children}
        </TeamIDContext.Provider>
    );
};

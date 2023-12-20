import React, { useEffect } from 'react';
import './Shared.css';
export function LoadingBar({ animationDuration }) {
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .loading-bar::before {
                animation: loading ${animationDuration}s linear infinite;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, [animationDuration]);

    return <div className="loading-bar"></div>;
}
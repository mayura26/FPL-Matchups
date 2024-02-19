import { useEffect, useState } from 'react';
import './InstallPwaPopup.css';
import logo from '../NavBarLogo.png';

function InstallPwaPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const showTimeout = setTimeout(() => {
      const lastShownTime = localStorage.getItem('lastShownTime');
      const currentTime = new Date().getTime();
      const twoHours = 2 * 60 * 60 * 1000; // Two hours in milliseconds
      if (!lastShownTime || currentTime - lastShownTime >= twoHours) {
        setShowPopup(true);
        localStorage.setItem('lastShownTime', currentTime);
      } else {
        setShowPopup(false);
      }
    }, 200);

    const hideTimeout = setTimeout(() => {
      setShowPopup(false);
    }, 15000);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', async (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      const relatedApps = await navigator.getInstalledRelatedApps();

      // TODO: Update with correct name
      const psApp = relatedApps.find((app) => app.id === "com.example.fplmatchups");

      if (psApp) {
        supressPopup();
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener("appinstalled", () => {
      supressPopup();
    });
  }, []);

  const handleClick = () => {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
    });
  };

  return (
    <div className='install-banner'>
      {showPopup && deferredPrompt && (
        <Popup handleClick={handleClick} />
      )}
    </div>
  );
}

function supressPopup() {
  const popup = document.querySelector('.pwa-popup');
  popup.style.display = 'none';
}

function Popup({ handleClick }) {
  const handleClose = () => {
    // Close the popup
    supressPopup();
  };

  return (
    <div className="pwa-popup">
      <img src={logo} alt="App icon" className="app-icon" />
      <div className='install-buttons'>
        <button className="install-button" onClick={handleClick}>
          Install App
        </button>
        <button onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default InstallPwaPopup;
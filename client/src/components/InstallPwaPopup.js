import { useEffect, useState } from 'react';
import './InstallPwaPopup.css';
import logo from '../NavBarLogo.png';

function InstallPwaPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

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
      {deferredPrompt && (
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
      <button className="install-button" onClick={handleClick}>
        Install App
      </button>
      <button onClick={handleClose}>
        Close
      </button>
    </div>
  );
}

export default InstallPwaPopup;
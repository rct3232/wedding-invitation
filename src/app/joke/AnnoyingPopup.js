import React, { useEffect, useState } from "react";
import styles from "./AnnoyingPopup.module.css";
import NyanCatRain from "./NyanCatRain"; // Import the NyanCatRain component
import Cat from "./Cat"; // Import the Cat component

export default function AnnoyingPopup() {
  const [popups, setPopups] = useState([]); // Initial popup
  const [popupCount, setPopupCount] = useState(1); // Track total number of popups
  const [showNyanCatRain, setShowNyanCatRain] = useState(false); // State to trigger NyanCatRain
  const [showCat, setShowCat] = useState(false); // State to trigger Cat module

  useEffect(() => {
    const timer = setTimeout(() => {
      setPopups([{ id: 1, x: 50, y: 50 }]); // Show the first popup after 15 seconds
    }, 15000);

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, []);

  const closePopup = (id) => {
    setPopups((prevPopups) => prevPopups.filter((popup) => popup.id !== id)); // Remove the closed popup

    if (popupCount < 20) {
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          setPopups((currentPopups) => [
            ...currentPopups,
            {
              id: Math.random(), // Unique ID
              x: Math.min(Math.max(Math.random() * 80 + 10, 5), 95), // Clamp x position (5% to 95%)
              y: Math.min(Math.max(Math.random() * 80 + 10, 5), 95), // Clamp y position (5% to 95%)
            },
          ]);
        }, i * 100); // 0.1-second delay between each popup
      }
      setPopupCount((count) => count + 2); // Increment popup count by 2
    } else if (popups.length === 1) {
      // Trigger NyanCatRain when the last popup is closed
      setShowNyanCatRain(true);
    }
  };

  const handleNyanCatRainComplete = () => {
    setShowNyanCatRain(false); // Unmount NyanCatRain
    setShowCat(true); // Show Cat module after NyanCatRain finishes
  };

  return (
    <>
      {popups.map((popup) => (
        <div
          key={popup.id}
          className={styles.popup}
          style={{
            top: `${popup.y}%`,
            left: `${popup.x}%`,
            transform: "translate(-50%, -50%)", // Center the popup
          }}
        >
          <h2>Surprise!</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <button
            className={styles.confirm}
            onClick={() => closePopup(popup.id)}
          >
            Close
          </button>
        </div>
      ))}
      {showNyanCatRain && <NyanCatRain onComplete={handleNyanCatRainComplete} />}
      {showCat && <Cat />}
    </>
  );
}

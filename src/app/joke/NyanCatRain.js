import React, { useEffect, useState } from "react";
import styles from "./NyanCatRain.module.css";

export default function NyanCatRain({ onComplete }) {
  const [cats, setCats] = useState([]);
  const [allCatsOffScreen, setAllCatsOffScreen] = useState(false);

  useEffect(() => {
    const totalCats = Math.floor(Math.random() * 11) + 30; // Random count between 30 and 40
    const viewportHeight = window.innerHeight; // Get the viewport height
    const viewportWidth = window.innerWidth; // Get the viewport width
    const newCats = Array.from({ length: totalCats }, (_, index) => {
      const height = Math.random() * 0.4 * viewportHeight + 0.5 * viewportHeight; // Random height between 50% and 90% of viewport height
      const width = height * (500 / 300); // Maintain aspect ratio (500:300)
      return {
        id: index,
        height,
        width,
        top: Math.random() * 200 - 50, // Random vertical position between -50% and 150% of the viewport height
        duration: Math.random() * 1 + 1, // Random animation duration (1s to 2s)
        startLeft: -width - 10, // Start completely off-screen on the left
        endRight: viewportWidth + width + 10, // End completely off-screen on the right
      };
    });
    setCats(newCats);
  }, []);

  useEffect(() => {
    if (allCatsOffScreen && onComplete) {
      onComplete(); // Notify parent component when all cats are off-screen
    }
  }, [allCatsOffScreen, onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAllCatsOffScreen(true); // Set allCatsOffScreen to true after the longest animation duration
    }, 2000); // Maximum animation duration (2 seconds)

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, []);

  if (allCatsOffScreen) {
    return null; // Unmount the component
  }

  return (
    <>
      {cats.map((cat) => (
        <img
          key={cat.id}
          src="/joke/nyan-cat.gif"
          alt="Nyan Cat"
          className={styles.nyanCat}
          style={{
            width: `${cat.width}px`,
            height: `${cat.height}px`,
            top: `${cat.top}%`, // Adjust vertical position to cover -50% to 150%
            animationDuration: `${cat.duration}s`,
            left: `${cat.startLeft}px`, // Adjust starting position based on width
            "--end-right": `${cat.endRight}px`, // Pass the end position as a CSS variable
          }}
        />
      ))}
    </>
  );
}

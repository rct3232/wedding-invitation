import React, { useState, useEffect } from "react";
import styles from "./Cat.module.css";

export default function Cat() {
  const [isFirstImage, setIsFirstImage] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: window.innerHeight }); // Start at bottom-left
  const [isFlying, setIsFlying] = useState(false); // Flying state
  const [isWalking, setIsWalking] = useState(false); // Walking state
  const [walkFrame, setWalkFrame] = useState(0); // Current frame of walking animation
  const [targetPosition, setTargetPosition] = useState(null); // Target position for flying
  const [walkTargetPosition, setWalkTargetPosition] = useState(null); // Target position for walking

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFirstImage((prev) => !prev); // Toggle between images
    }, 500); // Change image every 0.5 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  useEffect(() => {
    if (targetPosition) {
      // Update position after flip is completed for flying
      const { x, y } = targetPosition;
      const midX = (x + position.x) / 2; // Midpoint for parabolic trajectory
      const midY = Math.min(y, position.y) - 200; // Raise the midpoint for the arc

      setIsFlying(true);

      // Animate to the midpoint
      setPosition({ x: midX, y: midY });

      setTimeout(() => {
        // Animate to the final position
        setPosition({ x, y });

        setTimeout(() => {
          // Return to the bottom directly below the event's X-coordinate
          setPosition({ x, y: window.innerHeight });

          setTimeout(() => {
            setIsFlying(false); // Stop flying after landing
          }, 500); // Delay for landing animation
        }, 500); // Delay for arc animation
      }, 500); // Delay for midpoint animation
    }
  }, [targetPosition]);

  useEffect(() => {
    const handleFly = (event) => {
      if (isFlying || isWalking) return; // Ignore events if the cat is flying, walking, or playing

      const targetX = event.clientX || event.touches?.[0]?.clientX; // Get click/touch X
      const targetY = event.clientY || event.touches?.[0]?.clientY; // Get click/touch Y

      if (targetX !== undefined && targetY !== undefined) {
        if (targetX < position.x) {
          // Flip immediately without re-rendering
          document.documentElement.style.setProperty("--cat-scale-x", "-1");
        } else {
          document.documentElement.style.setProperty("--cat-scale-x", "1");
        }

        // Trigger position update after flip
        setTimeout(() => {
          setTargetPosition({ x: targetX, y: targetY });
        }, 100); // Delay to ensure flip happens before movement
      }
    };

    // Add global event listeners for click and touch
    window.addEventListener("click", handleFly);
    window.addEventListener("touchstart", handleFly);

    return () => {
      // Cleanup event listeners on unmount
      window.removeEventListener("click", handleFly);
      window.removeEventListener("touchstart", handleFly);
    };
  }, [position, isFlying, isWalking]);

  useEffect(() => {
    if (walkTargetPosition) {
      // Update position after flip is completed for walking
      const { x } = walkTargetPosition;

      setIsWalking(true);

      // Animate walking
      const walkAnimation = setInterval(() => {
        setWalkFrame((prev) => (prev + 1) % 4); // Cycle through 4 walking frames
      }, 500);

      setPosition({ x, y: window.innerHeight });

      setTimeout(() => {
        clearInterval(walkAnimation); // Stop walking animation
        setIsWalking(false);
      }, 2000); // Walk duration (2 seconds)
    }
  }, [walkTargetPosition]);

  useEffect(() => {
    if (isFlying) return; // Do not walk while flying

    const walkInterval = setInterval(() => {
      const shouldWalk = Math.random() < 0.5; // 50% chance to start walking
      if (shouldWalk) {
        const direction = Math.random() < 0.5 ? -1 : 1; // Randomly choose left (-1) or right (1)
        const distance = Math.random() * 0.3 * window.innerWidth + 0.2 * window.innerWidth; // Random distance (20% to 50% of screen width)
        const targetX = Math.min(
          Math.max(position.x + direction * distance, 0),
          window.innerWidth - 100 // Ensure the cat stays within the screen
        );

        if (direction === -1) {
          // Flip immediately without re-rendering
          document.documentElement.style.setProperty("--cat-scale-x", "-1");
        } else {
          document.documentElement.style.setProperty("--cat-scale-x", "1");
        }

        // Trigger position update after flip
        setTimeout(() => {
          setWalkTargetPosition({ x: targetX });
        }, 100); // Delay to ensure flip happens before movement
      }
    }, Math.random() * 5000 + 3000); // Random interval between 3 and 8 seconds

    return () => clearInterval(walkInterval); // Cleanup interval on unmount
  }, [position, isFlying]);

  const walkImages = [
    "/joke/cat_walk_1.png",
    "/joke/cat_walk_2.png",
    "/joke/cat_walk_3.png",
    "/joke/cat_walk_2.png",
  ];

  return (
    <img
      src={
        isFlying
          ? "/joke/cat_jump.png"
          : isWalking
          ? walkImages[walkFrame]
          : `/joke/${isFirstImage ? "cat_basic_1.png" : "cat_basic_2.png"}`
      }
      alt="Cat"
      className={styles.cat}
      style={{
        transform: `translate(${position.x}px, ${position.y - window.innerHeight}px) scaleX(var(--cat-scale-x, 1))`,
        transition: isFlying || isWalking ? "transform 2s linear" : "none", // Smooth movement while flying or walking
      }}
    />
  );
}

// src/app/modules/ConfettiPile.js
"use client";

import React, { useEffect, useRef } from 'react';

const ConfettiPile = ({
  pileSize, // 0-100, determines how "full" the pile is
  colors, // Array of color strings
  shapeSVGPath, // SVG path string for the confetti shape
  canvasWidth, // Full width of the canvas
  targetPileHeight, // Max height in pixels the pile should reach at pileSize 100
  particleScale = 1.5, // Added particleScale prop with a default value
}) => {
  const canvasRef = useRef(null);

  // Helper to draw a single confetti piece
  const drawSingleConfetti = (ctx, x, y, color, rotation) => {
    if (!shapeSVGPath) return;
    const path = new Path2D(shapeSVGPath);
    ctx.fillStyle = color;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(particleScale, particleScale); // Apply scaling
    // The translation point (x,y) now effectively becomes the center of the scaled shape
    // if the SVG path is defined around a (0,0) origin.
    // If path is not defined around (0,0), this might shift particles.
    // For simple shapes, often they are defined starting from top-left (0,0) or centered.
    // If path is e.g. 10x10 units, scaling by 1.5 makes it 15x15.
    // We might need to translate by -scaledWidth/2, -scaledHeight/2 if path origin isn't centered.
    // For now, this basic scaling is a starting point.
    ctx.fill(path);
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colors || !shapeSVGPath) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (pileSize === 0) return;

    // Determine the current height of the pile based on pileSize
    const currentMaxY = canvas.height; // Bottom of the canvas
    const currentMinY = canvas.height - (targetPileHeight * (pileSize / 100));

    // Estimate number of particles based on pileSize and density
    // This is a rough estimation and might need tweaking.
    // Let's aim for a certain density, e.g., X particles per 100x100px area of the pile.
    const pileArea = canvas.width * (targetPileHeight * (pileSize / 100));
    const particleDensityFactor = 0.005; // particles per square pixel, adjust as needed
    const numParticles = Math.floor(pileArea * particleDensityFactor);

    for (let i = 0; i < numParticles; i++) {
      // Distribute particles more densely at the bottom of the pile area
      const yFraction = Math.pow(Math.random(), 0.5); // Bias towards bottom
      const y = currentMaxY - (yFraction * (currentMaxY - currentMinY));

      // X position can be anywhere across the canvas width
      // Could add some horizontal clustering towards the center if desired
      const x = Math.random() * canvas.width;

      const color = colors[Math.floor(Math.random() * colors.length)];
      const rotation = Math.random() * 360; // Random rotation

      // Simple check to avoid drawing too far out of the intended pile area
      if (y >= currentMinY - 10) { // Allow some spillover
         drawSingleConfetti(ctx, x, y, color, rotation);
      }
    }

  }, [pileSize, colors, shapeSVGPath, canvasWidth, targetPileHeight]);

  // Set canvas height to targetPileHeight to only take up necessary space
  // Width will be 100% of its container (or canvasWidth if provided explicitly)
  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth || '100%'}
      height={targetPileHeight}
      style={{
        display: 'block', // To avoid extra space under canvas
        position: 'fixed',
        bottom: 0,
        left: 0,
        zIndex: 99, // Below react-confetti's typical z-index (often 100)
        pointerEvents: 'none', // Allow clicks to pass through
      }}
    />
  );
};

export default ConfettiPile;

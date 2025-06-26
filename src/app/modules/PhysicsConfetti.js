// src/app/modules/PhysicsConfetti.js
"use client";

import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

const PhysicsConfetti = ({
  colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5'], // Default colors
  shapeSVGPath = '', // Will be used for rendering if provided
  particleVisualScale = 1.0, // New prop for scaling SVG visual
  canvasWidth,
  canvasHeight,
}) => {
  const sceneRef = useRef(null); // For the canvas element (or its parent)
  const engineRef = useRef(Matter.Engine.create());
  const runnerRef = useRef(Matter.Runner.create());
  const renderRef = useRef(null);
  const preRenderedPathRef = useRef(null); // For caching the Path2D object

  useEffect(() => {
    // Attempt to create/cache the Path2D object when shapeSVGPath changes or is first available
    if (shapeSVGPath) {
      try {
        preRenderedPathRef.current = new Path2D(shapeSVGPath);
      } catch (e) {
        console.warn("Failed to create Path2D from shapeSVGPath:", e, shapeSVGPath);
        preRenderedPathRef.current = null; // Ensure it's null if invalid
      }
    } else {
      preRenderedPathRef.current = null;
    }

    const engine = engineRef.current;
    engine.world.gravity.y = 0.6; // Adjusted gravity for lighter confetti feel
    // Matter.Sleeping.set(engine.world, true); // enableSleeping is true by default, and Matter.Engine.create() sets it.


    // Ensure canvasWidth and canvasHeight are valid
    if (!canvasWidth || !canvasHeight || !sceneRef.current) {
      return; // Wait for valid dimensions
    }

    // Create renderer
    const render = Matter.Render.create({
      element: sceneRef.current, // Render to the div referenced by sceneRef
      engine: engine,
      options: {
        width: canvasWidth,
        height: canvasHeight,
        wireframes: false, // Show filled shapes
        background: 'transparent', // Transparent background for the canvas
      }
    });
    renderRef.current = render;

    // Add floor
    const floor = Matter.Bodies.rectangle(
      canvasWidth / 2, // x: center of canvas
      canvasHeight + 25, // y: slightly below the canvas bottom
      canvasWidth,    // width: full canvas width
      50,             // height: 50px
      { isStatic: true, label: 'floor' } // Make it static
    );
    Matter.World.add(engine.world, [floor]);

    // Function to create a single confetti particle
    const createConfettiParticle = () => {
      // Spawn above the top edge of the canvas
      const x = Math.random() * canvasWidth;
      const y = -30 - (Math.random() * 50); // Start off-screen above
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      // For now, use simple rectangles for physics. Custom shape rendering will be later.
      const particleWidth = 8 + Math.random() * 7; // Random width between 8-15
      const particleHeight = 5 + Math.random() * 5; // Random height between 5-10

      const particle = Matter.Bodies.rectangle(x, y, particleWidth, particleHeight, {
        angle: Math.random() * Math.PI * 2, // Random initial angle
        frictionAir: 0.03 + Math.random() * 0.04, // Air friction for flutter (0.03-0.07)
        friction: 0.3 + Math.random() * 0.2,    // Friction with other bodies/floor (0.3-0.5) - Increased
        restitution: 0.1 + Math.random() * 0.2,  // Bounciness (0.1-0.3) - Decreased
        density: 0.0005 + Math.random() * 0.0005, // Affects mass; keep it light (0.0005 - 0.001)
        // render: {  // Default rendering will be overridden
        //   fillStyle: randomColor,
        // },
        label: 'confetti',
        // Store custom rendering properties on the body itself
        customRender: {
          color: randomColor,
          svgPath: shapeSVGPath, // Assuming shapeSVGPath is the actual SVG path string
          // We might need to pre-parse this Path2D if shapeSVGPath is complex and used by many particles
          // For now, new Path2D() per particle per frame in render loop.
        }
      });
      // Make the default rectangle invisible if using custom rendering loop
      particle.render.visible = false;
      return particle;
    };

    // Example: Add a few particles initially (spawning logic will be in next step)
    // For testing this step, let's add a small batch.
    // This will be moved to a continuous spawning mechanism later.
    // const initialParticles = [];
    // for (let i = 0; i < 50; i++) { // Spawn 50 test particles
    //   initialParticles.push(createConfettiParticle());
    // }
    // Matter.World.add(engine.world, initialParticles);

    // Spawning interval
    const spawnInterval = setInterval(() => {
      if (engine.world.bodies.filter(body => body.label === 'confetti').length < 250) { // Max ~250 confetti particles
        const newParticles = [];
        const numToSpawn = 2 + Math.floor(Math.random() * 3); // Spawn 2-4 particles per interval
        for (let i = 0; i < numToSpawn; i++) {
          newParticles.push(createConfettiParticle());
        }
        Matter.World.add(engine.world, newParticles);
      }
    }, 100); // Spawn every 100ms

    // Particle cleanup (off-screen)
    // This runs on every engine update, could be performance intensive if not careful
    // A less frequent check might be better for many bodies.
    Matter.Events.on(engine, 'afterUpdate', () => {
      const bodies = Matter.Composite.allBodies(engine.world);
      for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        if (body.label === 'confetti') {
          if (body.position.y > canvasHeight + 200) {
            Matter.World.remove(engine.world, body);
          }
        }
      }
    });

    // Custom rendering logic using 'afterRender' event
    Matter.Events.on(render, 'afterRender', () => {
      const context = render.context;
      const bodies = Matter.Composite.allBodies(engine.world);

      context.save(); // Save global context state
      for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        if (body.label === 'confetti' && body.customRender && body.customRender.svgPath) {
          context.save(); // Save context state for this particle
          context.translate(body.position.x, body.position.y);
          context.rotate(body.angle);
          context.scale(particleVisualScale, particleVisualScale); // Apply visual scaling

          // Apply fill color
          context.fillStyle = body.customRender.color || '#000000';

          // Create Path2D object from SVG path string
          // Use the pre-rendered Path2D object if available
          if (preRenderedPathRef.current) {
            context.fill(preRenderedPathRef.current);
          } else {
            // Fallback if preRenderedPathRef.current is null (e.g. invalid SVG path)
            // This could also try to use body.customRender.svgPath directly if that was different per particle
            // For now, consistent fallback for simplicity if main path fails.
            console.warn("Using fallback rendering for confetti particle as preRenderedPath is null.");
            // Fallback: draw a simple circle or square if Path2D fails
            context.beginPath();
            context.arc(0, 0, 5, 0, 2 * Math.PI); // Draw a 5px radius circle
            context.fill();
          }
          context.restore(); // Restore context state for next particle
        }
      }
      context.restore(); // Restore global context state
    });


    // Start the renderer
    Matter.Render.run(render);
    // Start the physics engine runner
    Matter.Runner.run(runnerRef.current, engine);

    return () => {
      // Cleanup Matter.js
      clearInterval(spawnInterval); // Clear the interval on cleanup
      Matter.Runner.stop(runnerRef.current);
      Matter.Render.stop(render);
      if (render.canvas) {
        render.canvas.remove();
      }
      // Clear the world of all bodies
      Matter.World.clear(engine.world);
      Matter.Engine.clear(engine);
    };
}, [canvasWidth, canvasHeight, colors, shapeSVGPath, particleVisualScale]); // Added particleVisualScale to dependency array

  // Style for the canvas container div
  const canvasContainerStyle = {
    display: 'block',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%', // These ensure the container div takes full screen
    height: '100%', // The canvas inside will use canvasWidth/Height
    pointerEvents: 'none', // Allow clicks to pass through
    zIndex: 100, // Similar to react-confetti's default
  };

  return (
    <div ref={sceneRef} style={canvasStyle}>
      {/* Matter.js Render will create and append a canvas here */}
    </div>
  );
};

export default PhysicsConfetti;

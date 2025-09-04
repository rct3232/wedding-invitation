"use client";

import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

const PhysicsConfetti = ({
  colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5'],
  shapeSVGPath = '',
  particleVisualScale = 1.0,
  canvasWidth,
  canvasHeight,
}) => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const renderRef = useRef(null);
  const preRenderedPathRef = useRef(null);
  const swipeDetectionDivRef = useRef(null);

  const swipeState = useRef({
    startX: 0, startY: 0, startTime: 0,
    currentX: 0, currentY: 0,
    isSwiping: false, isActive: false,
  });

  const PILE_AREA_HEIGHT_PX = 120;
  const SWIPE_MIN_HORIZONTAL_DISTANCE_PX = 75;
  const SWIPE_MAX_VERTICAL_DISTANCE_PX = 50;
  const SWIPE_MIN_VELOCITY_PX_PER_MS = 0.5;
  const SWIPE_MAX_DURATION_MS = 500;

  useEffect(() => {
    if (!engineRef.current) engineRef.current = Matter.Engine.create();
    if (!runnerRef.current) runnerRef.current = Matter.Runner.create();

    const engine = engineRef.current;
    const runner = runnerRef.current;

    if (shapeSVGPath) {
      try {
        preRenderedPathRef.current = new Path2D(shapeSVGPath);
      } catch (e) {
        preRenderedPathRef.current = null;
      }
    } else {
      preRenderedPathRef.current = null;
    }

    engine.world.gravity.y = 0.25;
    engine.enableSleeping = true;
    engine.positionIterations = 8;
    engine.velocityIterations = 6;

    if (!canvasWidth || !canvasHeight || !sceneRef.current) {
      return;
    }

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: canvasWidth, height: canvasHeight,
        wireframes: false, background: 'transparent',
      }
    });
    renderRef.current = render;

    if (render.canvas) {
      render.canvas.style.pointerEvents = 'none';
    }

    const defaultCategory = 0x0001;
    const confettiCategory = 0x0002;

    const floor = Matter.Bodies.rectangle(
      canvasWidth / 2, canvasHeight + 25, canvasWidth, 50,
      {
        isStatic: true, label: 'floor',
        collisionFilter: { category: defaultCategory, mask: 0xFFFFFFFF }
      }
    );
    Matter.World.add(engine.world, [floor]);

    const createConfettiParticle = () => {
      const x = Math.random() * canvasWidth;
      const y = -30 - (Math.random() * 50);
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const particleWidth = 8 + Math.random() * 7;
      const particleHeight = 5 + Math.random() * 5;
      let frictionAirValue, angularVelocityValue;
      const typeDecision = Math.random();
      if (typeDecision < 0.4) {
        frictionAirValue = 0.05 + Math.random() * 0.03; angularVelocityValue = (Math.random() - 0.5) * 0.25;
      } else if (typeDecision < 0.8) {
        frictionAirValue = 0.03 + Math.random() * 0.02; angularVelocityValue = (Math.random() - 0.5) * 0.1;
      } else {
        frictionAirValue = 0.015 + Math.random() * 0.01; angularVelocityValue = (Math.random() - 0.5) * 0.05;
      }
      const densityValue = 0.0003 + Math.random() * 0.0007;
      const particle = Matter.Bodies.rectangle(x, y, particleWidth, particleHeight, {
        angle: Math.random() * Math.PI * 2, angularVelocity: angularVelocityValue,
        frictionAir: frictionAirValue, friction: 0.6 + Math.random() * 0.1,
        restitution: 0.1 + Math.random() * 0.2, density: densityValue,
        collisionFilter: { category: confettiCategory, mask: defaultCategory },
        label: 'confetti',
        customRender: {
          color: randomColor, svgPath: shapeSVGPath,
          flipCycle: Math.random() * Math.PI * 2,
          flipSpeed: (0.03 + Math.random() * 0.04) * (Math.random() < 0.5 ? 1 : -1)
        }
      });
      particle.render.visible = false;
      return particle;
    };

    const spawnInterval = setInterval(() => {
      const allConfetti = Matter.Composite.allBodies(engine.world).filter(b => b.label === 'confetti');
      const nonSleepingConfettiCount = allConfetti.filter(b => !b.isSleeping).length;
      if (nonSleepingConfettiCount < 15 && allConfetti.length < 250) {
        const numToSpawn = 1 + Math.floor(Math.random() * 2);
        let newParticles = [];
        for (let i = 0; i < numToSpawn; i++) {
          if (Matter.Composite.allBodies(engine.world).filter(b => b.label === 'confetti').length < 250) {
             newParticles.push(createConfettiParticle());
          } else break;
        }
        if (newParticles.length > 0) Matter.World.add(engine.world, newParticles);
      }
    }, 150);

    Matter.Events.on(engine, 'afterUpdate', () => {
      Matter.Composite.allBodies(engine.world).forEach(body => {
        if (body.label === 'confetti' && body.position.y > canvasHeight + 200) {
          Matter.World.remove(engine.world, body);
        }
      });
    });

    Matter.Events.on(engine, 'beforeUpdate', () => {
      const timestamp = engine.timing.timestamp;
      const windStrength = 0.000005;
      const windForceX = Math.sin(timestamp * 0.001) * windStrength;
      const now = Date.now();
      Matter.Composite.allBodies(engine.world).forEach(body => {
        if (body.label === 'confetti') {
          const nearFloorThreshold = canvasHeight - 15;
          const pileAreaYStart = canvasHeight - PILE_AREA_HEIGHT_PX;
          const isNearFloor = body.position.y >= nearFloorThreshold;
          const isInPileArea = body.position.y >= pileAreaYStart;
          const isNearlyStill = Matter.Vector.magnitude(body.velocity) < 0.1 && Math.abs(body.angularVelocity) < 0.1;
          if (isInPileArea) {
            if (!body.pileEnteredAt) {
              body.pileEnteredAt = now;
            }
          } else {
            if (body.pileEnteredAt) {
              delete body.pileEnteredAt;
            }
          }
          if (body.isSleeping || (isNearFloor && isNearlyStill)) {
            Matter.Body.setAngularVelocity(body, 0);
            if (!body.isSleeping && isNearFloor && isNearlyStill) Matter.Sleeping.set(body, true);
          } else {
            Matter.Body.applyForce(body, body.position, { x: windForceX, y: 0 });
          }
        }
      });
    });

    const FADE_OUT_DURATION = 700;
    const pileCleanupInterval = setInterval(() => {
      const now = Date.now();
      const bodies = Matter.Composite.allBodies(engine.world);
      bodies.forEach(b => {
        if (b.label === 'confetti') {
          if (b.isFadingOut && b.fadeStartTime && (now - b.fadeStartTime > FADE_OUT_DURATION)) {
            Matter.World.remove(engine.world, b);
          }
          if (b.isSwipingOut && b.swipeOutStart && (now - b.swipeOutStart > FADE_OUT_DURATION)) {
            Matter.World.remove(engine.world, b);
          }
        }
      });
      const pileAreaYStart = canvasHeight - PILE_AREA_HEIGHT_PX;
      const piled = bodies.filter(b => b.label === 'confetti' && b.pileEnteredAt && !b.isFadingOut && b.position.y >= pileAreaYStart && (now - b.pileEnteredAt > 10000));
      if (piled.length > 0) {
        piled[0].isFadingOut = true;
        piled[0].fadeStartTime = now;
      }
    }, 1000);

    Matter.Events.on(render, 'afterRender', () => {
      const context = render.context;
      const bodies = Matter.Composite.allBodies(engine.world);
      context.save();
      bodies.forEach(body => {
        if (body.label === 'confetti' && body.customRender && body.customRender.svgPath) {
          let widthScaleFactor;
          if (body.isSleeping) {
            widthScaleFactor = 1.0;
          } else {
            const timeStep = 1/60;
            body.customRender.flipCycle += body.customRender.flipSpeed * timeStep * 100;
            const baseWidthScale = Math.abs(Math.sin(body.customRender.flipCycle));
            widthScaleFactor = 0.1 + baseWidthScale * 0.9;
          }
          let alpha = 0.7;
          let extraTranslateX = 0;
          if (body.isSwipingOut && body.swipeOutStart && body.swipeOutDirection) {
            const now = Date.now();
            const elapsed = now - body.swipeOutStart;
            const progress = Math.min(1, elapsed / FADE_OUT_DURATION);
            alpha = 0.7 * (1 - progress);
            extraTranslateX = body.swipeOutDirection * 300 * progress;
          } else if (body.isFadingOut && body.fadeStartTime) {
            const now = Date.now();
            const elapsed = now - body.fadeStartTime;
            alpha = 0.7 * Math.max(0, 1 - (elapsed / FADE_OUT_DURATION));
          }
          context.save();
          context.globalAlpha = alpha;
          context.translate(body.position.x + extraTranslateX, body.position.y);
          context.rotate(body.angle);
          context.scale(widthScaleFactor * particleVisualScale, particleVisualScale);
          context.fillStyle = body.customRender.color || '#000000';
          if (preRenderedPathRef.current) {
            context.fill(preRenderedPathRef.current);
          } else {
            context.beginPath(); context.arc(0, 0, 5, 0, 2 * Math.PI); context.fill();
          }
          context.restore();
        }
      });
      context.restore();
    });

    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);

    const getPointerCoordinates = (e) => {
      if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    };

    const handlePointerDown = (e) => {
      const { x, y } = getPointerCoordinates(e);
      swipeState.current = {
        startX: x, startY: y, currentX: x, currentY: y,
        startTime: Date.now(), isSwiping: false, isActive: true,
      };
    };

    const handlePointerMove = (e) => {
      if (!swipeState.current.isActive) return;
      const { x, y } = getPointerCoordinates(e);
      swipeState.current.currentX = x; swipeState.current.currentY = y;
      if (Math.abs(x - swipeState.current.startX) > 20) swipeState.current.isSwiping = true;
    };

    const handlePointerUp = (e) => {
      if (!swipeState.current.isActive) return;
      const finalPointer = e.changedTouches ? e.changedTouches[0] : e;
      const endX = finalPointer.clientX; const endY = finalPointer.clientY;
      const { startX, startY, startTime } = swipeState.current;
      const duration = Date.now() - startTime;
      const deltaX = endX - startX; const deltaY = endY - startY;
      const pileAreaYStart = canvasHeight - PILE_AREA_HEIGHT_PX;

      if (duration > 0) {
        const velocityX = deltaX / duration;
        if (Math.abs(deltaX) >= SWIPE_MIN_HORIZONTAL_DISTANCE_PX &&
            Math.abs(deltaY) <= SWIPE_MAX_VERTICAL_DISTANCE_PX &&
            duration <= SWIPE_MAX_DURATION_MS &&
            Math.abs(velocityX) >= SWIPE_MIN_VELOCITY_PX_PER_MS) {
          const swipePathStartX = Math.min(startX, endX);
          const swipePathEndX = Math.max(startX, endX);
          const swipePathStartY = Math.min(startY, endY) - 20;
          const swipePathEndY = Math.max(startY, endY) + 20;
          const swipeBounds = Matter.Bounds.create([{ x: swipePathStartX, y: swipePathStartY }, { x: swipePathEndX, y: swipePathEndY }]);
          const bodiesInSwipePath = Matter.Query.region(Matter.Composite.allBodies(engine.world), swipeBounds);
          const particlesToRemove = bodiesInSwipePath.filter(body =>
            body.label === 'confetti' && body.position.y >= pileAreaYStart);
          const now = Date.now();
          const swipeDir = deltaX > 0 ? 1 : -1;
          particlesToRemove.forEach(particle => {
            if (!particle.isFadingOut && !particle.isSwipingOut) {
              particle.isSwipingOut = true;
              particle.swipeOutStart = now;
              particle.swipeOutDirection = swipeDir;
            }
          });
        }
      }
      swipeState.current = { ...swipeState.current, isActive: false, isSwiping: false };
    };

    const handlePointerLeave = (e) => {
      if (swipeState.current.isActive) handlePointerUp(e);
    };

    const swipeDiv = swipeDetectionDivRef.current;
    let listenersAttached = false;
    if (swipeDiv && canvasHeight) {
      swipeDiv.addEventListener('mousedown', handlePointerDown);
      swipeDiv.addEventListener('touchstart', handlePointerDown, { passive: false });
      swipeDiv.addEventListener('mouseleave', handlePointerLeave);
      swipeDiv.addEventListener('touchcancel', handlePointerLeave);
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
      listenersAttached = true;
    }

    return () => {
      clearInterval(spawnInterval);
      clearInterval(pileCleanupInterval);
      if (runner) Matter.Runner.stop(runner);
      if (renderRef.current) {
          Matter.Render.stop(renderRef.current);
          if (renderRef.current.canvas) renderRef.current.canvas.remove();
          renderRef.current = null;
      }
      if (engine) {
          Matter.World.clear(engine.world);
          Matter.Engine.clear(engine);
      }

      if (listenersAttached && swipeDiv) {
          swipeDiv.removeEventListener('mousedown', handlePointerDown);
          swipeDiv.removeEventListener('touchstart', handlePointerDown);
          swipeDiv.removeEventListener('mouseleave', handlePointerLeave);
          swipeDiv.removeEventListener('touchcancel', handlePointerLeave);
      }
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [canvasWidth, canvasHeight, colors, shapeSVGPath, particleVisualScale]);

  const canvasContainerStyle = {
    display: 'block', position: 'fixed', top: 0, left: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: 100,
  };
  const swipeDetectionDivStyle = {
    position: 'fixed', bottom: 0, left: 0,
    width: '100%', height: '25px',
    zIndex: 101, touchAction: 'none',
  };

  return (
    <>
      <div ref={sceneRef} style={canvasContainerStyle} />
      {canvasHeight && (
        <div ref={swipeDetectionDivRef} style={swipeDetectionDivStyle} />
      )}
    </>
  );
};

export default PhysicsConfetti;

"use client";

import React, { useEffect, useRef } from "react";

export function BackgroundPaths({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Set canvas dimensions to match parent container with higher resolution for retina displays
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Set display size (css pixels)
        canvas.style.width = parent.clientWidth + "px";
        canvas.style.height = parent.clientHeight + "px";

        // Set actual size in memory (scaled to account for extra pixel density)
        canvas.width = parent.clientWidth * devicePixelRatio;
        canvas.height = parent.clientHeight * devicePixelRatio;

        // Scale context to match the device pixel ratio
        ctx.scale(devicePixelRatio, devicePixelRatio);

        // Clear canvas with transparent background
        ctx.clearRect(
          0,
          0,
          canvas.width / devicePixelRatio,
          canvas.height / devicePixelRatio
        );
      }
    };

    // Initial resize
    resizeCanvas();

    // Resize on window resize with debounce
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 200);
    };
    window.addEventListener("resize", handleResize);

    // Path configuration
    const paths: {
      x: number;
      y: number;
      dx: number;
      dy: number;
      lineWidth: number;
      color: string;
      length: number;
      points: { x: number; y: number; pressure: number }[];
      brushType: string;
      phase: number; // Add phase for coordinated movement
    }[] = [];

    // Create initial paths
    const createPaths = () => {
      paths.length = 0;
      // Adjust number of paths based on screen size
      const baseCount = 8;
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const numPaths = baseCount + Math.floor(width / 150);

      const brushTypes = ["round", "flat", "calligraphy"];

      // Create a shared flow direction for coordinated movement
      const globalFlowAngle = Math.random() * Math.PI * 2;
      const flowDirectionX = Math.cos(globalFlowAngle) * 0.3;
      const flowDirectionY = Math.sin(globalFlowAngle) * 0.3;

      // Define a center point for pattern formations
      // const centerX = width / 2;
      // const centerY = height / 2;

      for (let i = 0; i < numPaths; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;

        // Assign a phase offset for each path to create wave-like movement
        const phase = Math.random() * Math.PI * 2;

        // Base movement on the global flow direction with slight variations
        const dx = flowDirectionX + (Math.random() - 0.5) * 0.2;
        const dy = flowDirectionY + (Math.random() - 0.5) * 0.2;

        // Varied line widths for more visual interest
        const lineWidth = Math.random() * 4 + 2; // Slightly thicker for brush effect

        // Generate paint-like colors with varying opacity
        const opacity = 0.15 + Math.random() * 0.35;

        // Paint colors palette
        const paintColors = [
          `rgba(41, 50, 65, ${opacity})`, // Dark blue
          `rgba(142, 85, 114, ${opacity})`, // Mauve
          `rgba(74, 78, 105, ${opacity})`, // Slate
          `rgba(154, 140, 152, ${opacity})`, // Lavender gray
          `rgba(242, 233, 228, ${opacity})`, // Off-white
          `rgba(217, 164, 65, ${opacity})`, // Gold
          `rgba(166, 114, 69, ${opacity})`, // Brown
          `rgba(191, 64, 64, ${opacity})`, // Red
          `rgba(87, 131, 123, ${opacity})`, // Teal
        ];

        const color =
          paintColors[Math.floor(Math.random() * paintColors.length)];

        // Varied path lengths
        const length = Math.floor(Math.random() * 80) + 40;

        // Randomly select a brush type
        const brushType =
          brushTypes[Math.floor(Math.random() * brushTypes.length)];

        paths.push({
          x,
          y,
          dx,
          dy,
          lineWidth,
          color,
          length,
          brushType,
          phase,
          points: [{ x, y, pressure: Math.random() * 0.5 + 0.5 }],
        });
      }
    };

    createPaths();

    // Animation loop with frame limiting for performance
    let lastTime = 0;
    const fps = 60;
    const interval = 1000 / fps;
    let animationTime = 0;
    let patternTime = 0;
    let isFormingPattern = false;
    let patternType = "none";
    let patternDuration = 0;
    let patternCenter = { x: 0, y: 0 };

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;

      if (deltaTime >= interval) {
        lastTime = timestamp - (deltaTime % interval);
        animationTime += deltaTime / 1000; // Track time in seconds for wave movement

        // Occasionally switch to pattern formation
        patternTime += deltaTime / 1000;
        if (patternTime > patternDuration) {
          // Reset pattern timer
          patternTime = 0;

          // Decide whether to form a pattern or go back to normal flow
          if (!isFormingPattern && Math.random() < 0.3) {
            // 30% chance to start a pattern
            isFormingPattern = true;
            patternDuration = 3 + Math.random() * 4; // Pattern lasts 3-7 seconds

            // Choose a pattern type
            const patterns = ["circle", "spiral", "wave"];
            patternType = patterns[Math.floor(Math.random() * patterns.length)];

            // Set a new pattern center point
            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);
            patternCenter = {
              x: width * (0.3 + Math.random() * 0.4), // Keep center in middle 40% of screen
              y: height * (0.3 + Math.random() * 0.4),
            };
          } else if (isFormingPattern) {
            isFormingPattern = false;
            patternDuration = 5 + Math.random() * 5; // Normal flow lasts 5-10 seconds
          }
        }

        // Apply a subtle fade effect for smooth trails with transparent background
        ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
        ctx.fillRect(
          0,
          0,
          canvas.width / (window.devicePixelRatio || 1),
          canvas.height / (window.devicePixelRatio || 1)
        );

        // Update and draw paths
        paths.forEach((path, index) => {
          let moveX = 0;
          let moveY = 0;

          if (isFormingPattern) {
            // Calculate distance and angle to pattern center
            const dx = patternCenter.x - path.x;
            const dy = patternCenter.y - path.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // const angle = Math.atan2(dy, dx);

            // Different pattern behaviors
            switch (patternType) {
              case "circle":
                // Circular movement around center
                const orbitSpeed = 0.5 + (index % 3) * 0.2; // Varied speeds
                const orbitRadius = 50 + (index % 5) * 20; // Varied radii
                const orbitAngle = animationTime * orbitSpeed + path.phase;

                // Gradually move toward orbit radius
                const targetX =
                  patternCenter.x + Math.cos(orbitAngle) * orbitRadius;
                const targetY =
                  patternCenter.y + Math.sin(orbitAngle) * orbitRadius;
                moveX = (targetX - path.x) * 0.03;
                moveY = (targetY - path.y) * 0.03;
                break;

              case "spiral":
                // Spiral movement toward or away from center
                const spiralSpeed = 1 + (index % 3) * 0.3;
                const spiralAngle = animationTime * spiralSpeed + path.phase;
                const spiralRadius = Math.max(
                  10,
                  distance * (0.95 + Math.sin(animationTime * 0.2) * 0.05)
                );

                const spiralX =
                  patternCenter.x + Math.cos(spiralAngle) * spiralRadius;
                const spiralY =
                  patternCenter.y + Math.sin(spiralAngle) * spiralRadius;
                moveX = (spiralX - path.x) * 0.04;
                moveY = (spiralY - path.y) * 0.04;
                break;

              case "wave":
                // Wave pattern across the screen
                // const waveAmplitude = 30 + (index % 4) * 10;
                const waveFrequency = 0.02 + (index % 3) * 0.01;
                const wavePhase = animationTime * 0.5 + path.phase;

                // Move in general direction of center with wave motion
                moveX =
                  dx * 0.01 +
                  Math.sin(path.y * waveFrequency + wavePhase) * 0.5;
                moveY =
                  dy * 0.01 +
                  Math.cos(path.x * waveFrequency + wavePhase) * 0.5;
                break;

              default:
                // Default to wave-like movement
                moveX = Math.sin(animationTime * 0.5 + path.phase) * 0.3;
                moveY = Math.cos(animationTime * 0.4 + path.phase) * 0.3;
            }
          } else {
            // Normal wave-like coordinated movement
            moveX = Math.sin(animationTime * 0.5 + path.phase) * 0.3;
            moveY = Math.cos(animationTime * 0.4 + path.phase) * 0.3;
          }

          // Update position with calculated movement and slight randomness
          path.x += path.dx + moveX + (Math.random() - 0.5) * 0.1;
          path.y += path.dy + moveY + (Math.random() - 0.5) * 0.1;

          // Add new point with pressure variation
          // Pressure varies with the wave for more natural brush effect
          const pressureVariation =
            (Math.sin(animationTime * 0.8 + path.phase) + 1) * 0.25;
          const pressure = 0.5 + pressureVariation; // Simulate brush pressure
          path.points.push({ x: path.x, y: path.y, pressure });

          // Remove old points if exceeding max length
          if (path.points.length > path.length) {
            path.points.shift();
          }

          // Draw path with brush-like appearance
          if (path.points.length > 1) {
            ctx.beginPath();

            // Start with the oldest point
            ctx.moveTo(path.points[0].x, path.points[0].y);

            // Draw the brush stroke
            for (let i = 1; i < path.points.length; i++) {
              const point = path.points[i];
              const prevPoint = path.points[i - 1];

              // For calligraphy brush effect
              if (path.brushType === "calligraphy") {
                ctx.lineWidth =
                  path.lineWidth *
                  point.pressure *
                  (1 + Math.sin(i * 0.2) * 0.5);

                // Add occasional ink splatter for calligraphy
                if (Math.random() < 0.03) {
                  const splatterSize = Math.random() * path.lineWidth * 0.8;
                  ctx.save();
                  ctx.fillStyle = path.color;
                  ctx.beginPath();
                  ctx.arc(
                    point.x + (Math.random() - 0.5) * 5,
                    point.y + (Math.random() - 0.5) * 5,
                    splatterSize,
                    0,
                    Math.PI * 2
                  );
                  ctx.fill();
                  ctx.restore();
                }
              }
              // For flat brush effect
              else if (path.brushType === "flat") {
                // Flat brushes have more variation in width based on direction
                const dx = point.x - prevPoint.x;
                const dy = point.y - prevPoint.y;
                const angle = Math.atan2(dy, dx);

                // Width varies based on angle of movement (simulating flat brush orientation)
                const angleEffect = Math.abs(Math.sin(angle * 2));
                ctx.lineWidth =
                  path.lineWidth * point.pressure * (0.5 + angleEffect);

                // Add texture to flat brush strokes
                if (i % 4 === 0) {
                  const textureX = point.x + (Math.random() - 0.5) * 3;
                  const textureY = point.y + (Math.random() - 0.5) * 3;
                  ctx.lineTo(textureX, textureY);
                } else {
                  ctx.lineTo(point.x, point.y);
                }
              }
              // For round brush effect
              else {
                ctx.lineWidth = path.lineWidth * point.pressure;
                ctx.lineTo(point.x, point.y);

                // Add occasional paint drip for round brushes
                if (Math.random() < 0.02 && point.pressure > 0.7) {
                  const dripLength = Math.random() * 10 + 5;
                  const dripWidth = path.lineWidth * 0.3;

                  ctx.save();
                  ctx.beginPath();
                  ctx.moveTo(point.x, point.y);
                  ctx.lineTo(point.x, point.y + dripLength);
                  ctx.lineWidth = dripWidth;
                  ctx.stroke();

                  // Add drip end
                  ctx.beginPath();
                  ctx.arc(
                    point.x,
                    point.y + dripLength,
                    dripWidth / 2,
                    0,
                    Math.PI * 2
                  );
                  ctx.fill();
                  ctx.restore();
                }
              }

              // Draw the segment to create varying width effect
              if (i % 3 === 0) {
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
              }
            }

            ctx.strokeStyle = path.color;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
          }

          // Bounce off edges with slight randomization for more natural movement
          const width = canvas.width / (window.devicePixelRatio || 1);
          const height = canvas.height / (window.devicePixelRatio || 1);

          if (path.x < 0 || path.x > width) {
            path.dx = -path.dx * (0.9 + Math.random() * 0.2);
            path.x = path.x < 0 ? 0 : width;
          }

          if (path.y < 0 || path.y > height) {
            path.dy = -path.dy * (0.9 + Math.random() * 0.2);
            path.y = path.y < 0 ? 0 : height;
          }
        });
      }

      requestAnimationFrame(animate);
    };

    // Start animation
    requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        background: "transparent",
      }}
    />
  );
}

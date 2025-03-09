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
      points: { x: number; y: number }[];
    }[] = [];

    // Create initial paths
    const createPaths = () => {
      paths.length = 0;
      // Adjust number of paths based on screen size
      const baseCount = 5;
      const width = canvas.width / (window.devicePixelRatio || 1);
      const numPaths = baseCount + Math.floor(width / 200);

      for (let i = 0; i < numPaths; i++) {
        const x = Math.random() * width;
        const y =
          Math.random() * (canvas.height / (window.devicePixelRatio || 1));

        // Slower movement for more elegant animation
        const dx = (Math.random() - 0.5) * 0.8;
        const dy = (Math.random() - 0.5) * 0.8;

        // Varied line widths for more visual interest
        const lineWidth = Math.random() * 1.5 + 0.5;

        // Generate black colors with varying opacity
        const opacity = 0.1 + Math.random() * 0.3;
        const color = `rgba(0, 0, 0, ${opacity})`;

        // Varied path lengths
        const length = Math.floor(Math.random() * 80) + 40;

        paths.push({
          x,
          y,
          dx,
          dy,
          lineWidth,
          color,
          length,
          points: [{ x, y }],
        });
      }
    };

    createPaths();

    // Animation loop with frame limiting for performance
    let lastTime = 0;
    const fps = 60;
    const interval = 1000 / fps;

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;

      if (deltaTime >= interval) {
        lastTime = timestamp - (deltaTime % interval);

        // Apply a subtle fade effect for smooth trails with transparent background
        ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
        ctx.fillRect(
          0,
          0,
          canvas.width / (window.devicePixelRatio || 1),
          canvas.height / (window.devicePixelRatio || 1)
        );

        // Update and draw paths
        paths.forEach((path) => {
          // Update position
          path.x += path.dx;
          path.y += path.dy;

          // Add new point
          path.points.push({ x: path.x, y: path.y });

          // Remove old points if exceeding max length
          if (path.points.length > path.length) {
            path.points.shift();
          }

          // Draw path with gradient opacity for a fading trail effect
          if (path.points.length > 1) {
            ctx.beginPath();

            // Start with the oldest point
            ctx.moveTo(path.points[0].x, path.points[0].y);

            // Draw lines to each subsequent point
            for (let i = 1; i < path.points.length; i++) {
              ctx.lineTo(path.points[i].x, path.points[i].y);
            }

            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.lineWidth;
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

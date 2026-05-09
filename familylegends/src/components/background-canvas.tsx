'use client';

import React, { useRef, useEffect } from 'react';

const BackgroundCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particlesArray: Particle[];
    let isVisible = true;

    // Use IntersectionObserver to pause when not visible
    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(canvas);

    class Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;
      opacity: number;

      constructor(x: number, y: number, directionX: number, directionY: number, size: number, opacity: number) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.opacity = opacity;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = `rgba(255, 215, 0, ${this.opacity})`;
        ctx.fill();
      }

      update(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw(ctx);
      }
    }

    const init = () => {
      if (!canvas) return;
      particlesArray = [];
      // Drastically reduced particles - mobile: ~25, desktop: ~60
      const area = canvas.height * canvas.width;
      const numberOfParticles = Math.min(Math.floor(area / 30000), 60);
      for (let i = 0; i < numberOfParticles; i++) {
        const size = (Math.random() * 1.5) + 0.5;
        const x = (Math.random() * (canvas.width - size * 4)) + (size * 2);
        const y = (Math.random() * (canvas.height - size * 4)) + (size * 2);
        const directionX = (Math.random() * 0.3) - 0.15;
        const directionY = (Math.random() * 0.3) - 0.15;
        const opacity = Math.random() * 0.4 + 0.1;
        particlesArray.push(new Particle(x, y, directionX, directionY, size, opacity));
      }
    };

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      if (!isVisible || !ctx) return; // Skip rendering when not visible
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update(canvas, ctx);
      }
    };

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} id="background-canvas" className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none" />;
};

export { BackgroundCanvas };

'use client';

import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const celebrate = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    // Starlight colors
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#fef08a', '#facc15', '#eab308'],
    });

    // Cosmic colors
    fire(0.2, {
      spread: 60,
      colors: ['#c084fc', '#a855f7', '#9333ea'],
    });

    // Aurora colors
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#5eead4', '#2dd4bf', '#14b8a6'],
    });

    // Space colors
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#8193ff', '#5d6aff', '#4a49f5'],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#ffffff', '#e0e9ff', '#c7d7ff'],
    });
  }, []);

  const quickCelebrate = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fef08a', '#c084fc', '#5eead4', '#8193ff'],
      zIndex: 9999,
    });
  }, []);

  const shootingStars = useCallback(() => {
    const end = Date.now() + 1 * 1000; // 1 second

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#fef08a', '#ffffff'],
        zIndex: 9999,
        gravity: 0.5,
        scalar: 1.2,
      });

      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#fef08a', '#ffffff'],
        zIndex: 9999,
        gravity: 0.5,
        scalar: 1.2,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const prizeWon = useCallback(() => {
    // Big celebration for winning a prize
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2,
        },
        colors: ['#fef08a', '#facc15', '#eab308'],
        zIndex: 9999,
      });

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2,
        },
        colors: ['#c084fc', '#a855f7', '#9333ea'],
        zIndex: 9999,
      });
    }, 250);
  }, []);

  return {
    celebrate,
    quickCelebrate,
    shootingStars,
    prizeWon,
  };
};

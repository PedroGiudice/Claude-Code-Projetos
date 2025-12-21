import React, { useState, useEffect } from 'react';

/**
 * CCuiSpinner - Animated Cyber Hex Gyro spinner
 *
 * Uses PNG frame animation for smooth loading indicator
 *
 * @param {Object} props
 * @param {number} props.size - Size in pixels (default: 64)
 * @param {number} props.fps - Frames per second (default: 30)
 * @param {string} props.className - Additional CSS classes
 */
const CCuiSpinner = ({ size = 64, fps = 30, className = '' }) => {
  const [frame, setFrame] = useState(0);
  const frameCount = 30;
  const frameNumbers = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290];

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % frameCount);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [fps]);

  return (
    <div
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={`/spinner-frames/spinner_${frameNumbers[frame]}.png`}
        alt="Loading..."
        width={size}
        height={size}
        style={{
          objectFit: 'contain',
          imageRendering: 'crisp-edges',
        }}
      />
    </div>
  );
};

/**
 * CCuiSpinnerLogo - Animated logo version (larger, for headers)
 */
export const CCuiSpinnerLogo = ({ size = 32, className = '' }) => (
  <CCuiSpinner size={size} fps={24} className={className} />
);

/**
 * CCuiSpinnerOverlay - Full-screen loading overlay with spinner
 */
export const CCuiSpinnerOverlay = ({ message = 'Loading...' }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#131211]/90 backdrop-blur-sm">
    <CCuiSpinner size={96} fps={30} />
    <p className="mt-4 text-[#e5e5e5] text-sm font-mono">{message}</p>
  </div>
);

export default CCuiSpinner;

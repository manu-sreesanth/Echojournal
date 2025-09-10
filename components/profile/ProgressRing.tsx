import React from "react";

interface ProgressRingProps {
  radius: number;
  stroke: number;
  progress: number; // 0-100
  strokeColor?: string; // fallback if gradient is not used
  bgStrokeColor?: string;
  children?: React.ReactNode;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  radius,
  stroke,
  progress,
  strokeColor = "#7C3AED", // Purple fallback
  bgStrokeColor = "rgba(255,255,255,0.2)",
  children
}) => {
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2}>
      {/* Background Circle */}
      <circle
        stroke={bgStrokeColor}
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />

      {/* Progress Circle with gradient */}
      <circle
        stroke="url(#gradient)"
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset, transition: "stroke-dashoffset 0.35s" }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="gradient" gradientTransform="rotate(90)">
          <stop offset="0%" stopColor="#a855f7" /> {/* purple-500 */}
          <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
        </linearGradient>
      </defs>

      {/* Children in the center */}
{children && (
  <foreignObject
    x="0"
    y="0"
    width={radius * 2}
    height={radius * 2}
  >
    <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
      {children}
    </div>
  </foreignObject>
)}

    </svg>
  );
};

export default ProgressRing;


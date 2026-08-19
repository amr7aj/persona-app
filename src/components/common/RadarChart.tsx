import React from 'react';

interface RadarDataPoint {
  label: string;
  value: number; // 0 - 100
  color?: string;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  highlightColor?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  size = 280,
  highlightColor = '#F59E0B'
}) => {
  const center = size / 2;
  const radius = size * 0.38;
  const total = data.length;
  const angleSlice = (Math.PI * 2) / total;

  // Concentric levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getCoordinates = (index: number, valueRatio: number) => {
    const angle = angleSlice * index - Math.PI / 2;
    const x = center + radius * valueRatio * Math.cos(angle);
    const y = center + radius * valueRatio * Math.sin(angle);
    return { x, y };
  };

  // Build polygon points for data
  const dataPointsString = data
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.value / 100);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grids */}
        {levels.map((lvl, lIdx) => {
          const levelPoints = data
            .map((_, i) => {
              const { x, y } = getCoordinates(i, lvl);
              return `${x},${y}`;
            })
            .join(' ');
          return (
            <polygon
              key={lIdx}
              points={levelPoints}
              fill={lIdx === levels.length - 1 ? '#13131C' : 'transparent'}
              stroke="#272738"
              strokeWidth="1"
              strokeDasharray={lIdx % 2 === 1 ? '2 2' : 'none'}
            />
          );
        })}

        {/* Axis Spokes */}
        {data.map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#272738"
              strokeWidth="1"
            />
          );
        })}

        {/* Shaded Data Area */}
        <polygon
          points={dataPointsString}
          fill="url(#radarGradient)"
          stroke={highlightColor}
          strokeWidth="2.5"
          className="transition-all duration-700 ease-out"
        />

        {/* Vertex Markers */}
        {data.map((d, i) => {
          const { x, y } = getCoordinates(i, d.value / 100);
          return (
            <g key={i} className="group cursor-pointer">
              <circle
                cx={x}
                cy={y}
                r="4.5"
                fill={highlightColor}
                stroke="#0B0B0F"
                strokeWidth="2"
                className="transition-transform duration-300 hover:scale-150"
              />
              <circle
                cx={x}
                cy={y}
                r="8"
                fill={highlightColor}
                opacity="0.15"
              />
            </g>
          );
        })}

        {/* Gradient Definition */}
        <defs>
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05" />
          </radialGradient>
        </defs>

        {/* Outer Labels */}
        {data.map((d, i) => {
          const { x, y } = getCoordinates(i, 1.22);
          const isRight = x > center + 10;
          const isLeft = x < center - 10;
          const textAnchor = isRight ? 'start' : isLeft ? 'end' : 'middle';

          return (
            <text
              key={i}
              x={x}
              y={y + 4}
              textAnchor={textAnchor}
              className="fill-zinc-300 text-[10px] font-medium tracking-tight"
            >
              {d.label} <tspan className="fill-amber-400 font-bold">({d.value}%)</tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
};

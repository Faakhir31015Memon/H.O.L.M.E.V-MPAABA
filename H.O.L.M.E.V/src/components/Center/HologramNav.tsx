import React, { useState } from 'react';
import { useHolmev } from '../../context/useHolmev';
import type { NavigationRoute } from '../../types/holmev';
import { Compass, MapPin, CornerUpRight, ArrowUp, Flag, Search } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const HologramNav: React.FC = () => {
  const { overkillMode, addLog } = useHolmev();
  const [destQuery, setDestQuery] = useState('IIC Road Sauna Tower');
  const [route, setRoute] = useState<NavigationRoute>({
    origin: 'Current Geo-Position (Sector 7)',
    destination: 'IIC Road Sauna Tower',
    totalDistance: '4.2 km',
    eta: '11 MINS',
    steps: [
      { instruction: 'Head North on Cyber Ave for 800m', distance: '800m', direction: 'straight' },
      { instruction: 'Turn right onto Quantum Expressway', distance: '1.6 km', direction: 'right' },
      { instruction: 'Take the exit toward IIC Road', distance: '1.2 km', direction: 'right' },
      { instruction: 'Arrive at IIC Road Sauna Tower on left', distance: '600m', direction: 'destination' },
    ],
  });

  const handleCalculateRoute = (dest: string) => {
    soundFx.playScan();
    const newRoute: NavigationRoute = {
      origin: 'Current Geo-Position',
      destination: dest || 'Sector 01',
      totalDistance: `${(Math.random() * 5 + 2).toFixed(1)} km`,
      eta: `${Math.floor(Math.random() * 10 + 8)} MINS`,
      steps: [
        { instruction: `Head toward ${dest} via Main Corridor`, distance: '1.2 km', direction: 'straight' },
        { instruction: 'Turn right at junction 04', distance: '1.8 km', direction: 'right' },
        { instruction: `Arrive at ${dest}`, distance: '500m', direction: 'destination' },
      ],
    };
    setRoute(newRoute);
    addLog(`Holo Navigation: Computed 3D route trajectory to [${newRoute.destination}] - Distance: ${newRoute.totalDistance}, ETA: ${newRoute.eta}.`, 'HOLO_NAV', 'success');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search Input Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-black/60 border border-cyan-500/30 rounded">
        <MapPin className="w-4 h-4 text-cyan-400 pl-1" />
        <input
          type="text"
          value={destQuery}
          onChange={(e) => setDestQuery(e.target.value)}
          placeholder="Enter destination (e.g. IIC Road Sauna Tower)..."
          className="bg-transparent border-none outline-none text-cyan-300 font-mono-tech text-xs w-full placeholder-gray-500"
          onKeyDown={(e) => e.key === 'Enter' && handleCalculateRoute(destQuery)}
        />
        <button
          type="button"
          onClick={() => handleCalculateRoute(destQuery)}
          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded text-cyan-300 text-xs font-mono-tech transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>NAVIGATE</span>
        </button>
      </div>

      {/* Hologram Vector Route Map Display */}
      <div className="relative w-full h-[220px] bg-black/80 rounded border border-cyan-500/20 overflow-hidden flex flex-col justify-between p-3">
        {/* Isometric Cyber Grid Map Simulation */}
        <div className="absolute inset-0 cyber-grid-bg opacity-40 pointer-events-none" />

        {/* Animated Cyber Route SVG Line */}
        <svg viewBox="0 0 400 180" className="w-full h-full absolute inset-0 z-10">
          <defs>
            <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0055ff" />
              <stop offset="100%" stopColor={overkillMode ? '#ff3c00' : '#00f3ff'} />
            </linearGradient>
          </defs>
          {/* Waypoints line */}
          <path
            d="M 40,140 Q 120,130 160,80 T 280,70 T 360,30"
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="6 3"
            className="animate-pulse"
          />
          {/* Origin Point */}
          <circle cx="40" cy="140" r="5" fill="#0055ff" />
          <circle cx="40" cy="140" r="10" fill="none" stroke="#0055ff" opacity="0.6" />
          {/* Destination Point */}
          <circle cx="360" cy="30" r="6" fill="#ff3c00" />
          <circle cx="360" cy="30" r="12" fill="none" stroke="#ff3c00" className="animate-ping" />
        </svg>

        {/* HUD Map Readout Overlay */}
        <div className="relative z-20 flex items-center justify-between text-[11px] font-mono-tech">
          <div className="bg-black/80 px-2 py-1 rounded border border-white/10 text-cyan-300">
            DEST: <strong>{route.destination}</strong>
          </div>
          <div className="bg-black/80 px-2 py-1 rounded border border-white/10 text-green-400">
            ETA: {route.eta} ({route.totalDistance})
          </div>
        </div>

        {/* Compass Heading */}
        <div className="relative z-20 flex items-center gap-1.5 text-[10px] font-mono-tech text-gray-400">
          <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          <span>HEADING: 042° NORTH-EAST // SATELLITE LOCK [99.8%]</span>
        </div>
      </div>

      {/* Turn-by-Turn Guidance Cards */}
      <div className="flex flex-col gap-1.5">
        {route.steps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 bg-[#020a17] border border-white/5 rounded text-xs font-mono-tech"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-cyan-500/10 text-cyan-400">
                {step.direction === 'destination' ? (
                  <Flag className="w-3.5 h-3.5 text-red-400" />
                ) : step.direction === 'right' ? (
                  <CornerUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUp className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-gray-200">{step.instruction}</span>
            </div>
            <span className="text-cyan-400 font-bold">{step.distance}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

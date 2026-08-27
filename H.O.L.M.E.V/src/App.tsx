import React from 'react';
import { HolmevProvider, useHolmev } from './context/HolmevContext';
import { Header } from './components/Header/Header';
import { SystemDiagnostics } from './components/Diagnostics/SystemDiagnostics';
import { HexViewer } from './components/Diagnostics/HexViewer';
import { CenterPanel } from './components/Center/CenterPanel';
import { VectorChart } from './components/Analytics/VectorChart';
import { ExecutionLogs } from './components/Analytics/ExecutionLogs';
import { QuickActions } from './components/Footer/QuickActions';
import { InteractionBar } from './components/Footer/InteractionBar';
import { SnapshotModal } from './components/UI/SnapshotModal';
import './App.css';

const MainDashboard: React.FC = () => {
  const { overkillMode } = useHolmev();

  return (
    <div
      className={`min-h-screen w-full flex flex-col relative transition-colors duration-500 overflow-x-hidden ${
        overkillMode
          ? 'bg-[#080204] cyber-grid-bg-red selection:bg-red-500/40'
          : 'bg-[#020813] cyber-grid-bg selection:bg-cyan-500/40'
      }`}
    >
      {/* Subtle CRT / Scanline Screen Overlay */}
      <div className="fixed inset-0 scanline-overlay pointer-events-none z-30 opacity-40" />

      {/* Red Alert Flash Ambient Light in Overkill Mode */}
      {overkillMode && (
        <div className="fixed inset-0 pointer-events-none z-10 bg-red-900/10 animate-pulse-glow" />
      )}

      {/* Top Header */}
      <Header />

      {/* Main 3-Column Dashboard Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-4 flex flex-col gap-4 relative z-20">
        {/* 3-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 items-start">
          {/* Left Column: System Diagnostics & Hex Memory Viewer (3.5 / 12 cols on desktop) */}
          <div className="lg:col-span-3 xl:col-span-3 flex flex-col gap-3.5 order-2 lg:order-1">
            <SystemDiagnostics />
            <HexViewer />
          </div>

          {/* Center Column: 3D Reactor Core / CV CCTV Stack (5.5 / 12 cols on desktop) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-3.5 order-1 lg:order-2">
            <CenterPanel />
            {/* Quick Actions Pills row positioned beneath center panel */}
            <div className="bg-[#020a17]/70 backdrop-blur-md border border-cyan-500/20 rounded p-2.5">
              <QuickActions />
            </div>
          </div>

          {/* Right Column: Real-time Vector Waveforms & Execution Logs (3.0 / 12 cols on desktop) */}
          <div className="lg:col-span-3 xl:col-span-3 flex flex-col gap-3.5 order-3">
            <VectorChart />
            <ExecutionLogs />
          </div>
        </div>

        {/* Footer Interaction Bar (Mic, Command Prompt, Execute) */}
        <footer className="w-full mt-auto pt-2 pb-2">
          <InteractionBar />
        </footer>
      </main>

      {/* Modals */}
      <SnapshotModal />
    </div>
  );
};

export default function App() {
  return (
    <HolmevProvider>
      <MainDashboard />
    </HolmevProvider>
  );
}

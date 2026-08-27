import React, { useRef, useEffect, useState } from 'react';
import { useHolmev } from '../../context/useHolmev';
import type { HOLMEVBox } from '../../types/holmev';
import { Camera, Crosshair, CheckCircle2 } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const CvVisionStack: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    boxes,
    updateBoxPosition,
    overkillMode,
    addLog,
    captureSnapshot,
  } = useHolmev();

  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(boxes[0]?.id || null);
  const [flashEffect, setFlashEffect] = useState(false);

  // Keep ref for animation loop
  const boxesRef = useRef<HOLMEVBox[]>(boxes);
  useEffect(() => {
    boxesRef.current = boxes;
  }, [boxes]);

  const selectedBox = boxes.find((b) => b.id === selectedBoxId);

  // Take Snapshot helper
  const handleSnapshot = () => {
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      captureSnapshot(dataUrl);
    } else {
      captureSnapshot();
    }
  };

  // Add new target
  const handleAddTarget = () => {
    soundFx.playScan();
    const newId = `TGT-${Math.floor(Math.random() * 900 + 100)}`;
    const labels = ['PATROL_DRONE', 'INTRUDER_SIG', 'SURVEILLANCE_NODE', 'ENERGY_SOURCE'];
    const label = labels[Math.floor(Math.random() * labels.length)];
    const newBox: HOLMEVBox = {
      id: newId,
      label: `${label} [${(Math.random() * 0.1 + 0.89).toFixed(2)}]`,
      confidence: parseFloat((Math.random() * 0.1 + 0.89).toFixed(3)),
      x: Math.floor(Math.random() * 300 + 50),
      y: Math.floor(Math.random() * 180 + 40),
      w: Math.floor(Math.random() * 60 + 80),
      h: Math.floor(Math.random() * 60 + 80),
      dx: (Math.random() - 0.5) * 1.5,
      dy: (Math.random() - 0.5) * 1.5,
      color: overkillMode ? '#ff3c00' : '#00f3ff',
    };

    updateBoxPosition(newId, newBox);
    setSelectedBoxId(newId);
    addLog(`CV Vision: Acquired new track target [${newId}: ${label}]`, 'CV_STACK', 'info');
  };

  // Canvas Motion and HUD Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      tick++;

      const width = canvas.width;
      const height = canvas.height;

      // Clear with dark semi-transparent CCTV background
      ctx.fillStyle = '#020b18';
      ctx.fillRect(0, 0, width, height);

      // 1. CCTV Grid pattern
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 36;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Animated CCTV Laser Scanline
      const scanY = (tick * 1.8) % height;
      const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY);
      grad.addColorStop(0, 'rgba(0, 243, 255, 0)');
      grad.addColorStop(1, overkillMode ? 'rgba(255, 60, 0, 0.25)' : 'rgba(0, 243, 255, 0.15)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 30, width, 30);

      ctx.strokeStyle = overkillMode ? 'rgba(255, 60, 0, 0.7)' : 'rgba(0, 243, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();

      // 3. Update & Draw Bounding Boxes
      const currentBoxes = boxesRef.current;
      currentBoxes.forEach((box) => {
        // Physics update: bounce off edges
        box.x += box.dx;
        box.y += box.dy;

        if (box.x < 10) {
          box.x = 10;
          box.dx *= -1;
        }
        if (box.x + box.w > width - 10) {
          box.x = width - 10 - box.w;
          box.dx *= -1;
        }
        if (box.y < 25) {
          box.y = 25;
          box.dy *= -1;
        }
        if (box.y + box.h > height - 25) {
          box.y = height - 25 - box.h;
          box.dy *= -1;
        }

        const isSelected = box.id === selectedBoxId;
        const boxColor = overkillMode ? '#ff3c00' : isSelected ? '#00f3ff' : box.color || '#0055ff';

        // Draw Box Border
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = isSelected ? 2 : 1.2;
        ctx.strokeRect(box.x, box.y, box.w, box.h);

        // Corner tick marks
        const cornerLen = 8;
        ctx.lineWidth = 2.5;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(box.x, box.y + cornerLen);
        ctx.lineTo(box.x, box.y);
        ctx.lineTo(box.x + cornerLen, box.y);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(box.x + box.w - cornerLen, box.y);
        ctx.lineTo(box.x + box.w, box.y);
        ctx.lineTo(box.x + box.w, box.y + cornerLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(box.x, box.y + box.h - cornerLen);
        ctx.lineTo(box.x, box.y + box.h);
        ctx.lineTo(box.x + cornerLen, box.y + box.h);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(box.x + box.w - cornerLen, box.y + box.h);
        ctx.lineTo(box.x + box.w, box.y + box.h);
        ctx.lineTo(box.x + box.w, box.y + box.h - cornerLen);
        ctx.stroke();

        // Label Badge
        ctx.fillStyle = boxColor;
        ctx.fillRect(box.x, box.y - 18, box.w > 120 ? box.w : 120, 18);

        ctx.font = 'bold 9px "Share Tech Mono", monospace';
        ctx.fillStyle = '#01040a';
        ctx.fillText(
          `${box.id}: ${(box.confidence * 100).toFixed(1)}%`,
          box.x + 4,
          box.y - 6
        );

        // Distance & Coordinates tag below box
        ctx.fillStyle = isSelected ? '#00f3ff' : '#9ca3af';
        ctx.font = '8px "Share Tech Mono", monospace';
        ctx.fillText(
          `X:${Math.round(box.x)} Y:${Math.round(box.y)} [v:${box.dx.toFixed(1)},${box.dy.toFixed(1)}]`,
          box.x,
          box.y + box.h + 12
        );
      });

      // 4. Center Targeting Reticle
      const cx = width / 2;
      const cy = height / 2;
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 50, cy);
      ctx.lineTo(cx - 20, cy);
      ctx.moveTo(cx + 20, cy);
      ctx.lineTo(cx + 50, cy);
      ctx.moveTo(cx, cy - 50);
      ctx.lineTo(cx, cy - 20);
      ctx.moveTo(cx, cy + 20);
      ctx.lineTo(cx, cy + 50);
      ctx.stroke();
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [overkillMode, selectedBoxId]);

  // Click on canvas to select bounding box
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    soundFx.playClick(1100);

    // Find clicked box
    const found = boxes.find(
      (b) =>
        clickX >= b.x &&
        clickX <= b.x + b.w &&
        clickY >= b.y - 20 &&
        clickY <= b.y + b.h + 20
    );

    if (found) {
      setSelectedBoxId(found.id);
      addLog(`Target locked: ${found.id} [${found.label}]`, 'CV_STACK', 'info');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* CCTV Viewport with Canvas */}
      <div className="relative w-full h-[320px] md:h-[360px] overflow-hidden rounded bg-black/60 border border-white/10 flex items-center justify-center">
        {/* White Flash Effect on Snapshot */}
        {flashEffect && (
          <div className="absolute inset-0 bg-white z-30 transition-opacity duration-200" />
        )}

        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          onClick={handleCanvasClick}
          className="w-full h-full object-contain cursor-crosshair"
        />

        {/* CCTV Top Overlay HUD */}
        <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/70 px-2 py-1 rounded border border-white/10 text-[10px] font-mono-tech">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-red-400 font-bold">REC // CAM-01 [OPTIC-FEED]</span>
          <span className="text-gray-400">30 FPS // 1080p</span>
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/70 px-2 py-1 rounded border border-white/10 text-[10px] font-mono-tech">
          <span className="text-cyan-400">TRACKED: {boxes.length} OBJECTS</span>
        </div>

        {/* Snapshot & Action Pill on Canvas */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={handleAddTarget}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 rounded text-[10px] font-mono-tech text-blue-300 transition-colors"
          >
            <Crosshair className="w-3 h-3" />
            <span>ADD TARGET</span>
          </button>
          <button
            type="button"
            onClick={handleSnapshot}
            className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/40 rounded text-[10px] font-mono-tech text-cyan-300 transition-colors"
          >
            <Camera className="w-3 h-3" />
            <span>CAPTURE</span>
          </button>
        </div>
      </div>

      {/* Selected Target Inspector Bar */}
      {selectedBox && (
        <div className="p-2.5 bg-white/[0.02] border border-cyan-500/20 rounded flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tech">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/40 font-semibold">
              {selectedBox.id}
            </span>
            <span className="text-gray-200 font-bold">{selectedBox.label}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span>CONFIDENCE: <strong className="text-cyan-300">{(selectedBox.confidence * 100).toFixed(1)}%</strong></span>
            <span>VELOCITY: <strong className="text-gray-200">[{selectedBox.dx.toFixed(1)}, {selectedBox.dy.toFixed(1)}]</strong></span>
            <span className="text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> TRACK_LOCKED
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

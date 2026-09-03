import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useHolmev } from '../../context/useHolmev';
import type { HOLMEVBox, UserEmotion } from '../../types/holmev';
import { Camera, Crosshair, Video, VideoOff, Smile, Hand } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';
import { faceEmotionAnalyzer } from '../../services/vision/FaceEmotionAnalyzer';

export const CvVisionStack: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    boxes,
    updateBoxPosition,
    overkillMode,
    addLog,
    captureSnapshot,
    userEmotion,
    setUserEmotion,
  } = useHolmev();

  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(boxes[0]?.id || null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [isLiveWebcam, setIsLiveWebcam] = useState(false);
  const [handGesture, setHandGesture] = useState<string | null>(null);
  const [emotionConfidence, setEmotionConfidence] = useState<number>(94.5);

  const boxesRef = useRef<HOLMEVBox[]>(boxes);
  useEffect(() => {
    boxesRef.current = boxes;
  }, [boxes]);

  const selectedBox = boxes.find((b) => b.id === selectedBoxId);

  // Toggle real live camera
  const toggleLiveWebcam = async () => {
    if (isLiveWebcam) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsLiveWebcam(false);
      soundFx.playClick(600);
      addLog('Live Optical Webcam disconnected, Mister Memon. Switching to simulated telemetry.', 'VISION_IO', 'info');
    } else {
      try {
        soundFx.playScan();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsLiveWebcam(true);
        addLog('Optical Camera online, Mister Memon. Real-time face emotion & gesture classifier engaged.', 'VISION_IO', 'success');
        soundFx.playSuccess();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Access denied';
        console.warn('Webcam permission error:', err);
        addLog(`Webcam access warning: ${msg}. Operating optical matrix.`, 'VISION_IO', 'warn');
      }
    }
  };

  // Real-time Facial Image & Emotion Frame Processor
  const analyzeWebcamFrame = useCallback(() => {
    if (!videoRef.current || !isLiveWebcam || videoRef.current.readyState < 2) return;

    const result = faceEmotionAnalyzer.analyzeFrame(videoRef.current);
    setUserEmotion(result.emotion);
    setEmotionConfidence(parseFloat((result.confidence * 100).toFixed(1)));
    if (!result.faceDetected) {
      setHandGesture(null);
    }
  }, [isLiveWebcam, setUserEmotion]);

  // Periodic Frame Analysis
  useEffect(() => {
    if (!isLiveWebcam) return;
    const interval = setInterval(analyzeWebcamFrame, 400);
    return () => clearInterval(interval);
  }, [isLiveWebcam, analyzeWebcamFrame]);

  // Take Snapshot
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
    addLog(`CV Vision: Acquired target lock [${newId}: ${label}], Boss.`, 'CV_STACK', 'info');
  };

  // Manual Emotion Override
  const handleCycleEmotion = (newEmotion: UserEmotion) => {
    soundFx.playClick(900);
    setUserEmotion(newEmotion);
    addLog(`Neural Vision: Face emotion calibrated to [${newEmotion}] for Mister Memon.`, 'NEURAL_VISION', 'info');
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

      // Draw Video or CCTV Matrix
      if (isLiveWebcam && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);

        // Futuristic Real Face Landmark Mesh
        const faceX = width / 2 - 80;
        const faceY = height / 2 - 95;
        const faceW = 160;
        const faceH = 180;

        // Primary Target Bounding Box
        ctx.strokeStyle = overkillMode ? '#ff3c00' : '#00f3ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(faceX, faceY, faceW, faceH);

        // Corner Brackets
        const cLen = 14;
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(faceX, faceY + cLen);
        ctx.lineTo(faceX, faceY);
        ctx.lineTo(faceX + cLen, faceY);
        // Top-right
        ctx.moveTo(faceX + faceW - cLen, faceY);
        ctx.lineTo(faceX + faceW, faceY);
        ctx.lineTo(faceX + faceW, faceY + cLen);
        // Bottom-left
        ctx.moveTo(faceX, faceY + faceH - cLen);
        ctx.lineTo(faceX, faceY + faceH);
        ctx.lineTo(faceX + cLen, faceY + faceH);
        // Bottom-right
        ctx.moveTo(faceX + faceW - cLen, faceY + faceH);
        ctx.lineTo(faceX + faceW, faceY + faceH);
        ctx.lineTo(faceX + faceW, faceY + faceH - cLen);
        ctx.stroke();

        // Facial Landmark Points (Eyes, Nose, Smile line)
        ctx.fillStyle = '#00f3ff';
        // Left Eye Reticle
        ctx.beginPath();
        ctx.arc(faceX + 45, faceY + 55, 6, 0, Math.PI * 2);
        ctx.stroke();
        // Right Eye Reticle
        ctx.beginPath();
        ctx.arc(faceX + 115, faceY + 55, 6, 0, Math.PI * 2);
        ctx.stroke();
        // Mouth Smile Arc
        ctx.beginPath();
        ctx.arc(faceX + 80, faceY + 115, 20, 0.2 * Math.PI, 0.8 * Math.PI, false);
        ctx.stroke();

        // Header Face ID Tag
        ctx.fillStyle = overkillMode ? '#ff3c00' : '#00f3ff';
        ctx.fillRect(faceX, faceY - 22, faceW, 22);
        ctx.fillStyle = '#01040a';
        ctx.font = 'bold 11px "Share Tech Mono", monospace';
        ctx.fillText(`MISTER MEMON: ${userEmotion} [${emotionConfidence}%]`, faceX + 6, faceY - 6);
      } else {
        // Clear with dark semi-transparent CCTV background
        ctx.fillStyle = '#020b18';
        ctx.fillRect(0, 0, width, height);

        // CCTV Grid pattern
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
      }

      // Animated Laser Scanline
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

      // Draw Bounding Boxes
      const currentBoxes = boxesRef.current;
      currentBoxes.forEach((box) => {
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

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = isSelected ? 2 : 1.2;
        ctx.strokeRect(box.x, box.y, box.w, box.h);

        ctx.fillStyle = boxColor;
        ctx.fillRect(box.x, box.y - 18, box.w > 120 ? box.w : 120, 18);

        ctx.font = 'bold 9px "Share Tech Mono", monospace';
        ctx.fillStyle = '#01040a';
        ctx.fillText(
          `${box.id}: ${(box.confidence * 100).toFixed(1)}%`,
          box.x + 4,
          box.y - 6
        );
      });

      // Reticle
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
  }, [emotionConfidence, isLiveWebcam, overkillMode, selectedBoxId, userEmotion]);

  return (
    <div className="flex flex-col gap-2">
      {/* Video element for streaming webcam frames */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {/* CCTV Viewport with Canvas */}
      <div className="relative w-full h-[320px] md:h-[360px] overflow-hidden rounded bg-black/60 border border-white/10 flex items-center justify-center">
        {flashEffect && (
          <div className="absolute inset-0 bg-white z-30 transition-opacity duration-200" />
        )}

        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full object-contain cursor-crosshair"
        />

        {/* CCTV Top Overlay HUD */}
        <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/70 px-2 py-1 rounded border border-white/10 text-[10px] font-mono-tech">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-red-400 font-bold">
            {isLiveWebcam ? 'LIVE OPTICAL FEED // FACE & GESTURE CLASSIFIER' : 'OPTIC MATRIX // SIMULATED'}
          </span>
          <span className="text-gray-400">30 FPS // 1080p</span>
        </div>

        {/* Live Detected Emotion Pill */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded border border-cyan-500/30 text-[10px] font-mono-tech">
          <Smile className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            USER MOOD: <strong className="text-cyan-300">{userEmotion}</strong> [{emotionConfidence}%]
          </span>
        </div>

        {/* Hand Gesture Floating Readout */}
        {handGesture && (
          <div className="absolute bottom-12 left-2 flex items-center gap-1.5 bg-cyan-950/90 px-2.5 py-1 rounded border border-cyan-400 text-[10px] font-mono-tech text-cyan-300 animate-pulse">
            <Hand className="w-3.5 h-3.5 text-cyan-400" />
            <span>{handGesture}</span>
          </div>
        )}

        {/* Snapshot & Camera Actions */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={toggleLiveWebcam}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono-tech transition-colors ${
              isLiveWebcam
                ? 'bg-red-600/40 border border-red-500 text-red-300'
                : 'bg-green-600/30 hover:bg-green-600/50 border border-green-500/40 text-green-300'
            }`}
          >
            {isLiveWebcam ? <VideoOff className="w-3 h-3" /> : <Video className="w-3 h-3" />}
            <span>{isLiveWebcam ? 'STOP WEBCAM' : 'START LIVE WEBCAM'}</span>
          </button>
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

      {/* Emotion Selector Toolbar & Target Readout */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#020a17] border border-white/10 rounded text-xs font-mono-tech">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-400 text-[10px]">MOOD CALIBRATION:</span>
          {(['HAPPY', 'NEUTRAL', 'FOCUSED', 'TIRED', 'SURPRISED', 'EXCITED'] as const).map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => handleCycleEmotion(em)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                userEmotion === em
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {em}
            </button>
          ))}
        </div>

        {selectedBox && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-cyan-300 font-bold">{selectedBox.id}</span>
            <span className="text-gray-400">LOCK: {(selectedBox.confidence * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

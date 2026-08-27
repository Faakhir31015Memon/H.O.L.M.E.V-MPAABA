import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useHolmev } from '../../context/useHolmev';
import type { CircuitNode3D } from '../../types/holmev';
import { Cpu, Plus, Trash2, Zap, RefreshCw, Layers } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const CircuitWorkbench3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { circuitNodes, overkillMode, addLog } = useHolmev();
  const [nodes, setNodes] = useState<CircuitNode3D[]>(circuitNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Available module blueprints to spawn
  const moduleTemplates = [
    { type: 'mcu', name: 'ESP32_AI_CORE', color: '#00f3ff' },
    { type: 'relay', name: '4CH_RELAY_BOARD', color: '#0055ff' },
    { type: 'ir_blaster', name: 'IR_TRANSCEIVER', color: '#ff3c00' },
    { type: 'sensor', name: 'DHT22_TEMP_HUM', color: '#34d399' },
    { type: 'power', name: '5V_3A_BUCK_CONV', color: '#ffb700' },
    { type: 'led', name: 'NEOPIXEL_RING', color: '#a855f7' },
  ];

  const handleAddModule = (template: typeof moduleTemplates[0]) => {
    soundFx.playClick(900);
    const newId = `MOD-${Math.floor(Math.random() * 900 + 100)}`;
    const angle = (nodes.length * Math.PI) / 3;
    const rad = 3.5 + Math.random() * 1.5;

    const newNode: CircuitNode3D = {
      id: newId,
      name: `${template.name}_${nodes.length + 1}`,
      type: template.type as any,
      x: Math.cos(angle) * rad,
      y: (Math.random() - 0.5) * 1.5,
      z: Math.sin(angle) * rad,
      color: template.color,
      connectedTo: nodes.length > 0 ? [nodes[0].id] : [],
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
    addLog(`3D Circuit CAD: Spawned module [${newNode.name}] on virtual breadboard.`, 'CIRCUIT_CAD', 'info');
  };

  const handleDeleteSelected = () => {
    if (!selectedNodeId) return;
    soundFx.playPurge();
    const removed = nodes.find((n) => n.id === selectedNodeId);
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setSelectedNodeId(null);
    addLog(`3D Circuit CAD: Module [${removed?.name || selectedNodeId}] dropped into 3D laser dustbin.`, 'CIRCUIT_CAD', 'warn');
  };

  // Three.js Render Scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 500;
    const height = mount.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 10, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(18, 18, 0x00f3ff, 0x002244);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f3ff, 1.5);
    dirLight.position.set(5, 12, 8);
    scene.add(dirLight);

    // 3D Virtual Dustbin on corner
    const binGroup = new THREE.Group();
    binGroup.position.set(7, -1.2, 5);

    const binGeom = new THREE.CylinderGeometry(1.2, 0.9, 1.8, 16, 1, true);
    const binMat = new THREE.MeshStandardMaterial({
      color: 0xff3c00,
      emissive: 0xff3c00,
      emissiveIntensity: 0.4,
      wireframe: true,
    });
    const binMesh = new THREE.Mesh(binGeom, binMat);
    binGroup.add(binMesh);
    scene.add(binGroup);

    // Render Nodes Group
    const nodeMeshesGroup = new THREE.Group();
    scene.add(nodeMeshesGroup);

    const linesGroup = new THREE.Group();
    scene.add(linesGroup);

    // Rebuild 3D Meshes from state
    nodes.forEach((node) => {
      const boxGeom = new THREE.BoxGeometry(1.4, 0.6, 1.4);
      const isSelected = node.id === selectedNodeId;
      const boxMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xffffff : new THREE.Color(node.color),
        emissive: new THREE.Color(node.color),
        emissiveIntensity: isSelected ? 0.9 : 0.4,
        roughness: 0.3,
        metalness: 0.7,
      });
      const mesh = new THREE.Mesh(boxGeom, boxMat);
      mesh.position.set(node.x, node.y, node.z);
      nodeMeshesGroup.add(mesh);

      // Pins / Header indicators
      const pinGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
      const pinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 });
      for (let p = -0.5; p <= 0.5; p += 0.25) {
        const pin = new THREE.Mesh(pinGeom, pinMat);
        pin.position.set(p, 0.35, 0.6);
        mesh.add(pin);
      }
    });

    // Draw Wiring Connections
    if (nodes.length > 1) {
      for (let i = 0; i < nodes.length - 1; i++) {
        const n1 = nodes[i];
        const n2 = nodes[i + 1];
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(n1.x, n1.y + 0.3, n1.z),
          new THREE.Vector3((n1.x + n2.x) / 2, Math.max(n1.y, n2.y) + 1.2, (n1.z + n2.z) / 2),
          new THREE.Vector3(n2.x, n2.y + 0.3, n2.z),
        ]);
        const tubeGeom = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: 0x00f3ff,
          emissive: 0x0055ff,
          emissiveIntensity: 0.6,
        });
        const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
        linesGroup.add(tubeMesh);
      }
    }

    // Animation Loop
    let animId: number;
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) * 0.001;

      // Slow orbital rotate
      nodeMeshesGroup.rotation.y = elapsed * 0.15;
      linesGroup.rotation.y = elapsed * 0.15;
      binMesh.rotation.y = elapsed * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [nodes, selectedNodeId]);

  return (
    <div className="flex flex-col gap-2.5">
      {/* 3D Viewport */}
      <div className="relative w-full h-[320px] md:h-[350px] bg-black/60 rounded border border-cyan-500/20 overflow-hidden">
        <div ref={mountRef} className="w-full h-full cursor-grab" />

        {/* CAD Top HUD Readout */}
        <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/80 px-2.5 py-1 rounded border border-white/10 text-[10px] font-mono-tech">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 font-bold">3D CIRCUIT CAD WORKBENCH</span>
          <span className="text-gray-400">NODES: {nodes.length}</span>
        </div>

        {/* 3D Dustbin Indicator Tag */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-red-950/80 px-2 py-1 rounded border border-red-500/40 text-[10px] font-mono-tech text-red-400">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span>3D LASER DUSTBIN</span>
        </div>
      </div>

      {/* Module Spawner Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#020a17] border border-white/10 rounded text-xs font-mono-tech">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-400 flex items-center gap-1 text-[11px]">
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            SPAWN:
          </span>
          {moduleTemplates.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => handleAddModule(t)}
              className="px-2 py-1 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400 rounded text-[10px] text-gray-300 hover:text-cyan-300 transition-colors"
            >
              +{t.name}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {selectedNodeId && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 rounded text-red-300 text-[10px] transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>DISCARD TO DUSTBIN</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setNodes([])}
            title="Clear Board"
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useHolmev } from '../../context/useHolmev';

export const ReactorCore3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { overkillMode, systemState, metrics } = useHolmev();

  // Keep ref of props for animation loop without full re-render
  const stateRef = useRef({ overkillMode, systemState, metrics });
  useEffect(() => {
    stateRef.current = { overkillMode, systemState, metrics };
  }, [overkillMode, systemState, metrics]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 500;
    const height = mount.clientHeight || 420;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    // 2. Center Core Group
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Inner Glowing Plasma Sphere
    const innerGeom = new THREE.IcosahedronGeometry(2.4, 2);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x0055ff,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true,
    });
    const innerCore = new THREE.Mesh(innerGeom, innerMat);
    coreGroup.add(innerCore);

    // Central Radiant Point Light
    const coreLight = new THREE.PointLight(0x00f3ff, 3, 50);
    coreGroup.add(coreLight);

    // Secondary Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0x020a17, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f3ff, 1.2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // 3. Gyroscopic Quantum Rings
    const createRing = (radius: number, tube: number, color: number) => {
      const ringGeom = new THREE.TorusGeometry(radius, tube, 16, 100);
      const ringMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.9,
      });
      return new THREE.Mesh(ringGeom, ringMat);
    };

    const ring1 = createRing(4.2, 0.08, 0x00f3ff);
    const ring2 = createRing(5.4, 0.07, 0x0055ff);
    const ring3 = createRing(6.6, 0.06, 0x00f3ff);

    coreGroup.add(ring1);
    coreGroup.add(ring2);
    coreGroup.add(ring3);

    // 4. Orbiting 3D Particle Cloud (600+ Sparkles)
    const particleCount = 650;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleOriginalRadii = new Float32Array(particleCount);
    const particleSpeeds = new Float32Array(particleCount);
    const particleAngles = new Float32Array(particleCount);
    const particleYOffsets = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 3.0 + Math.random() * 6.5;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 5.5;

      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;

      particleOriginalRadii[i] = radius;
      particleSpeeds[i] = 0.4 + Math.random() * 1.2;
      particleAngles[i] = angle;
      particleYOffsets[i] = y;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x00f3ff,
      size: 0.14,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // 5. Interactive Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const onMouseMove = (event: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      mouseX = x * 2;
      mouseY = y * 2;
    };

    mount.addEventListener('mousemove', onMouseMove);

    // 6. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });

    resizeObserver.observe(mount);

    // 7. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const { overkillMode: isOverkill, systemState: currentSysState } = stateRef.current;

      const speedMultiplier = isOverkill ? 3.2 : currentSysState === 'PROCESSING' ? 2.0 : 1.0;

      // Color Theme Shifts
      const primaryColor = isOverkill ? 0xff3c00 : 0x00f3ff;
      const secondaryColor = isOverkill ? 0xff0055 : 0x0055ff;

      innerMat.color.setHex(primaryColor);
      innerMat.emissive.setHex(secondaryColor);
      coreLight.color.setHex(primaryColor);
      particleMat.color.setHex(primaryColor);
      (ring1.material as THREE.MeshStandardMaterial).color.setHex(primaryColor);
      (ring2.material as THREE.MeshStandardMaterial).color.setHex(secondaryColor);
      (ring3.material as THREE.MeshStandardMaterial).color.setHex(primaryColor);

      // Core Pulsing & Rotation
      const pulseScale = 1.0 + Math.sin(elapsedTime * (isOverkill ? 8 : 3)) * 0.08;
      innerCore.scale.set(pulseScale, pulseScale, pulseScale);
      innerCore.rotation.y += 0.015 * speedMultiplier;
      innerCore.rotation.x += 0.008 * speedMultiplier;

      // Gyroscopic Ring Rotations
      ring1.rotation.x = elapsedTime * 0.8 * speedMultiplier;
      ring1.rotation.y = elapsedTime * 0.5 * speedMultiplier;

      ring2.rotation.y = -elapsedTime * 0.9 * speedMultiplier;
      ring2.rotation.z = elapsedTime * 0.6 * speedMultiplier;

      ring3.rotation.x = -elapsedTime * 0.4 * speedMultiplier;
      ring3.rotation.z = -elapsedTime * 0.7 * speedMultiplier;

      // Particles orbital motion
      const positions = particleGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        particleAngles[i] += 0.012 * particleSpeeds[i] * speedMultiplier;
        const currentAngle = particleAngles[i];
        const rad = particleOriginalRadii[i] + Math.sin(elapsedTime * 2 + i) * 0.2;

        positions[i * 3] = Math.cos(currentAngle) * rad;
        positions[i * 3 + 1] = particleYOffsets[i] + Math.sin(elapsedTime * 1.5 + i) * 0.3;
        positions[i * 3 + 2] = Math.sin(currentAngle) * rad;
      }
      particleGeom.attributes.position.needsUpdate = true;

      // Mouse Parallax Lerp
      targetRotationY = mouseX * 0.6;
      targetRotationX = mouseY * 0.4;
      coreGroup.rotation.y += (targetRotationY - coreGroup.rotation.y) * 0.05;
      coreGroup.rotation.x += (targetRotationX - coreGroup.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      mount.removeEventListener('mousemove', onMouseMove);
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[380px] md:h-[430px] flex items-center justify-center overflow-hidden rounded bg-black/40 border border-white/5">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Cyberpunk HUD Overlay Ring Graphics */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Outer Circular Reticle */}
        <div
          className={`w-[290px] h-[290px] sm:w-[340px] sm:h-[340px] border border-dashed rounded-full animate-spin-slow opacity-25 ${
            overkillMode ? 'border-red-500' : 'border-cyan-400'
          }`}
          style={{ animationDuration: overkillMode ? '8s' : '26s' }}
        />
        {/* Secondary Reticle */}
        <div
          className={`absolute w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] border border-dotted rounded-full opacity-20 ${
            overkillMode ? 'border-red-400' : 'border-blue-400'
          }`}
        />
      </div>

      {/* Corner Telemetry Readouts */}
      <div className="absolute top-2 left-2 text-[10px] font-mono-tech text-cyan-400/70 pointer-events-none">
        <div>CORE FREQ: 4.80 GHz</div>
        <div>FIELD STRENGTH: {overkillMode ? '99.4% [CRITICAL]' : '82.6% [STABLE]'}</div>
      </div>

      <div className="absolute top-2 right-2 text-[10px] font-mono-tech text-right text-gray-400 pointer-events-none">
        <div>PLASMA DENSITY: 1.48×10²² /m³</div>
        <div className={overkillMode ? 'text-red-400' : 'text-cyan-400'}>
          STATUS: {overkillMode ? 'OVERCLOCKED' : 'SYNCHRONIZED'}
        </div>
      </div>

      <div className="absolute bottom-2 left-2 text-[9px] font-mono-tech text-gray-500 pointer-events-none">
        [MOUSE_DRAG: PARALLAX ROTATE // AUTO-SPIN]
      </div>
    </div>
  );
};

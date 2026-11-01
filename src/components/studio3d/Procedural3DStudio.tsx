/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Procedural3DSceneConfig } from '../../types/film';
import {
  Camera,
  CloudRain,
  Eye,
  Film,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RefreshCw,
  Sun,
  Video,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Radio,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { audioEngine } from '../../utils/audioEngine';
import { ProceduralCanvasRecorder } from '../../services/proceduralRecorder';

interface Props {
  config?: Procedural3DSceneConfig;
  onCaptureFrame?: (dataUrl: string) => void;
  sceneTitle?: string;
  durationSeconds?: number;
  projectId?: string;
  sceneId?: string;
  onRecordingComplete?: (assetUrl: string) => void;
  selectedEntity?: string;
  onSelectEntity?: (entity: any) => void;
  weatherOverride?: 'thunderstorm' | 'rain' | 'fog' | 'clear';
  cameraModeOverride?: 'dolly_in' | 'crane_sweep' | 'tracking_follow' | 'orbit_reveal' | 'handheld_drift';
  timeOfDayOverride?: 'night' | 'dusk' | 'golden_hour';
  cameraFovOverride?: number;
  keyLightIntensityOverride?: number;
  externalTimeSec?: number;
  onTimeUpdate?: (time: number) => void;
}

// Module-scope vectors for zero GC in render loop
const _camTarget = new THREE.Vector3();
const _desiredPos = new THREE.Vector3();

export const Procedural3DStudio: React.FC<Props> = ({
  config,
  onCaptureFrame,
  sceneTitle = 'Obsidian Requiem - Procedural 3D Render',
  durationSeconds = 45,
  projectId = 'syn-default',
  sceneId,
  onRecordingComplete,
  selectedEntity = 'character',
  onSelectEntity,
  weatherOverride,
  cameraModeOverride,
  timeOfDayOverride,
  cameraFovOverride,
  keyLightIntensityOverride,
  externalTimeSec,
  onTimeUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordElapsed, setRecordElapsed] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordFps, setRecordFps] = useState<number>(24);
  const [viewAngle, setViewAngle] = useState<'camera' | 'perspective' | 'top' | 'front'>('camera');
  const [transformMode, setTransformMode] = useState<'move' | 'rotate' | 'scale'>('move');
  const [showSafeFrames, setShowSafeFrames] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);

  const [internalWeather, setInternalWeather] = useState<'thunderstorm' | 'rain' | 'fog' | 'clear'>(
    config?.weather === 'thunderstorm' || config?.weather === 'rain' || config?.weather === 'fog' || config?.weather === 'clear'
      ? config.weather
      : 'thunderstorm'
  );
  const [internalCameraMode, setInternalCameraMode] = useState<'dolly_in' | 'crane_sweep' | 'tracking_follow' | 'orbit_reveal' | 'handheld_drift'>(
    config?.cameraMovement || 'dolly_in'
  );
  const [internalTimeOfDay, setInternalTimeOfDay] = useState<'night' | 'dusk' | 'golden_hour'>('night');
  const [internalCameraFov, setInternalCameraFov] = useState(35);

  const activeWeather = weatherOverride || internalWeather;
  const activeCameraMode = cameraModeOverride || internalCameraMode;
  const activeTimeOfDay = timeOfDayOverride || internalTimeOfDay;
  const cameraFov = cameraFovOverride !== undefined ? cameraFovOverride : internalCameraFov;
  const [elapsedTime, setElapsedTime] = useState(0);

  // References to three objects for runtime controls
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const heroGroupRef = useRef<THREE.Group | null>(null);
  const rainSystemRef = useRef<THREE.Points | null>(null);
  const lightningLightRef = useRef<THREE.PointLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fogRef = useRef<THREE.FogExp2 | null>(null);
  const renderFrameIdRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene & Renderer setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const skyColor = activeTimeOfDay === 'golden_hour' ? 0x221a12 : 0x03060c;
    scene.background = new THREE.Color(skyColor);

    const fog = new THREE.FogExp2(skyColor, 0.028);
    scene.fog = fog;
    fogRef.current = fog;

    const camera = new THREE.PerspectiveCamera(cameraFov, width / height, 0.1, 300);
    camera.position.set(0, 3.5, 22);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = activeTimeOfDay === 'golden_hour' ? 1.3 : 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Mandatory RoomEnvironment reflection map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Studio 3-Point Lighting
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x050810, 0.7);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0x7dd3fc, 2.5);
    keyLight.position.set(12, 24, 15);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 80;
      keyLight.shadow.camera.left = -20;
      keyLight.shadow.camera.right = 20;
      keyLight.shadow.camera.top = 20;
      keyLight.shadow.camera.bottom = -20;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-15, 10, -18);
    scene.add(rimLight);

    // Lightning Flash Light
    const lightningLight = new THREE.PointLight(0xe0f2fe, 0, 150);
    lightningLight.position.set(0, 35, 10);
    scene.add(lightningLight);
    lightningLightRef.current = lightningLight;

    // 4. Ground: Wet Asphalt / Drowned Plaza
    const groundGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f19,
      roughness: 0.15, // Wet slick asphalt specularity
      metalness: 0.25,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle puddle decals / contact shadow
    const puddleGeo = new THREE.CircleGeometry(14, 32);
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.04,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const puddle = new THREE.Mesh(puddleGeo, puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(0, 0.02, 0); // Avoid z-fighting per directives
    scene.add(puddle);

    // 5. Procedural Monolith Skyscrapers (Canyon of Towers)
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.4,
    });
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });

    const towerCount = 18;
    for (let i = 0; i < towerCount; i++) {
      const isLeft = i % 2 === 0;
      const x = isLeft ? -18 - Math.random() * 25 : 18 + Math.random() * 25;
      const z = -60 + (i * 8) + (Math.random() * 6);
      const height = 40 + Math.random() * 70;
      const width = 8 + Math.random() * 10;
      const depth = 8 + Math.random() * 10;

      const tower = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), buildingMat);
      tower.position.set(x, height / 2, z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      scene.add(tower);

      // Accent glowing window strip
      const strip = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 1.2, depth + 0.1), windowMat);
      strip.position.set(x, height * 0.45, z);
      scene.add(strip);
    }

    // 6. Composite 3-12 Part Procedural Hero Actor: The Shrouded Wanderer
    const heroGroup = new THREE.Group();
    heroGroup.position.set(0, 0, 0);

    // Part 1: Heavy Overcoat / Body Core
    const coatGeo = new THREE.CylinderGeometry(0.5, 0.95, 2.4, 16);
    const coatMat = new THREE.MeshStandardMaterial({
      color: 0x0d1117,
      roughness: 0.45,
      metalness: 0.15,
    });
    const coat = new THREE.Mesh(coatGeo, coatMat);
    coat.position.set(0, 1.4, 0);
    coat.castShadow = true;
    heroGroup.add(coat);

    // Part 2: Deep Shrouded Cowl / Hood
    const hoodGeo = new THREE.SphereGeometry(0.48, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7);
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0x080c12,
      roughness: 0.5,
      metalness: 0.1,
    });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.set(0, 2.7, 0.05);
    hood.rotation.x = 0.2;
    hood.castShadow = true;
    heroGroup.add(hood);

    // Part 3: Interior Hood Shadow (concealed face)
    const faceShadow = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x010306 })
    );
    faceShadow.position.set(0, 2.65, 0.15);
    heroGroup.add(faceShadow);

    // Part 4: Cyan Glowing Collar / Relic Indicator
    const relicMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.9,
    });
    const relic = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 16), relicMat);
    relic.rotation.x = Math.PI / 2;
    relic.position.set(0, 2.38, 0.18);
    heroGroup.add(relic);

    // Part 5 & 6: Sturdy Boots
    const bootGeo = new THREE.BoxGeometry(0.3, 0.35, 0.55);
    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x05070a,
      roughness: 0.3,
      metalness: 0.3,
    });
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.35, 0.18, 0.1);
    leftBoot.castShadow = true;
    heroGroup.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.35, 0.18, -0.1);
    rightBoot.castShadow = true;
    heroGroup.add(rightBoot);

    // Part 7: Ground Contact Shadow Plane
    const contactShadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 16),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, 0.03, 0);
    heroGroup.add(contactShadow);

    scene.add(heroGroup);
    heroGroupRef.current = heroGroup;

    // 7. Procedural Rain Particle System (15,000 drops)
    const rainCount = 12000;
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 80;
      rainPositions[i * 3 + 1] = Math.random() * 45;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0xa5f3fc,
      size: 0.15,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const rainSystem = new THREE.Points(rainGeo, rainMat);
    scene.add(rainSystem);
    rainSystemRef.current = rainSystem;

    // 8. Animation & Render Loop
    let clock = new THREE.Clock();
    let lightningTimer = 0;

    const animate = () => {
      renderFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Update rain drops
      if (rainSystem && activeWeather !== 'clear') {
        const positions = rainGeo.attributes.position.array as Float32Array;
        const speed = activeWeather === 'thunderstorm' ? 38 : 22;
        const wind = -5.0; // Angled storm rain
        for (let i = 0; i < rainCount; i++) {
          positions[i * 3 + 1] -= speed * delta;
          positions[i * 3] += wind * delta;
          if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = 45;
            positions[i * 3] = (Math.random() - 0.5) * 80;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // Random dramatic thunderstorm lightning flash
      if (activeWeather === 'thunderstorm' && lightningLightRef.current) {
        lightningTimer += delta;
        if (lightningTimer > 4.5 && Math.random() < 0.04) {
          lightningLightRef.current.intensity = 8.0;
          lightningTimer = 0;
          if (isAudioActive) {
            audioEngine.triggerThunder();
          }
        } else {
          lightningLightRef.current.intensity = THREE.MathUtils.damp(
            lightningLightRef.current.intensity,
            0,
            12,
            delta
          );
        }
      }

      // Hero actor walking kinematics (subtle breathing & forward step bob)
      if (heroGroupRef.current) {
        heroGroupRef.current.position.y = Math.sin(time * 3) * 0.04;
        heroGroupRef.current.rotation.y = Math.sin(time * 1.5) * 0.03;
      }

      // Camera Movement Trajectories
      // Update key light intensity if overridden
      if (keyLightRef.current && keyLightIntensityOverride) {
        keyLightRef.current.intensity = keyLightIntensityOverride;
      }

      // Camera Movement Trajectories
      if (cameraRef.current) {
        _camTarget.set(0, 2.2, 0);

        if (viewAngle === 'top') {
          cameraRef.current.position.set(0, 32, 0.1);
          cameraRef.current.lookAt(0, 0, 0);
        } else if (viewAngle === 'front') {
          cameraRef.current.position.set(0, 2.5, 12);
          cameraRef.current.lookAt(0, 2.0, 0);
        } else if (viewAngle === 'perspective') {
          cameraRef.current.position.set(12, 7, 14);
          cameraRef.current.lookAt(0, 2.0, 0);
        } else {
          // Director Camera Trajectory
          if (activeCameraMode === 'dolly_in') {
            // Slow cinematic push-in
            const t = (Math.sin(time * 0.3) + 1) * 0.5;
            const zPos = THREE.MathUtils.lerp(18, 5.5, t);
            _desiredPos.set(Math.sin(time * 0.1) * 1.2, 2.5 + Math.cos(time * 0.15) * 0.4, zPos);
          } else if (activeCameraMode === 'crane_sweep') {
            // Majestic high altitude crane down
            const t = (Math.sin(time * 0.25) + 1) * 0.5;
            _desiredPos.set(Math.cos(time * 0.2) * 8, THREE.MathUtils.lerp(14, 2.8, t), Math.sin(time * 0.2) * 12 + 10);
          } else if (activeCameraMode === 'tracking_follow') {
            // Low angle ground tracking
            _desiredPos.set(0.8, 1.2, 6.5 + Math.sin(time * 0.4) * 1.5);
          } else if (activeCameraMode === 'orbit_reveal') {
            // 360 degree slow orbit around the character
            const radius = 10;
            _desiredPos.set(Math.sin(time * 0.35) * radius, 3.2, Math.cos(time * 0.35) * radius);
          } else {
            // Organic handheld drift
            _desiredPos.set(
              Math.sin(time * 0.8) * 0.5,
              2.6 + Math.cos(time * 0.6) * 0.2,
              8.0 + Math.sin(time * 0.3) * 0.4
            );
          }

          cameraRef.current.position.copy(_desiredPos);
          cameraRef.current.lookAt(_camTarget);
        }
      }

      renderer.render(scene, camera);
    };

    renderFrameIdRef.current = requestAnimationFrame(animate);

    // Resize listener
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(renderFrameIdRef.current);
      if (rendererRef.current?.domElement && container) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      coatGeo.dispose();
      coatMat.dispose();
      hoodGeo.dispose();
      hoodMat.dispose();
      rainGeo.dispose();
      rainMat.dispose();
    };
  }, [activeWeather, activeCameraMode, activeTimeOfDay, cameraFov]);

  // Audio atmosphere toggle
  const toggleAudio = () => {
    if (isAudioActive) {
      audioEngine.stopAtmosphere();
      setIsAudioActive(false);
    } else {
      audioEngine.startAtmosphere(activeWeather);
      setIsAudioActive(true);
    }
  };

  // Start real Three.js canvas & Web Audio recording
  const handleStartRecording = async () => {
    if (!rendererRef.current?.domElement || isRecording) return;

    setIsRecording(true);
    setRecordProgress(0);
    setRecordElapsed(0);

    // Ensure audio is active for sound capture
    if (!isAudioActive) {
      audioEngine.startAtmosphere(activeWeather);
      setIsAudioActive(true);
    }

    try {
      const recordSec = Math.min(durationSeconds, 60); // Cap single capture at 60s for client
      const result = await ProceduralCanvasRecorder.recordAndUpload({
        canvas: rendererRef.current.domElement,
        durationSeconds: recordSec,
        fps: recordFps,
        projectId,
        sceneId,
        onProgress: (pct, elapsed) => {
          setRecordProgress(pct);
          setRecordElapsed(elapsed);
        },
      });

      setRecordedUrl(result.url);
      if (onRecordingComplete) {
        onRecordingComplete(result.url);
      }
    } catch (err: any) {
      console.error('Procedural recording failed:', err);
    } finally {
      setIsRecording(false);
    }
  };

  // Capture high-res frame
  const handleCapture = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL('image/jpeg', 0.95);
    if (onCaptureFrame) {
      onCaptureFrame(dataUrl);
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden glass-panel border border-sky-900/30 shadow-2xl flex flex-col bg-[#05070d]">
      {/* 2.39:1 CinemaScope Safe Frame Overlay */}
      {showSafeFrames && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between">
          <div className="h-10 bg-black/60 border-b border-white/10" />
          <div className="flex-1 flex justify-between px-12 border-x border-white/10 opacity-30">
            <div className="w-px h-full border-r border-dashed border-sky-400" />
            <div className="w-px h-full border-r border-dashed border-sky-400" />
          </div>
          <div className="h-10 bg-black/60 border-t border-white/10 flex items-center justify-between px-4 text-[9px] font-mono-code text-slate-500">
            <span>2.39:1 CINEMASCOPE SAFE AREA</span>
            <span>ASPECT 16:9 • CFR 24.000 FPS</span>
          </div>
        </div>
      )}

      {/* Top Spec & Viewport Toolbar */}
      <div className="absolute top-4 left-5 right-5 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* View Angle Mode */}
          <div className="flex bg-black/70 backdrop-blur-md p-1 rounded-lg border border-slate-800 text-[10px] font-mono-code">
            {(['camera', 'perspective', 'top', 'front'] as const).map((angle) => (
              <button
                key={angle}
                onClick={() => setViewAngle(angle)}
                className={`px-2 py-1 rounded capitalize transition-all ${
                  viewAngle === angle
                    ? 'bg-sky-500 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {angle === 'camera' ? '🎥 Director Cam' : angle}
              </button>
            ))}
          </div>

          {/* Transform Gizmo Selector */}
          <div className="flex bg-black/70 backdrop-blur-md p-1 rounded-lg border border-slate-800 text-[10px] font-mono-code">
            {(['move', 'rotate', 'scale'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTransformMode(m)}
                className={`px-2 py-1 rounded uppercase transition-all ${
                  transformMode === m
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`Transform Tool [${m[0].toUpperCase()}]`}
              >
                {m[0].toUpperCase()} ({m === 'move' ? 'G' : m === 'rotate' ? 'R' : 'S'})
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowSafeFrames(!showSafeFrames)}
            className={`px-2 py-1 rounded bg-black/70 backdrop-blur-md border text-[10px] font-mono-code ${
              showSafeFrames ? 'border-sky-500/50 text-sky-300' : 'border-slate-800 text-slate-500'
            }`}
          >
            Safe Frame
          </button>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleAudio}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
              isAudioActive
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-200 shadow-lg shadow-sky-500/20'
                : 'bg-black/60 border-slate-700/60 text-slate-300 hover:border-slate-500'
            }`}
          >
            {isAudioActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{isAudioActive ? 'Sound ON' : 'Muted'}</span>
          </button>

          <button
            onClick={handleCapture}
            className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-sky-950/60 border border-slate-700/60 hover:border-sky-500/40 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Snap Frame</span>
          </button>

          <button
            disabled={isRecording}
            onClick={handleStartRecording}
            className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg ${
              isRecording
                ? 'bg-red-600/30 border-red-500 text-red-200 animate-pulse'
                : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 border-red-400/50 text-white'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isRecording ? 'text-red-400 animate-spin' : 'text-white'}`} />
            <span>{isRecording ? `RECORDING ${recordElapsed}s...` : 'RECORD SCENE (24 FPS)'}</span>
          </button>

          {recordedUrl && (
            <a
              href={recordedUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clip Saved</span>
            </a>
          )}
        </div>
      </div>

      {/* Recording Overlay Banner */}
      {isRecording && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-6 py-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-red-500/60 text-xs flex items-center gap-4 text-white shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-mono-code font-bold text-red-400">REC</span>
          </div>
          <span className="font-mono-code text-slate-300">
            {recordElapsed}s / {Math.min(durationSeconds, 60)}s ({recordFps} FPS)
          </span>
          <div className="w-32 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-200"
              style={{ width: `${recordProgress}%` }}
            />
          </div>
          <span className="font-mono-code text-red-300">{recordProgress}%</span>
        </div>
      )}

      {/* Center 3D Viewport (100% Unobstructed Center) */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Ergonomic Collapsible Bottom Dock (Zero Viewport Occlusion) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl transition-all duration-300">
        {/* Toggle Drawer Button */}
        <div className="flex justify-center -mb-2">
          <button
            onClick={() => setIsHudCollapsed(!isHudCollapsed)}
            className="px-4 py-1 rounded-t-lg bg-slate-900/90 border-t border-x border-slate-700/50 text-[11px] font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-lg backdrop-blur"
          >
            {isHudCollapsed ? <Maximize2 className="w-3 h-3 text-sky-400" /> : <Minimize2 className="w-3 h-3 text-sky-400" />}
            <span>{isHudCollapsed ? 'Show Studio Controls' : 'Zen View (Hide Controls)'}</span>
          </button>
        </div>

        {!isHudCollapsed && (
          <div className="glass-panel p-3.5 rounded-xl border border-sky-800/30 flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* Camera Movement Preset */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium text-[11px]">CAMERA MOTION:</span>
              <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-slate-800">
                {(['dolly_in', 'crane_sweep', 'tracking_follow', 'orbit_reveal'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setInternalCameraMode(mode)}
                    className={`px-2.5 py-1 rounded text-[11px] transition-all capitalize ${
                      activeCameraMode === mode
                        ? 'bg-sky-500 text-white font-semibold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Weather / Atmospheric Presets */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium text-[11px]">ATMOSPHERE:</span>
              <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-slate-800">
                {(['thunderstorm', 'rain', 'fog', 'clear'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setInternalWeather(w)}
                    className={`px-2.5 py-1 rounded text-[11px] transition-all capitalize flex items-center gap-1 ${
                      activeWeather === w
                        ? 'bg-indigo-600 text-white font-semibold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {w === 'thunderstorm' && <Zap className="w-3 h-3 text-yellow-300" />}
                    {w === 'rain' && <CloudRain className="w-3 h-3 text-cyan-300" />}
                    <span>{w}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time of Day */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium text-[11px]">LIGHTING:</span>
              <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-slate-800">
                {(['night', 'golden_hour'] as const).map((tod) => (
                  <button
                    key={tod}
                    onClick={() => setInternalTimeOfDay(tod)}
                    className={`px-2.5 py-1 rounded text-[11px] transition-all capitalize ${
                      activeTimeOfDay === tod
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tod.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Focal Length */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium text-[11px]">LENS:</span>
              <select
                value={cameraFov}
                onChange={(e) => setInternalCameraFov(Number(e.target.value))}
                className="bg-black/60 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value={24}>24mm Ultra Wide</option>
                <option value={35}>35mm Anamorphic</option>
                <option value={50}>50mm Prime</option>
                <option value={85}>85mm Portrait Tele</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

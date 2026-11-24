import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { createStudioChromeEnv } from "../../utils/threeStudioEnv";

interface OpeningLogo3DCanvasProps {
  progressRef: MutableRefObject<number>;
  reducedMotion: boolean;
  onWebGLFallback?: () => void;
}

const SVG_CENTER_X = 509;
const SVG_CENTER_Y = 272;
const WORLD_SCALE = 0.0108;

// Exact official WS vector paths extracted from public/assets/wynxsol-logo.svg
const LEFT_W_WING_POINTS: Array<[number, number]> = [
  [272, 181],
  [333, 181],
  [425, 324],
  [496, 324],
  [509, 336],
  [486, 364],
  [388, 364],
];

const CENTER_W_CARET_POINTS: Array<[number, number]> = [
  [416, 268],
  [464, 183],
  [494, 183],
  [575, 314],
  [545, 356],
  [479, 257],
  [443, 308],
];

const RIGHT_S_MONOGRAM_POINTS: Array<[number, number]> = [
  [595, 182],
  [717, 182],
  [745, 217],
  [624, 217],
  [616, 226],
  [713, 313],
  [678, 364],
  [560, 364],
  [589, 324],
  [658, 324],
  [661, 315],
  [560, 223],
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t: number): number {
  const k = clamp01(t);
  return 1 - Math.pow(1 - k, 3);
}

function createRoundedSvgShape(
  points: Array<[number, number]>,
  centerX: number,
  centerY: number,
  scale: number,
  maxCornerRadius: number
): THREE.Shape {
  const pts = points.map(
    ([x, y]) => new THREE.Vector2((x - centerX) * scale, -(y - centerY) * scale)
  );
  const n = pts.length;
  const shape = new THREE.Shape();

  const corners = pts.map((curr, idx) => {
    const prev = pts[(idx - 1 + n) % n];
    const next = pts[(idx + 1) % n];
    const lenPrev = curr.distanceTo(prev);
    const lenNext = curr.distanceTo(next);
    const radius = Math.min(maxCornerRadius, lenPrev * 0.3, lenNext * 0.3);

    const toPrev = new THREE.Vector2().subVectors(prev, curr).normalize();
    const toNext = new THREE.Vector2().subVectors(next, curr).normalize();

    return {
      before: new THREE.Vector2().copy(curr).addScaledVector(toPrev, radius),
      vertex: curr,
      after: new THREE.Vector2().copy(curr).addScaledVector(toNext, radius),
    };
  });

  shape.moveTo(corners[0].before.x, corners[0].before.y);
  shape.quadraticCurveTo(
    corners[0].vertex.x,
    corners[0].vertex.y,
    corners[0].after.x,
    corners[0].after.y
  );

  for (let i = 1; i < corners.length; i++) {
    shape.lineTo(corners[i].before.x, corners[i].before.y);
    shape.quadraticCurveTo(
      corners[i].vertex.x,
      corners[i].vertex.y,
      corners[i].after.x,
      corners[i].after.y
    );
  }

  shape.closePath();
  return shape;
}

export function OpeningLogo3DCanvas({
  progressRef,
  reducedMotion,
  onWebGLFallback,
}: OpeningLogo3DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      const maxDpr = window.innerWidth <= 768 ? 1.5 : 2;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.28;
    } catch {
      renderer = null;
    }

    if (!renderer) {
      onWebGLFallback?.();
      return;
    }

    const activeRenderer = renderer;
    const disposables: Array<{ dispose: () => void }> = [];

    const studioEnv = createStudioChromeEnv(activeRenderer);
    disposables.push(studioEnv);

    const scene = new THREE.Scene();
    scene.environment = studioEnv.envMap;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.set(0, 0, 10.4);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.068,
      bevelSize: 0.042,
      bevelSegments: 10,
      curveSegments: 16,
    };

    const leftWingShape = createRoundedSvgShape(
      LEFT_W_WING_POINTS,
      SVG_CENTER_X,
      SVG_CENTER_Y,
      WORLD_SCALE,
      0.055
    );
    const centerCaretShape = createRoundedSvgShape(
      CENTER_W_CARET_POINTS,
      SVG_CENTER_X,
      SVG_CENTER_Y,
      WORLD_SCALE,
      0.055
    );
    const rightSShape = createRoundedSvgShape(
      RIGHT_S_MONOGRAM_POINTS,
      SVG_CENTER_X,
      SVG_CENTER_Y,
      WORLD_SCALE,
      0.055
    );

    const leftWingGeo = new THREE.ExtrudeGeometry(leftWingShape, extrudeSettings);
    const centerCaretGeo = new THREE.ExtrudeGeometry(centerCaretShape, extrudeSettings);
    const rightSGeo = new THREE.ExtrudeGeometry(rightSShape, extrudeSettings);

    leftWingGeo.translate(0, 0, -0.11);
    centerCaretGeo.translate(0, 0, -0.11);
    rightSGeo.translate(0, 0, -0.11);
    disposables.push(leftWingGeo, centerCaretGeo, rightSGeo);

    const chromeMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.055,
      clearcoat: 1.0,
      clearcoatRoughness: 0.035,
      envMapIntensity: 2.15,
      transparent: true,
      opacity: reducedMotion ? 1 : 0,
    });
    disposables.push(chromeMat);

    const assemblyGroup = new THREE.Group();
    const leftHalfGroup = new THREE.Group();
    const rightHalfGroup = new THREE.Group();

    const leftWingMesh = new THREE.Mesh(leftWingGeo, chromeMat);
    const centerCaretMesh = new THREE.Mesh(centerCaretGeo, chromeMat);
    const rightSMesh = new THREE.Mesh(rightSGeo, chromeMat);

    leftHalfGroup.add(leftWingMesh, centerCaretMesh);
    rightHalfGroup.add(rightSMesh);
    assemblyGroup.add(leftHalfGroup, rightHalfGroup);
    scene.add(assemblyGroup);

    // Pure monochrome studio lighting + sweeping specular glint
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(5, 7, 8);

    const rimLight = new THREE.DirectionalLight(0xe4e4e7, 2.0);
    rimLight.position.set(-6, -4, 5);

    const sweepLight = new THREE.PointLight(0xffffff, 4.2, 22, 1.2);
    sweepLight.position.set(-6, 1.4, 4.6);

    scene.add(ambient, keyLight, rimLight, sweepLight);

    const resize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      activeRenderer.setSize(w, h, false);
      const aspect = w / Math.max(1, h);
      camera.aspect = aspect;
      if (aspect < 1) {
        camera.fov = 46;
        camera.position.z = 11.4;
      } else {
        camera.fov = 34;
        camera.position.z = 10.4;
      }
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    let isVisible = true;
    let targetPtrX = 0;
    let targetPtrY = 0;
    let curPtrX = 0;
    let curPtrY = 0;

    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const onPointerMove = (e: PointerEvent) => {
      if (isCoarse || reducedMotion) return;
      targetPtrX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 0.52;
      targetPtrY = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 0.32;
    };
    const onPointerLeave = () => {
      targetPtrX = 0;
      targetPtrY = 0;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);

    const applySceneState = (now: number) => {
      const p = reducedMotion ? 0.62 : clamp01(progressRef.current);

      curPtrX += (targetPtrX - curPtrX) * 0.08;
      curPtrY += (targetPtrY - curPtrY) * 0.08;

      // Side convergence over text: p 0.08 -> 0.50
      const entryT = easeOutCubic((p - 0.08) / 0.42);
      const invEntry = 1 - entryT;

      leftHalfGroup.position.set(-7.2 * invEntry, 0, 1.8 * invEntry);
      leftHalfGroup.rotation.set(0.14 * invEntry, 0.68 * invEntry, -0.08 * invEntry);

      rightHalfGroup.position.set(7.2 * invEntry, 0, 1.8 * invEntry);
      rightHalfGroup.rotation.set(-0.14 * invEntry, -0.68 * invEntry, 0.08 * invEntry);

      // Opacity ramp in (0.08 -> 0.24) & continuous exit (0.86 -> 1.00)
      const fadeIn = smoothstep(0.08, 0.24, p);
      const exitT = reducedMotion ? 0 : smoothstep(0.86, 1.0, p);
      chromeMat.opacity = clamp01(fadeIn * (1 - exitT));

      // Specular sweep point light peaks as W and S lock together (0.36 -> 0.62)
      const sweepT = clamp01((p - 0.36) / 0.26);
      const sweepCurve = Math.sin(sweepT * Math.PI);
      sweepLight.position.set(-6 + sweepT * 12, 1.25, 4.4);
      sweepLight.intensity = 2.6 + sweepCurve * 3.4;

      // Settled 3D float + restrained pointer interaction + upward recede on exit
      const settledWeight = smoothstep(0.45, 0.6, p) * (1 - exitT * 0.65);
      const floatRotY = reducedMotion ? 0 : Math.sin(now * 0.0007) * 0.08 * settledWeight;
      const floatRotX = reducedMotion ? 0 : Math.cos(now * 0.0005) * 0.04 * settledWeight;

      assemblyGroup.rotation.y = floatRotY + curPtrX * (0.35 + settledWeight * 0.65);
      assemblyGroup.rotation.x = floatRotX - curPtrY * (0.35 + settledWeight * 0.65);
      assemblyGroup.position.set(0, exitT * 1.15, -exitT * 3.2);

      // Slight vertical offset so caption beneath logo remains well balanced when settled
      const scalePulse = 0.96 + entryT * 0.04 - exitT * 0.08;
      assemblyGroup.scale.setScalar(scalePulse);
    };

    let rafId: number | null = null;
    const renderLoop = (now: number) => {
      if (!isVisible) {
        rafId = null;
        return;
      }

      applySceneState(now);
      activeRenderer.render(scene, camera);

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(renderLoop);
      }
    };

    let obs: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      obs = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0].isIntersecting;
          if (isVisible) {
            if (!reducedMotion && rafId === null) {
              rafId = window.requestAnimationFrame(renderLoop);
            } else {
              applySceneState(performance.now());
              activeRenderer.render(scene, camera);
            }
          }
        },
        { rootMargin: "150px" }
      );
      obs.observe(canvas);
    }

    if (!reducedMotion) {
      rafId = window.requestAnimationFrame(renderLoop);
    } else {
      applySceneState(0);
      activeRenderer.render(scene, camera);
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      obs?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      disposables.forEach((d) => d.dispose());
      activeRenderer.dispose();
    };
  }, [progressRef, reducedMotion, onWebGLFallback]);

  return (
    <canvas
      ref={canvasRef}
      className="opening-logo-3d-canvas"
      id="opening-logo-3d-canvas"
      aria-hidden="true"
    />
  );
}

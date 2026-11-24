import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PROCESS_STAGES } from "../../data/company";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { createStudioChromeEnv } from "../../utils/threeStudioEnv";

interface ProcessMechanismCanvasProps {
  activeStage: number;
}

const PLATE_SPECS = [
  { w: 2.85, h: 3.45, d: 0.09, color: 0x0c0c0e, edge: 0x52525b, metal: 0.65, rough: 0.34 },
  { w: 2.52, h: 3.12, d: 0.09, color: 0x52525b, edge: 0xd4d4d8, metal: 0.90, rough: 0.18 },
  { w: 2.22, h: 2.82, d: 0.11, color: 0xffffff, edge: 0xffffff, metal: 1.00, rough: 0.06 },
  { w: 1.92, h: 2.50, d: 0.11, color: 0x27272a, edge: 0xa1a1aa, metal: 0.85, rough: 0.22 },
  { w: 1.54, h: 2.04, d: 0.14, color: 0xd4d4d8, edge: 0xffffff, metal: 0.98, rough: 0.10 },
];

export function ProcessMechanismCanvas({ activeStage }: ProcessMechanismCanvasProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stageStateRef = useRef({
    activeStage: 0,
    targetCompression: 0,
    currentCompression: 0,
    targetRotY: -0.46,
    currentRotY: -0.46,
    pointerX: 0,
    pointerY: 0,
    isMechVisible: false,
  });

  const renderNowRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(4, activeStage));
    const s = stageStateRef.current;
    s.activeStage = clamped;
    s.targetCompression = clamped / 4;
    s.targetRotY = -0.46 + s.targetCompression * 0.46;
    if (reducedMotion || !s.isMechVisible) {
      s.currentCompression = s.targetCompression;
      s.currentRotY = s.targetRotY;
      renderNowRef.current?.();
    }
  }, [activeStage, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      const maxDpr = window.innerWidth <= 768 ? 1.5 : 2;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.22;
    } catch {
      return;
    }

    const activeRenderer = renderer;
    const disposables: Array<{ dispose: () => void }> = [];

    const studioEnv = createStudioChromeEnv(activeRenderer);
    disposables.push(studioEnv);

    const scene = new THREE.Scene();
    scene.environment = studioEnv.envMap;

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.set(4.8, 2.2, 6.2);
    camera.lookAt(0, 0, 0);

    const group = new THREE.Group();
    scene.add(group);

    const light1 = new THREE.DirectionalLight(0xffffff, 2.1);
    light1.position.set(5, 8, 6);
    const rimLight = new THREE.DirectionalLight(0xf4f4f5, 1.4);
    rimLight.position.set(-5, -2, 4);
    scene.add(light1, rimLight, new THREE.AmbientLight(0xffffff, 0.45));

    const plates: THREE.Mesh[] = [];
    PLATE_SPECS.forEach((s) => {
      const geo = new THREE.BoxGeometry(s.w, s.h, s.d);
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const mat = new THREE.MeshPhysicalMaterial({
        color: s.color,
        roughness: s.rough,
        metalness: s.metal,
        clearcoat: 0.78,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.55,
      });
      const wireMat = new THREE.LineBasicMaterial({ color: s.edge });
      disposables.push(geo, edgeGeo, mat, wireMat);

      const mesh = new THREE.Mesh(geo, mat);
      mesh.add(new THREE.LineSegments(edgeGeo, wireMat));
      group.add(mesh);
      plates.push(mesh);
    });

    const strutGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.65, -0.85, -2.5),
      new THREE.Vector3(-0.65, -0.85, 2.5),
      new THREE.Vector3(0.65, 0.85, -2.5),
      new THREE.Vector3(0.65, 0.85, 2.5),
    ]);
    const strutMat = new THREE.LineBasicMaterial({
      color: 0xe4e4e7,
      transparent: true,
      opacity: 0.45,
    });
    disposables.push(strutGeo, strutMat);
    group.add(new THREE.LineSegments(strutGeo, strutMat));

    const resize = () => {
      const w = canvas.clientWidth || 480;
      const h = canvas.clientHeight || 380;
      activeRenderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const onPointerMove = (e: PointerEvent) => {
      if (reducedMotion) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      stageStateRef.current.pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.18;
      stageStateRef.current.pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.12;
    };
    const onPointerLeave = () => {
      stageStateRef.current.pointerX = 0;
      stageStateRef.current.pointerY = 0;
    };
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerleave", onPointerLeave);

    let smoothPtrX = 0;
    let smoothPtrY = 0;

    const renderFrame = () => {
      const s = stageStateRef.current;
      const spread = (1 - s.currentCompression) * 0.95 + 0.08;
      plates.forEach((mesh, idx) => {
        mesh.position.z = (idx - 2) * spread;
        mesh.scale.setScalar(idx === s.activeStage ? 1.04 : 1);
      });
      smoothPtrX += (s.pointerX - smoothPtrX) * 0.08;
      smoothPtrY += (s.pointerY - smoothPtrY) * 0.08;
      group.rotation.y = s.currentRotY + smoothPtrX;
      activeRenderer.render(scene, camera);
    };
    renderNowRef.current = renderFrame;

    let rafId: number | null = null;
    const animate = () => {
      const s = stageStateRef.current;
      if (!s.isMechVisible) {
        rafId = null;
        return;
      }
      s.currentCompression += (s.targetCompression - s.currentCompression) * 0.1;
      s.currentRotY += (s.targetRotY - s.currentRotY) * 0.1;
      if (!reducedMotion) {
        group.rotation.x = Math.sin(performance.now() * 0.0008) * 0.04 - smoothPtrY;
      }
      renderFrame();
      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(animate);
      }
    };

    let obs: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      obs = new IntersectionObserver(
        (entries) => {
          stageStateRef.current.isMechVisible = entries[0].isIntersecting;
          if (entries[0].isIntersecting && !reducedMotion && rafId === null) {
            rafId = window.requestAnimationFrame(animate);
          } else if (entries[0].isIntersecting) {
            renderFrame();
          }
        },
        { rootMargin: "150px" }
      );
      obs.observe(canvas);
    } else {
      stageStateRef.current.isMechVisible = true;
    }

    if (!reducedMotion && stageStateRef.current.isMechVisible) {
      rafId = window.requestAnimationFrame(animate);
    } else {
      renderFrame();
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      obs?.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      renderNowRef.current = null;
      disposables.forEach((d) => d.dispose());
      activeRenderer.dispose();
    };
  }, [reducedMotion]);

  const currentStage = PROCESS_STAGES[activeStage] || PROCESS_STAGES[0];
  const assemblyPct = String(Math.round((activeStage / 4) * 100)).padStart(2, "0");

  return (
    <div className="process-canvas-wrap">
      <canvas
        ref={canvasRef}
        className="process-mechanism-canvas"
        id="process-mechanism-canvas"
        aria-label="Interactive 3D exploded chrome mechanism"
      />
      <div className="process-cad-hud" id="process-cad-hud" aria-hidden="true">
        <span>{currentStage.hudLabel}</span>
        <span id="process-cad-compression">ASSEMBLY: {assemblyPct}%</span>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createInitialTables, PROBLEM_BEATS } from "../../data/restaurant";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { createStudioChromeEnv } from "../../utils/threeStudioEnv";
import { SmartLink } from "../shell/SmartLink";

export function ProblemChapter3D() {
  const reducedMotion = useReducedMotion();
  const [activeBeat, setActiveBeat] = useState(0);

  const wrapRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ptagT04Ref = useRef<HTMLDivElement | null>(null);
  const ptagT03Ref = useRef<HTMLDivElement | null>(null);
  const ptagStaffRef = useRef<HTMLDivElement | null>(null);
  const manualTargetProgRef = useRef<number | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const layoutTables = createInitialTables();

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: "high-performance",
      });
      const maxDpr = window.innerWidth <= 768 ? 1.5 : 2;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
    } catch {
      renderer = null;
    }

    if (!renderer) {
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;
      let prog = reducedMotion ? 0.45 : 0;

      const draw2D = () => {
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        ctx2d.fillStyle = "#050506";
        ctx2d.fillRect(0, 0, w, h);

        ctx2d.strokeStyle = "rgba(255, 255, 255, 0.3)";
        layoutTables.forEach((t) => {
          const px = (t.x / 100) * w;
          const py = (t.y / 100) * h;
          ctx2d.strokeRect(px - 22, py - 22, 44, 44);
        });
        const beat = Math.min(4, Math.floor(prog * 4.99));
        setActiveBeat((prev) => (prev !== beat ? beat : prev));
      };

      draw2D();
      window.addEventListener("resize", draw2D);

      let stFallback: ScrollTrigger | null = null;
      if (!reducedMotion) {
        stFallback = ScrollTrigger.create({
          trigger: wrap,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            prog = self.progress;
            draw2D();
          },
        });
      }

      return () => {
        window.removeEventListener("resize", draw2D);
        stFallback?.kill();
      };
    }

    const activeRenderer = renderer;
    const disposables: Array<{ dispose: () => void }> = [];

    const studioEnv = createStudioChromeEnv(activeRenderer);
    disposables.push(studioEnv);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050506);
    scene.fog = new THREE.FogExp2(0x050506, 0.03);
    scene.environment = studioEnv.envMap;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80);

    const gridHelper = new THREE.GridHelper(22, 22, 0x3f3f46, 0x18181b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);
    disposables.push(gridHelper.geometry);
    if (Array.isArray(gridHelper.material)) {
      gridHelper.material.forEach((m) => disposables.push(m));
    } else {
      disposables.push(gridHelper.material);
    }

    const floorGeo = new THREE.PlaneGeometry(20, 14);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070708,
      roughness: 0.72,
      metalness: 0.25,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.02;
    scene.add(floorMesh);
    disposables.push(floorGeo, floorMat);

    const wallBoxGeo = new THREE.BoxGeometry(15.5, 3.6, 10.5);
    const wallEdgeGeo = new THREE.EdgesGeometry(wallBoxGeo);
    const wallLineMat = new THREE.LineBasicMaterial({
      color: 0xa1a1aa,
      transparent: true,
      opacity: 0.16,
    });
    const wallLines = new THREE.LineSegments(wallEdgeGeo, wallLineMat);
    wallLines.position.set(0, 1.8, 0);
    scene.add(wallLines);
    disposables.push(wallBoxGeo, wallEdgeGeo, wallLineMat);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
    keyLight.position.set(6, 12, 8);
    scene.add(keyLight);
    const whitePendant = new THREE.PointLight(0xffffff, 2.8, 18, 1.3);
    whitePendant.position.set(0, 3.4, 0.8);
    scene.add(whitePendant);

    const tableWorldPos: Record<string, THREE.Vector3> = {};
    const tableTopGeo = new THREE.BoxGeometry(1.35, 0.1, 1.35);
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.72, 8);
    const chairGeo = new THREE.BoxGeometry(0.36, 0.45, 0.36);
    const guestGeo = new THREE.CylinderGeometry(0.16, 0.19, 0.52, 12);
    const darkTableMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.28,
      metalness: 0.72,
      envMapIntensity: 1.15,
    });
    const chairMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.42,
      metalness: 0.45,
    });
    const legMat = new THREE.MeshStandardMaterial({
      color: 0xa1a1aa,
      roughness: 0.2,
      metalness: 0.9,
    });
    const guestMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f5,
      roughness: 0.25,
      metalness: 0.35,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x71717a, transparent: true, opacity: 0.35 });
    const brightEdgeMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });
    const tableEdgeGeo = new THREE.EdgesGeometry(tableTopGeo);
    disposables.push(
      tableTopGeo,
      legGeo,
      chairGeo,
      guestGeo,
      darkTableMat,
      chairMat,
      legMat,
      guestMat,
      edgeMat,
      brightEdgeMat,
      tableEdgeGeo
    );

    const chairInst = new THREE.InstancedMesh(chairGeo, chairMat, layoutTables.length * 4);
    disposables.push(chairInst);
    const dummy = new THREE.Object3D();
    let chairIdx = 0;

    const ringGeo = new THREE.RingGeometry(0.95, 1.12, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const uncleanedRingMat = new THREE.MeshBasicMaterial({
      color: 0xa1a1aa,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    disposables.push(ringGeo, beaconMat, uncleanedRingMat);

    let alertBeaconT04: THREE.Mesh | null = null;
    let alertBeaconT03: THREE.Mesh | null = null;

    layoutTables.forEach((t) => {
      const wx = (t.x - 50) * 0.16;
      const wz = (t.y - 50) * 0.105;
      tableWorldPos[t.id] = new THREE.Vector3(wx, 0.9, wz);

      const tGroup = new THREE.Group();
      tGroup.position.set(wx, 0, wz);

      const top = new THREE.Mesh(tableTopGeo, darkTableMat);
      top.position.y = 0.74;
      top.add(
        new THREE.LineSegments(tableEdgeGeo, t.id === "04" || t.id === "03" ? brightEdgeMat : edgeMat)
      );
      tGroup.add(top);

      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.y = 0.36;
      tGroup.add(leg);

      const lampGeo = new THREE.CylinderGeometry(0.14, 0.24, 0.18, 12);
      const lampMat = new THREE.MeshBasicMaterial({
        color: t.id === "04" ? 0xffffff : 0xd4d4d8,
      });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.y = 3.1;
      tGroup.add(lamp);
      disposables.push(lampGeo, lampMat);

      if (t.id === "01" || t.id === "04" || t.id === "05") {
        [-0.78, 0.78].forEach((oz) => {
          const g = new THREE.Mesh(guestGeo, guestMat);
          g.position.set(0, 0.9, oz);
          tGroup.add(g);
        });
      }

      if (t.id === "04") {
        alertBeaconT04 = new THREE.Mesh(ringGeo, beaconMat);
        alertBeaconT04.position.y = 0.04;
        tGroup.add(alertBeaconT04);
      }
      if (t.id === "03") {
        alertBeaconT03 = new THREE.Mesh(ringGeo, uncleanedRingMat);
        alertBeaconT03.position.y = 0.04;
        tGroup.add(alertBeaconT03);
      }

      scene.add(tGroup);

      [
        [0, -0.95],
        [0, 0.95],
        [-0.95, 0],
        [0.95, 0],
      ].forEach(([cx, cz]) => {
        dummy.position.set(wx + cx, 0.42, wz + cz);
        dummy.updateMatrix();
        chairInst.setMatrixAt(chairIdx++, dummy.matrix);
      });
    });

    chairInst.instanceMatrix.needsUpdate = true;
    scene.add(chairInst);

    const staffGeo = new THREE.CapsuleGeometry(0.16, 0.85, 6, 12);
    const staffMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      roughness: 0.22,
      metalness: 0.65,
    });
    const waiterA = new THREE.Mesh(staffGeo, staffMat);
    waiterA.position.set(-4.8, 0.7, -3.5);
    const waiterB = new THREE.Mesh(staffGeo, staffMat);
    waiterB.position.set(4.5, 0.7, -3.4);
    scene.add(waiterA, waiterB);
    disposables.push(staffGeo, staffMat);

    const staffPosVec = new THREE.Vector3(-4.8, 1.35, -3.5);

    const resize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      activeRenderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.fov = camera.aspect < 1 ? 58 : 44;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const projectTag = (el: HTMLDivElement | null, worldVec: THREE.Vector3 | undefined, show: boolean) => {
      if (!el || !worldVec) return;
      if (!show || window.innerWidth <= 760) {
        el.style.opacity = "0";
        return;
      }
      const p = worldVec.clone().project(camera);
      if (p.z > 1) {
        el.style.opacity = "0";
        return;
      }
      const xPct = Math.min(82, Math.max(18, (p.x * 0.5 + 0.5) * 100));
      const yPct = Math.min(70, Math.max(28, (-p.y * 0.5 + 0.5) * 100));
      el.style.opacity = "1";
      el.style.left = `${xPct.toFixed(1)}%`;
      el.style.top = `${yPct.toFixed(1)}%`;
    };

    let currentProg = reducedMotion ? 0.45 : 0;
    let isVisible = true;

    const applyCameraForProgress = (p: number) => {
      currentProg = Math.max(0, Math.min(1, p));
      const beat = Math.min(4, Math.floor(currentProg * 4.99));
      setActiveBeat((prev) => (prev !== beat ? beat : prev));

      let px = 0;
      let py = 0;
      let pz = 0;
      let lx = 0;
      let ly = 0;
      let lz = 0;

      if (currentProg < 0.25) {
        const t = currentProg / 0.25;
        px = -4.2 + t * 2.4;
        py = 2.6 - t * 0.3;
        pz = 8.4 - t * 2.2;
        lx = -0.2;
        ly = 0.7;
        lz = 0.8;
      } else if (currentProg < 0.5) {
        const t = (currentProg - 0.25) / 0.25;
        px = -1.8 + t * 5.6;
        py = 2.3 + t * 1.4;
        pz = 6.2 - t * 2.6;
        lx = t * 1.6;
        ly = 0.7;
        lz = 0.4 - t * 1.6;
      } else if (currentProg < 0.75) {
        const t = (currentProg - 0.5) / 0.25;
        px = 3.8 - t * 3.8;
        py = 3.7 + t * 4.5;
        pz = 3.6 + t * 2.2;
        lx = 1.6 - t * 1.6;
        ly = 0.6;
        lz = -1.2 + t * 1.2;
      } else {
        const t = (currentProg - 0.75) / 0.25;
        const ease = t * t * (3 - 2 * t);
        px = 0;
        py = 8.2 + ease * 8.6;
        pz = 5.8 * (1 - ease) + 0.05;
        lx = 0;
        ly = 0;
        lz = -1.25 * ease;
      }

      camera.position.set(px, py, pz);
      camera.lookAt(lx, ly, lz);
      camera.updateMatrixWorld();

      wallLineMat.opacity =
        currentProg > 0.7 ? Math.max(0.05, (1 - (currentProg - 0.7) / 0.3) * 0.16) : 0.16;

      const showTags = currentProg < 0.88;
      projectTag(ptagT04Ref.current, tableWorldPos["04"], showTags);
      projectTag(ptagT03Ref.current, tableWorldPos["03"], showTags && currentProg >= 0.2);
      projectTag(ptagStaffRef.current, staffPosVec, showTags && currentProg >= 0.42);
    };

    let rafId: number | null = null;
    const renderLoop = (now: number) => {
      if (!isVisible) {
        rafId = null;
        return;
      }

      if (manualTargetProgRef.current !== null) {
        const nextP = currentProg + (manualTargetProgRef.current - currentProg) * 0.12;
        applyCameraForProgress(nextP);
        if (Math.abs(manualTargetProgRef.current - nextP) < 0.002) {
          manualTargetProgRef.current = null;
        }
      }

      const sec = now * 0.002;
      if (alertBeaconT04) {
        const s = 1 + Math.sin(sec * 2.2) * 0.16;
        alertBeaconT04.scale.set(s, s, s);
      }
      if (alertBeaconT03) {
        const s2 = 1 + Math.cos(sec * 1.8) * 0.12;
        alertBeaconT03.scale.set(s2, s2, s2);
      }
      waiterA.position.x = -4.8 + Math.sin(sec * 0.45) * 1.1;
      waiterB.position.z = -3.4 + Math.cos(sec * 0.5) * 0.7;
      staffPosVec.set(waiterA.position.x, 1.35, waiterA.position.z);

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
          if (isVisible && !reducedMotion && rafId === null) {
            rafId = window.requestAnimationFrame(renderLoop);
          } else if (isVisible) {
            activeRenderer.render(scene, camera);
          }
        },
        { rootMargin: "150px" }
      );
      obs.observe(wrap);
    }

    applyCameraForProgress(currentProg);

    let st: ScrollTrigger | null = null;
    if (!reducedMotion) {
      st = ScrollTrigger.create({
        trigger: wrap,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        onUpdate: (self) => {
          manualTargetProgRef.current = null;
          applyCameraForProgress(self.progress);
        },
      });
      rafId = window.requestAnimationFrame(renderLoop);
    } else {
      activeRenderer.render(scene, camera);
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      st?.kill();
      obs?.disconnect();
      window.removeEventListener("resize", resize);
      disposables.forEach((d) => d.dispose());
      activeRenderer.dispose();
    };
  }, [reducedMotion]);

  const currentBeat = PROBLEM_BEATS[activeBeat] || PROBLEM_BEATS[0];

  return (
    <section
      ref={wrapRef}
      className="problem-scene-wrap"
      id="chapter-problem"
      data-scene-index="CH 01 | 03"
      aria-labelledby="problem-heading"
    >
      <div className="problem-scene-pin">
        <canvas
          ref={canvasRef}
          className="restaurant-problem-canvas"
          id="restaurant-problem-canvas"
          aria-label="Interactive 3D dining floor problem scene"
        />

        <div className="problem-hud-overlay">
          <div className="container problem-hud-top">
            <div className="problem-top-bar">
              <div className="concept-pill" style={{ marginBottom: 0 }}>
                Concept in Development // Architectural Vision Study
              </div>
              <nav className="chapter-jump-nav" aria-label="Restaurant Intelligence Chapters">
                <SmartLink to="#chapter-problem" className="chapter-jump-pill is-active">
                  01 The Problem
                </SmartLink>
                <SmartLink to="#chapter-simulation" className="chapter-jump-pill">
                  02 The Simulation
                </SmartLink>
                <SmartLink to="#chapter-solution" className="chapter-jump-pill">
                  03 The Solution
                </SmartLink>
              </nav>
            </div>

            <div className="problem-headline-block">
              <span className="eyebrow-editorial" style={{ marginBottom: "0.5rem" }}>
                Chapter 01 // Dining Floor Blind Spots
              </span>
              <h1 className="serif-display problem-headline" id="problem-heading">
                EVERY MINUTE
                <br />
                MATTERS.
              </h1>
            </div>
          </div>

          <div className="problem-spatial-tags" id="problem-spatial-tags" aria-hidden="true">
            <div ref={ptagT04Ref} className="problem-spatial-tag is-alert" id="ptag-t04">
              T-04 // GUESTS WAITING (UNATTENDED)
            </div>
            <div ref={ptagT03Ref} className="problem-spatial-tag is-cleaning" id="ptag-t03">
              T-03 // LEFT UNCLEANED
            </div>
            <div ref={ptagStaffRef} className="problem-spatial-tag" id="ptag-staff">
              STAFF // MISSED FLOOR EVENT
            </div>
          </div>

          <div className="container problem-hud-bottom">
            <div className="problem-story-card" id="problem-story-card">
              <div className="problem-story-head">
                <span className="problem-step-tag" id="problem-step-tag">
                  {currentBeat.tag}
                </span>
                <span className="problem-cam-tag" id="problem-cam-tag">
                  {currentBeat.cam}
                </span>
              </div>
              <h2 className="sans-display" id="problem-step-title" style={{ fontSize: "1.15rem", marginTop: "0.35rem" }}>
                {currentBeat.title}
              </h2>
              <p style={{ fontSize: "13px", marginTop: "0.4rem", color: "rgba(255, 255, 255, 0.72)" }} id="problem-step-desc">
                {currentBeat.desc}
              </p>

              <div className="problem-step-pills" role="tablist" aria-label="Problem moments">
                {PROBLEM_BEATS.map((beat, idx) => (
                  <button
                    key={beat.pillLabel}
                    type="button"
                    role="tab"
                    aria-selected={activeBeat === idx}
                    className={`problem-step-btn${activeBeat === idx ? " is-active" : ""}`}
                    onClick={() => {
                      manualTargetProgRef.current = idx / 4;
                      setActiveBeat(idx);
                    }}
                  >
                    {beat.pillLabel}
                  </button>
                ))}
              </div>
            </div>

            <SmartLink to="#chapter-simulation" className="btn btn--chrome btn--sm">
              Enter Interactive Simulation &darr;
            </SmartLink>
          </div>
        </div>
      </div>
    </section>
  );
}

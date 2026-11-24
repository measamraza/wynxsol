import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createStudioChromeEnv } from "../../utils/threeStudioEnv";

interface LiquidChromeCanvasProps {
  triggerRef: RefObject<HTMLElement | null>;
  reducedMotion: boolean;
}

/**
 * Generates an anisotropic brushed-metal & micro-grain CanvasTexture
 * to give liquid chrome and satin titanium sculptural tactility under studio light.
 */
function createBrushedChromeTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, size, size);

    // Subtle directional brushed grain striations
    for (let y = 0; y < size; y++) {
      const band = Math.sin(y * 0.14) * 18 + Math.cos(y * 0.43) * 10;
      const lum = Math.max(96, Math.min(168, Math.round(128 + band)));
      ctx.fillStyle = `rgb(${lum}, ${lum}, ${lum})`;
      ctx.fillRect(0, y, size, 1);
    }

    // Fine metallic micro-streaks for organic specular break-up
    for (let i = 0; i < 900; i++) {
      const x = (i * 73) % size;
      const y = (i * 197) % size;
      const w = 24 + (i % 64);
      const bright = i % 2 === 0;
      ctx.fillStyle = bright ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)";
      ctx.fillRect(x, y, w, 1.2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.anisotropy = 4;
  return tex;
}

export function LiquidChromeCanvas({ triggerRef, reducedMotion }: LiquidChromeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const triggerEl = triggerRef.current;
    const canvas = canvasRef.current;
    if (!triggerEl || !canvas) return;

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
      return;
    }

    const activeRenderer = renderer;
    const disposables: Array<{ dispose: () => void }> = [];

    const studioEnv = createStudioChromeEnv(activeRenderer);
    const brushedTex = createBrushedChromeTexture();
    disposables.push(studioEnv, brushedTex);

    const scene = new THREE.Scene();
    scene.environment = studioEnv.envMap;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0, 8.4);

    const sculptureGroup = new THREE.Group();
    scene.add(sculptureGroup);

    // Shared real-time liquid-mercury GPU shader uniforms
    const liquidUniforms = {
      uTime: { value: 0 },
      uPointerLocal: { value: new THREE.Vector3(0, 0, 1.5) },
      uLiquidEnergy: { value: 0 },
      uRippleAmp: { value: 0 },
    };

    // Enlarged primary interlocking liquid-chrome knot
    const knotGeo = new THREE.TorusKnotGeometry(1.62, 0.4, 260, 48, 2, 3);
    const liquidChromeMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.065,
      clearcoat: 1.0,
      clearcoatRoughness: 0.035,
      bumpMap: brushedTex,
      bumpScale: 0.013,
      roughnessMap: brushedTex,
      envMapIntensity: 2.05,
    });

    liquidChromeMat.customProgramCacheKey = () => "wynx-liquid-chrome-knot-v1";
    liquidChromeMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = liquidUniforms.uTime;
      shader.uniforms.uPointerLocal = liquidUniforms.uPointerLocal;
      shader.uniforms.uLiquidEnergy = liquidUniforms.uLiquidEnergy;
      shader.uniforms.uRippleAmp = liquidUniforms.uRippleAmp;

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
uniform float uTime;
uniform vec3 uPointerLocal;
uniform float uLiquidEnergy;
uniform float uRippleAmp;

float calcLiquidDisp(vec3 p) {
  float breath = sin(p.x * 2.2 + uTime * 1.6) * cos(p.y * 2.0 - uTime * 1.3) * 0.022;
  float dist = length(p - uPointerLocal);
  float prox = exp(-dist * dist * 0.85);
  float bulge = prox * uLiquidEnergy * 0.15;
  float ripple = sin(dist * 7.2 - uTime * 7.4) * prox * (uLiquidEnergy * 0.085 + uRippleAmp * 0.14);
  float slosh = sin(p.z * 3.1 + p.x * 2.3 + uTime * 3.2) * (uLiquidEnergy * 0.055 + uRippleAmp * 0.05);
  return breath + bulge + ripple + slosh;
}`
        )
        .replace(
          "#include <beginnormal_vertex>",
          `#include <beginnormal_vertex>
vec3 lcBaseN = normalize(objectNormal);
vec3 lcUp = abs(lcBaseN.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
vec3 lcT1 = normalize(cross(lcUp, lcBaseN));
vec3 lcT2 = normalize(cross(lcBaseN, lcT1));
float lcD0 = calcLiquidDisp(position);
float lcD1 = calcLiquidDisp(position + lcT1 * 0.035);
float lcD2 = calcLiquidDisp(position + lcT2 * 0.035);
vec3 lcP0 = position + lcBaseN * lcD0;
vec3 lcP1 = position + lcT1 * 0.035 + lcBaseN * lcD1;
vec3 lcP2 = position + lcT2 * 0.035 + lcBaseN * lcD2;
vec3 lcPerturbedN = normalize(cross(lcP1 - lcP0, lcP2 - lcP0));
if (dot(lcPerturbedN, lcBaseN) < 0.0) {
  lcPerturbedN = -lcPerturbedN;
}
objectNormal = lcPerturbedN;`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
transformed += normalize(normal) * calcLiquidDisp(position);`
        );
    };

    const knotMesh = new THREE.Mesh(knotGeo, liquidChromeMat);
    sculptureGroup.add(knotMesh);
    disposables.push(knotGeo, liquidChromeMat);

    // Enlarged secondary brushed-silver orbital ribbon with sympathetic liquid flex
    const ribbonGeo = new THREE.TorusGeometry(2.5, 0.056, 28, 160);
    const satinChromeMat = new THREE.MeshPhysicalMaterial({
      color: 0xe4e4e7,
      metalness: 0.96,
      roughness: 0.16,
      clearcoat: 0.78,
      bumpMap: brushedTex,
      bumpScale: 0.008,
      envMapIntensity: 1.65,
    });

    satinChromeMat.customProgramCacheKey = () => "wynx-liquid-ribbon-v1";
    satinChromeMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = liquidUniforms.uTime;
      shader.uniforms.uLiquidEnergy = liquidUniforms.uLiquidEnergy;
      shader.uniforms.uRippleAmp = liquidUniforms.uRippleAmp;

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
uniform float uTime;
uniform float uLiquidEnergy;
uniform float uRippleAmp;

float calcRibbonDisp(vec3 p) {
  float excite = uLiquidEnergy * 0.035 + uRippleAmp * 0.045;
  return sin(p.x * 2.4 + p.y * 2.0 + uTime * 3.8) * (0.006 + excite);
}`
        )
        .replace(
          "#include <beginnormal_vertex>",
          `#include <beginnormal_vertex>
vec3 rbBaseN = normalize(objectNormal);
vec3 rbUp = abs(rbBaseN.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
vec3 rbT1 = normalize(cross(rbUp, rbBaseN));
vec3 rbT2 = normalize(cross(rbBaseN, rbT1));
vec3 rbP0 = position + rbBaseN * calcRibbonDisp(position);
vec3 rbP1 = position + rbT1 * 0.035 + rbBaseN * calcRibbonDisp(position + rbT1 * 0.035);
vec3 rbP2 = position + rbT2 * 0.035 + rbBaseN * calcRibbonDisp(position + rbT2 * 0.035);
vec3 rbPerturbedN = normalize(cross(rbP1 - rbP0, rbP2 - rbP0));
if (dot(rbPerturbedN, rbBaseN) < 0.0) {
  rbPerturbedN = -rbPerturbedN;
}
objectNormal = rbPerturbedN;`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
transformed += normalize(normal) * calcRibbonDisp(position);`
        );
    };

    const ribbonMesh = new THREE.Mesh(ribbonGeo, satinChromeMat);
    ribbonMesh.rotation.set(1.05, 0.42, 0.28);
    sculptureGroup.add(ribbonMesh);
    disposables.push(ribbonGeo, satinChromeMat);

    // Enlarged precision outer hairline architectural ring
    const ringGeo = new THREE.TorusGeometry(2.96, 0.017, 16, 180);
    const hairlineMat = new THREE.MeshStandardMaterial({
      color: 0xa1a1aa,
      metalness: 0.92,
      roughness: 0.22,
      envMapIntensity: 1.25,
    });
    const ringMesh = new THREE.Mesh(ringGeo, hairlineMat);
    ringMesh.rotation.set(-0.62, 0.88, 0);
    sculptureGroup.add(ringMesh);
    disposables.push(ringGeo, hairlineMat);

    // Pure monochrome white & silver studio lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.36);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.55);
    keyLight.position.set(5, 6, 7);

    const rimLight = new THREE.DirectionalLight(0xf4f4f5, 2.0);
    rimLight.position.set(-6, -3, 4);

    const sweepLight = new THREE.PointLight(0xffffff, 3.2, 22, 1.25);
    sweepLight.position.set(2.5, 2.5, 4.8);

    scene.add(ambient, keyLight, rimLight, sweepLight);

    const resize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      activeRenderer.setSize(w, h, false);
      const aspect = w / Math.max(1, h);
      camera.aspect = aspect;
      if (aspect < 1) {
        camera.fov = 50;
        camera.position.z = 10.2;
      } else {
        camera.fov = 40;
        camera.position.z = 8.4;
      }
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    let scrollProg = reducedMotion ? 0.5 : 0;
    let isVisible = true;
    let targetPtrX = 0;
    let targetPtrY = 0;
    let curPtrX = 0;
    let curPtrY = 0;
    let ribbonPtrX = 0;
    let ribbonPtrY = 0;
    let ringPtrX = 0;
    let ringPtrY = 0;

    let targetEnergy = 0;
    let curEnergy = 0;
    let rippleAmp = 0;
    let sweepBoost = 0;
    let isPointerInsideCanvas = false;
    let lastClientX = window.innerWidth * 0.5;
    let lastClientY = window.innerHeight * 0.5;

    const raycaster = new THREE.Raycaster();
    const ndcVec = new THREE.Vector2();
    const hitPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const worldHit = new THREE.Vector3(0, 0, 1.5);
    const localHit = new THREE.Vector3(0, 0, 1.5);
    const targetPointerLocal = new THREE.Vector3(0, 0, 1.5);

    const updateInteractionPoint = (clientX: number, clientY: number, isImpulse: boolean) => {
      if (reducedMotion) return;
      const rect = canvas.getBoundingClientRect();
      const inside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;
      isPointerInsideCanvas = inside;

      const relX = (clientX - rect.left) / Math.max(1, rect.width) - 0.5;
      const relY = (clientY - rect.top) / Math.max(1, rect.height) - 0.5;
      targetPtrX = THREE.MathUtils.clamp(relX, -0.5, 0.5) * 1.36;
      targetPtrY = THREE.MathUtils.clamp(relY, -0.5, 0.5) * 0.84;

      if (!inside && !isImpulse) return;

      ndcVec.set(
        ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
        -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1
      );

      raycaster.setFromCamera(ndcVec, camera);
      const intersects = raycaster.intersectObject(knotMesh, false);
      if (intersects.length > 0) {
        worldHit.copy(intersects[0].point);
      } else {
        raycaster.ray.intersectPlane(hitPlane, worldHit);
      }

      knotMesh.updateWorldMatrix(true, false);
      localHit.copy(worldHit);
      knotMesh.worldToLocal(localHit);
      targetPointerLocal.copy(localHit);

      const speed = Math.hypot(clientX - lastClientX, clientY - lastClientY);
      lastClientX = clientX;
      lastClientY = clientY;

      targetEnergy = Math.min(1, Math.max(0.32, targetEnergy + Math.min(0.45, speed * 0.015)));

      if (isImpulse && inside) {
        rippleAmp = 1.0;
        targetEnergy = 1.0;
        sweepBoost = 1.0;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      updateInteractionPoint(e.clientX, e.clientY, false);
    };

    const onPointerDown = (e: PointerEvent) => {
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      updateInteractionPoint(e.clientX, e.clientY, true);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    let rafId: number | null = null;
    const renderLoop = (now: number) => {
      if (!isVisible) {
        rafId = null;
        return;
      }

      // Smooth viscous damping & staggered 3D parallax across layers
      curPtrX += (targetPtrX - curPtrX) * 0.075;
      curPtrY += (targetPtrY - curPtrY) * 0.075;
      ribbonPtrX += (curPtrX - ribbonPtrX) * 0.055;
      ribbonPtrY += (curPtrY - ribbonPtrY) * 0.055;
      ringPtrX += (curPtrX - ringPtrX) * 0.04;
      ringPtrY += (curPtrY - ringPtrY) * 0.04;

      liquidUniforms.uTime.value = now * 0.001;
      liquidUniforms.uPointerLocal.value.lerp(targetPointerLocal, 0.14);

      const floorEnergy = isPointerInsideCanvas ? 0.24 : 0;
      targetEnergy = Math.max(floorEnergy, targetEnergy * 0.92);
      curEnergy += (targetEnergy - curEnergy) * 0.11;
      rippleAmp *= 0.955;
      sweepBoost *= 0.93;

      liquidUniforms.uLiquidEnergy.value = curEnergy;
      liquidUniforms.uRippleAmp.value = rippleAmp;

      const t = now * 0.00034;
      const baseRotY = scrollProg * Math.PI * 0.9 + (reducedMotion ? 0 : t);
      const baseRotX = 0.2 + (scrollProg - 0.5) * 0.3;

      sculptureGroup.rotation.y = baseRotY + curPtrX;
      sculptureGroup.rotation.x = baseRotX - curPtrY;
      // Bounded vertical travel so enlarged 2.96-radius ring stays cleanly unclipped
      sculptureGroup.position.y = (0.5 - scrollProg) * 0.24;

      const scaleFactor = 0.95 + Math.sin(scrollProg * Math.PI) * 0.05;
      sculptureGroup.scale.setScalar(scaleFactor);

      ribbonMesh.rotation.z =
        0.28 + scrollProg * 0.9 + (reducedMotion ? 0 : t * 0.5) + (ribbonPtrX - curPtrX) * 0.8;
      ribbonMesh.rotation.x = 1.05 - (ribbonPtrY - curPtrY) * 0.7;

      ringMesh.rotation.y =
        0.88 - scrollProg * 0.7 - (reducedMotion ? 0 : t * 0.3) + (ringPtrX - curPtrX) * 1.1;
      ringMesh.rotation.x = -0.62 - (ringPtrY - curPtrY) * 0.9;

      sweepLight.position.x =
        Math.sin(t * 2.1) * 3.4 + curPtrX * 4.5 + worldHit.x * sweepBoost * 0.4;
      sweepLight.position.y =
        Math.cos(t * 1.6) * 2.2 - curPtrY * 3.2 + worldHit.y * sweepBoost * 0.4;
      sweepLight.intensity = 3.2 + curEnergy * 1.1 + sweepBoost * 2.4;

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
              activeRenderer.render(scene, camera);
            }
          }
        },
        { rootMargin: "150px" }
      );
      obs.observe(triggerEl);
    }

    let st: ScrollTrigger | null = null;
    if (!reducedMotion) {
      st = ScrollTrigger.create({
        trigger: triggerEl,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          scrollProg = self.progress;
        },
      });
      rafId = window.requestAnimationFrame(renderLoop);
    } else {
      liquidUniforms.uLiquidEnergy.value = 0;
      liquidUniforms.uRippleAmp.value = 0;
      activeRenderer.render(scene, camera);
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      st?.kill();
      obs?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      disposables.forEach((d) => d.dispose());
      activeRenderer.dispose();
    };
  }, [triggerRef, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="work-chrome-canvas"
      id="work-chrome-canvas"
      aria-hidden="true"
    />
  );
}

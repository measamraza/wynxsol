import { useEffect, useRef } from "react";
import * as THREE from "three";

interface LiquidChromeLoaderProps {
  onComplete: () => void;
}

const VERTEX_SHADER = `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Real-time 3D Signed Distance Field molten mercury -> official WS monogram shader.
// High-contrast achromatic obsidian, pewter, silver & platinum reflections on #050505.
const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uResolution;
uniform float uProgress;
uniform float uTime;
uniform float uSweep;
uniform float uExit;

// Transform SVG pixel coords (viewBox centered at 509, 272) into world space
vec2 svgPt(float sx, float sy) {
  return vec2((sx - 509.0) * 0.0056, -(sy - 272.0) * 0.0056);
}

void edgeStep(vec2 p, vec2 a, vec2 b, inout float d2, inout float s) {
  vec2 e = b - a;
  vec2 w = p - a;
  vec2 proj = w - e * clamp(dot(w, e) / max(dot(e, e), 1e-8), 0.0, 1.0);
  d2 = min(d2, dot(proj, proj));
  bvec3 cond = bvec3(p.y >= a.y, p.y < b.y, e.x * w.y > e.y * w.x);
  if (all(cond) || all(not(cond))) {
    s *= -1.0;
  }
}

// Piece 1: Left W diagonal wing (exact polygon from wynxsol-logo.svg)
float sdPiece1(vec2 p) {
  vec2 p0 = svgPt(272.0, 181.0);
  vec2 p1 = svgPt(333.0, 181.0);
  vec2 p2 = svgPt(425.0, 324.0);
  vec2 p3 = svgPt(496.0, 324.0);
  vec2 p4 = svgPt(509.0, 336.0);
  vec2 p5 = svgPt(486.0, 364.0);
  vec2 p6 = svgPt(388.0, 364.0);

  vec2 d = p - p0;
  float d2 = dot(d, d);
  float s = 1.0;
  edgeStep(p, p0, p1, d2, s);
  edgeStep(p, p1, p2, d2, s);
  edgeStep(p, p2, p3, d2, s);
  edgeStep(p, p3, p4, d2, s);
  edgeStep(p, p4, p5, d2, s);
  edgeStep(p, p5, p6, d2, s);
  edgeStep(p, p6, p0, d2, s);
  return s * sqrt(d2);
}

// Piece 2: Center W architectural caret (exact polygon from wynxsol-logo.svg)
float sdPiece2(vec2 p) {
  vec2 p0 = svgPt(416.0, 268.0);
  vec2 p1 = svgPt(464.0, 183.0);
  vec2 p2 = svgPt(494.0, 183.0);
  vec2 p3 = svgPt(575.0, 314.0);
  vec2 p4 = svgPt(545.0, 356.0);
  vec2 p5 = svgPt(479.0, 257.0);
  vec2 p6 = svgPt(443.0, 308.0);

  vec2 d = p - p0;
  float d2 = dot(d, d);
  float s = 1.0;
  edgeStep(p, p0, p1, d2, s);
  edgeStep(p, p1, p2, d2, s);
  edgeStep(p, p2, p3, d2, s);
  edgeStep(p, p3, p4, d2, s);
  edgeStep(p, p4, p5, d2, s);
  edgeStep(p, p5, p6, d2, s);
  edgeStep(p, p6, p0, d2, s);
  return s * sqrt(d2);
}

// Piece 3: Right geometric S monogram (exact polygon from wynxsol-logo.svg)
float sdPiece3(vec2 p) {
  vec2 p0  = svgPt(595.0, 182.0);
  vec2 p1  = svgPt(717.0, 182.0);
  vec2 p2  = svgPt(745.0, 217.0);
  vec2 p3  = svgPt(624.0, 217.0);
  vec2 p4  = svgPt(616.0, 226.0);
  vec2 p5  = svgPt(713.0, 313.0);
  vec2 p6  = svgPt(678.0, 364.0);
  vec2 p7  = svgPt(560.0, 364.0);
  vec2 p8  = svgPt(589.0, 324.0);
  vec2 p9  = svgPt(658.0, 324.0);
  vec2 p10 = svgPt(661.0, 315.0);
  vec2 p11 = svgPt(560.0, 223.0);

  vec2 d = p - p0;
  float d2 = dot(d, d);
  float s = 1.0;
  edgeStep(p, p0,  p1,  d2, s);
  edgeStep(p, p1,  p2,  d2, s);
  edgeStep(p, p2,  p3,  d2, s);
  edgeStep(p, p3,  p4,  d2, s);
  edgeStep(p, p4,  p5,  d2, s);
  edgeStep(p, p5,  p6,  d2, s);
  edgeStep(p, p6,  p7,  d2, s);
  edgeStep(p, p7,  p8,  d2, s);
  edgeStep(p, p8,  p9,  d2, s);
  edgeStep(p, p9,  p10, d2, s);
  edgeStep(p, p10, p11, d2, s);
  edgeStep(p, p11, p0,  d2, s);
  return s * sqrt(d2);
}

// Smooth rounded, cylindrical liquid-chrome extrusion of the exact WS silhouette
float sdWSLogo3D(vec3 p) {
  // Large outer bounding skip only far outside (no close-range discontinuity)
  vec3 bd = abs(p) - vec3(1.55, 0.72, 0.30);
  float dBox = length(max(bd, 0.0)) + min(max(bd.x, max(bd.y, bd.z)), 0.0);
  if (dBox > 1.25) return dBox;

  float d2d = min(sdPiece1(p.xy), min(sdPiece2(p.xy), sdPiece3(p.xy)));

  float halfThick = 0.148;
  float bevelR = 0.068;
  vec2 q = vec2(d2d + bevelR * 0.38, abs(p.z) - (halfThick - bevelR));
  float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - bevelR;

  // Sculpted cylindrical chrome meniscus dome across every stroke width
  // so reflections curve organically across dark-and-light studio bands
  float inner = clamp(-d2d / 0.145, 0.0, 1.0);
  float dome = 0.068 * sqrt(inner) * smoothstep(0.0, halfThick * 1.48, halfThick * 1.48 - abs(p.z));
  d -= dome;
  return d;
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / max(k, 0.0001), 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// Organic twisting molten stream targeting exact WS skeletal curves
float evalStream(
  vec3 p,
  float idx,
  vec3 tgtA,
  vec3 tgtB,
  float conv,
  float radius,
  float flowAmp,
  float t
) {
  float angleA = idx * 0.72 + t * 1.1;
  float angleB = angleA + 1.55;

  vec3 swirlA = vec3(
    sin(angleA) * 1.52 + cos(t * 0.75 + idx) * 0.32,
    cos(angleA * 0.85 + idx * 0.4) * 0.64,
    sin(angleA * 1.25 + idx) * 0.34
  ) * flowAmp;

  vec3 swirlB = vec3(
    sin(angleB) * 1.46 - cos(t * 0.85 - idx) * 0.30,
    cos(angleB * 0.9 + idx * 0.5) * 0.58,
    cos(angleB * 1.15 + idx) * 0.32
  ) * flowAmp;

  vec3 midFold = vec3(
    sin(t * 1.45 + idx * 1.7) * 0.12,
    cos(t * 1.25 + idx * 1.3) * 0.12,
    sin(t * 1.65 + idx) * 0.09
  ) * (1.0 - conv) * flowAmp;

  vec3 a = mix(swirlA + midFold, tgtA, conv);
  vec3 b = mix(swirlB - midFold, tgtB, conv);
  return sdCapsule(p, a, b, radius);
}

float mapScene(vec3 p) {
  float pr = clamp(uProgress, 0.0, 1.0);

  // Act 1 (0.00 -> 0.16): Liquid mercury pool emerges smoothly
  // Act 2 (0.16 -> 0.44): Flowing, twisting, folding liquid ribbons
  // Act 3 (0.44 -> 0.72): Organic convergence into WS geometry
  // Act 4 (0.72 -> 0.86): Waves settle, sculpted liquid-chrome WS locks
  // Act 5 (0.86 -> 1.00): Silver studio sweep glides across rounded finish
  float emerge = smoothstep(0.0, 0.16, pr);
  float flowAmp = smoothstep(0.08, 0.28, pr);
  float conv = smoothstep(0.36, 0.74, pr);
  float streamRetract = 1.0 - smoothstep(0.68, 0.83, pr);
  float logoAppear = smoothstep(0.40, 0.76, pr);
  float waveDamp = 1.0 - smoothstep(0.42, 0.80, pr);

  // Gentle low-frequency fluid undulation (Lipschitz-safe: zero tearing or facets)
  vec3 streamWave = vec3(
    sin(p.y * 2.1 + uTime * 1.35 + pr * 4.2) * 0.028,
    cos(p.x * 1.85 - uTime * 1.15 + pr * 3.8) * 0.024,
    sin(p.x * 2.3 + p.y * 1.7 + uTime * 1.25) * 0.02
  ) * (0.35 + 0.65 * flowAmp) * waveDamp;

  // Act 1: Central mercury droplet pool
  float poolFade = 1.0 - smoothstep(0.40, 0.64, pr);
  float dPool = 10.0;
  if (poolFade > 0.001) {
    float rPool = mix(0.01, 0.34, emerge) * poolFade;
    vec3 poolP = p + streamWave;
    poolP.y *= 1.16 - 0.12 * sin(uTime * 1.1);
    dPool = length(poolP) - rPool;
  }

  // Act 2 -> 3: 9 flowing liquid mercury ribbons
  float dStreams = dPool;
  if (flowAmp > 0.001 && streamRetract > 0.001) {
    float baseR = mix(0.102, 0.072, conv) * streamRetract * mix(0.35, 1.0, flowAmp);
    float mergeK = mix(0.34, 0.18, conv);
    float tFlow = uTime * 0.92 + pr * 3.0;

    vec3 wp = p + streamWave;
    float s0 = evalStream(wp, 0.0, vec3(svgPt(298.0, 194.0), 0.0), vec3(svgPt(404.0, 344.0), 0.0), conv, baseR, flowAmp, tFlow);
    float s1 = evalStream(wp, 1.0, vec3(svgPt(404.0, 344.0), 0.0), vec3(svgPt(492.0, 344.0), 0.0), conv, baseR, flowAmp, tFlow);
    float s2 = evalStream(wp, 2.0, vec3(svgPt(436.0, 282.0), 0.0), vec3(svgPt(478.0, 198.0), 0.0), conv, baseR, flowAmp, tFlow);
    float s3 = evalStream(wp, 3.0, vec3(svgPt(478.0, 198.0), 0.0), vec3(svgPt(554.0, 330.0), 0.0), conv, baseR, flowAmp, tFlow);
    float s4 = evalStream(wp, 4.0, vec3(svgPt(596.0, 200.0), 0.0), vec3(svgPt(724.0, 200.0), 0.0), conv, baseR, flowAmp, tFlow);
    float s5 = evalStream(wp, 5.0, vec3(svgPt(585.0, 212.0), 0.0), vec3(svgPt(635.0, 255.0), 0.0), conv, baseR, flowAmp, tFlow);
    float s6 = evalStream(wp, 6.0, vec3(svgPt(620.0, 245.0), 0.0), vec3(svgPt(685.0, 308.0), 0.0), conv, baseR, flowAmp, tFlow);
    float s7 = evalStream(wp, 7.0, vec3(svgPt(685.0, 308.0), 0.0), vec3(svgPt(668.0, 346.0), 0.0), conv, baseR, flowAmp, tFlow);
    float s8 = evalStream(wp, 8.0, vec3(svgPt(582.0, 344.0), 0.0), vec3(svgPt(668.0, 344.0), 0.0), conv, baseR, flowAmp, tFlow);

    dStreams = smin(dStreams, s0, mergeK);
    dStreams = smin(dStreams, s1, mergeK);
    dStreams = smin(dStreams, s2, mergeK);
    dStreams = smin(dStreams, s3, mergeK);
    dStreams = smin(dStreams, s4, mergeK);
    dStreams = smin(dStreams, s5, mergeK);
    dStreams = smin(dStreams, s6, mergeK);
    dStreams = smin(dStreams, s7, mergeK);
    dStreams = smin(dStreams, s8, mergeK);
  }

  if (logoAppear <= 0.001) {
    return dStreams;
  }

  // Smooth viscous blend of WS silhouette into streams without warping sharp corners
  vec3 logoP = p + streamWave * (0.45 * (1.0 - logoAppear));
  float dLogo = sdWSLogo3D(logoP) + (1.0 - logoAppear) * 0.14;

  if (streamRetract <= 0.002) {
    return dLogo;
  }

  float morphK = mix(0.36, 0.035, smoothstep(0.46, 0.84, pr));
  return smin(dStreams, dLogo, morphK);
}

vec3 calcNormal(vec3 p) {
  const float e = 0.002;
  vec2 h = vec2(e, -e);
  return normalize(
    h.xyy * mapScene(p + h.xyy) +
    h.yyx * mapScene(p + h.yyx) +
    h.yxy * mapScene(p + h.yxy) +
    h.xxx * mapScene(p + h.xxx)
  );
}

float calcAO(vec3 p, vec3 n) {
  float ao = 0.0;
  float weight = 0.5;
  for (int i = 1; i <= 2; i++) {
    float dist = 0.04 * float(i);
    float d = mapScene(p + n * dist);
    ao += weight * max(0.0, dist - d);
    weight *= 0.5;
  }
  return clamp(1.0 - 2.0 * ao, 0.25, 1.0);
}

// High-contrast dark-studio automotive reflection tent (zero RGB tint, deep obsidian blacks & gleaming silver)
float sampleStudioEnv(vec3 R, vec3 worldPos) {
  // Deep obsidian negative-fill room base
  float lum = 0.014;

  // Crisp primary diagonal softbox blade with negative-fill contrast trough
  float c1 = R.x * 0.62 + R.y * 0.78;
  float strip1 = exp(-pow((c1 - 0.34) * 6.8, 2.0)) * smoothstep(-0.25, 0.55, R.z);
  lum += strip1 * 1.45;

  // Complementary diagonal platinum reflection band
  float c2 = -R.x * 0.56 + R.y * 0.82;
  float strip2 = exp(-pow((c2 + 0.32) * 7.2, 2.0)) * smoothstep(-0.35, 0.55, R.z);
  lum += strip2 * 1.05;

  // High-contrast studio shadow band across frontal incidence for real mirror contrast
  float darkBand = exp(-pow((c1 + 0.14) * 5.0, 2.0));
  lum *= mix(1.0, 0.22, darkBand);

  // Clean zenith overhead studio reflection strip
  float zenith = exp(-pow((R.y - 0.68) * 6.5, 2.0)) * smoothstep(0.92, 0.12, abs(R.x));
  lum += zenith * 1.18;

  // Lower subtle silver floor bounce rim separating dark shoulders from #050505
  float floorRim = exp(-pow((R.y + 0.52) * 4.5, 2.0)) * 0.26;
  lum += floorRim;

  // Soft travelling Act 5 silver studio sweep light across the cylindrical finish
  float sweepEnvelope = smoothstep(0.76, 0.92, uProgress);
  if (sweepEnvelope > 0.001) {
    float diag = worldPos.x * 0.90 + worldPos.y * 0.38;
    float bar = exp(-pow((diag - uSweep) * 3.3, 2.0));
    lum += bar * sweepEnvelope * 1.25 * smoothstep(-0.15, 0.65, R.z);
  }

  return lum;
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float normDim = aspect < 1.25 ? (uResolution.x / 1.25) : uResolution.y;
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / max(normDim, 1.0);

  // Fixed frontal perspective with subtle luxury push-in
  float pr = clamp(uProgress, 0.0, 1.0);
  float pushIn = smoothstep(0.0, 0.92, pr);
  float camZ = mix(6.15, 4.88, pushIn) - uExit * 0.62;
  vec3 ro = vec3(0.0, 0.0, camZ);
  vec3 rd = normalize(vec3(uv, -1.85));

  // Conservative sphere tracing (0.58 step) for zero surface tearing during convergence
  float t = 0.0;
  float maxT = 10.5;
  bool hit = false;
  for (int i = 0; i < 96; i++) {
    vec3 p = ro + rd * t;
    float d = mapScene(p);
    if (d < 0.0012) {
      hit = true;
      break;
    }
    t += max(d * 0.58, 0.0028);
    if (t > maxT) break;
  }

  float bgLum = 0.0196;

  if (!hit) {
    gl_FragColor = vec4(vec3(bgLum), 1.0);
    return;
  }

  vec3 pos = ro + rd * t;
  vec3 N = calcNormal(pos);
  vec3 V = -rd;
  vec3 R = reflect(-V, N);

  float ao = calcAO(pos, N);
  float fresnel = mix(0.84, 1.0, pow(1.0 - max(dot(N, V), 0.0), 4.0));
  float envLum = sampleStudioEnv(R, pos);

  // High-angle crisp specular glint + silver edge Fresnel rim against pure black
  vec3 keyDir = normalize(vec3(0.55, 0.80, 0.28));
  vec3 halfVec = normalize(keyDir + V);
  float keySpec = pow(max(dot(N, halfVec), 0.0), 84.0) * 0.85;
  float rimSheen = pow(1.0 - max(dot(N, V), 0.0), 3.6) * 0.62;

  float linearLum = (envLum * fresnel + keySpec + rimSheen) * ao;
  linearLum *= (1.0 - uExit);

  // ACES Filmic scalar tone mapping + sRGB gamma conversion (strictly grayscale)
  float mapped = clamp(
    (linearLum * (2.51 * linearLum + 0.03)) /
      (linearLum * (2.43 * linearLum + 0.59) + 0.14),
    0.0,
    1.0
  );
  float srgb = pow(mapped, 1.0 / 2.2);

  float alphaIntro = smoothstep(0.0, 0.04, pr) * (1.0 - uExit);
  float finalLum = mix(bgLum, max(bgLum, srgb), alphaIntro);

  gl_FragColor = vec4(vec3(finalLum), 1.0);
}
`;

export function LiquidChromeLoader({ onComplete }: LiquidChromeLoaderProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const params = new URLSearchParams(window.location.search);
    const loaderParam = params.get("loaderT");
    const fixedT = loaderParam !== null ? parseFloat(loaderParam) : NaN;
    const hasFixedT = !Number.isNaN(fixedT) && Number.isFinite(fixedT);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      });
      const maxDpr = window.innerWidth <= 768 ? 1.25 : 1.5;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    } catch {
      renderer = null;
    }

    if (!renderer) {
      onCompleteRef.current();
      return;
    }

    const activeRenderer = renderer;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uProgress: { value: hasFixedT ? Math.max(0, Math.min(1, fixedT)) : 0 },
      uTime: { value: 0 },
      uSweep: { value: -1.7 },
      uExit: { value: 0 },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      depthTest: false,
      depthWrite: false,
    });

    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    const resize = () => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      activeRenderer.setSize(w, h, false);
      activeRenderer.getDrawingBufferSize(uniforms.uResolution.value);
      if (hasFixedT) {
        activeRenderer.render(scene, camera);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let rafId: number | null = null;
    let dismissed = false;

    const finish = () => {
      if (dismissed) return;
      dismissed = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      onCompleteRef.current();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !hasFixedT) {
        finish();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // Deterministic static frame mode for QA screenshots (?loaderT=0..1)
    if (hasFixedT) {
      const clampedT = Math.max(0, Math.min(1, fixedT));
      uniforms.uProgress.value = clampedT;
      uniforms.uTime.value = clampedT * 5.2;
      const sweepNorm = Math.max(0, Math.min(1, (clampedT - 0.84) / 0.16));
      uniforms.uSweep.value = -1.7 + sweepNorm * 3.4;
      uniforms.uExit.value = 0;
      activeRenderer.render(scene, camera);

      return () => {
        window.removeEventListener("resize", resize);
        window.removeEventListener("keydown", onKeyDown);
        geometry.dispose();
        material.dispose();
        activeRenderer.dispose();
      };
    }

    // Main timed playback: 5.2s choreography -> 0.65s centered hold -> 0.85s dissolve
    const MAIN_MS = 5200;
    const HOLD_MS = 650;
    const EXIT_MS = 850;
    const TOTAL_MS = MAIN_MS + HOLD_MS + EXIT_MS;
    const startMs = performance.now();

    const tick = (now: number) => {
      if (dismissed) return;
      const elapsed = now - startMs;

      const prog = Math.min(1, elapsed / MAIN_MS);
      uniforms.uProgress.value = prog;
      uniforms.uTime.value = elapsed * 0.001;

      const sweepNorm = Math.max(
        0,
        Math.min(1, (elapsed - MAIN_MS * 0.82) / (MAIN_MS * 0.22 + HOLD_MS * 0.45))
      );
      uniforms.uSweep.value = -1.7 + sweepNorm * 3.4;

      if (elapsed > MAIN_MS + HOLD_MS) {
        const exitNorm = Math.min(1, (elapsed - (MAIN_MS + HOLD_MS)) / EXIT_MS);
        const easedExit = exitNorm * exitNorm * (3 - 2 * exitNorm);
        uniforms.uExit.value = easedExit;

        if (elapsed > MAIN_MS + HOLD_MS + 400) {
          const cssFade = Math.min(1, (elapsed - (MAIN_MS + HOLD_MS + 400)) / 450);
          wrap.style.opacity = String(Math.max(0, 1 - cssFade));
        }
      }

      activeRenderer.render(scene, camera);

      if (elapsed >= TOTAL_MS) {
        finish();
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      geometry.dispose();
      material.dispose();
      activeRenderer.dispose();
    };
  }, []);

  return (
    <div className="liquid-loader" id="wynx-liquid-loader" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} className="liquid-loader__canvas" />
    </div>
  );
}

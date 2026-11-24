import * as THREE from "three";

export interface StudioChromeEnv {
  envMap: THREE.Texture;
  dispose: () => void;
}

/**
 * Generates a high-contrast pure black-and-white studio reflection cubemap
 * calibrated for realistic liquid chrome, brushed aluminum, and obsidian shadows
 * with zero color cast.
 */
export function createStudioChromeEnv(renderer: THREE.WebGLRenderer): StudioChromeEnv {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Deep pitch-black and neutral charcoal studio enclosure
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0.0, "#18181A");
    bg.addColorStop(0.28, "#080809");
    bg.addColorStop(0.5, "#000000");
    bg.addColorStop(0.78, "#0C0C0E");
    bg.addColorStop(1.0, "#030304");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Primary overhead crisp white softbox bank
    const topSoftbox = ctx.createLinearGradient(0, 32, 0, 124);
    topSoftbox.addColorStop(0.0, "rgba(255,255,255,0)");
    topSoftbox.addColorStop(0.32, "rgba(255,255,255,0.98)");
    topSoftbox.addColorStop(0.68, "rgba(232,234,238,0.96)");
    topSoftbox.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = topSoftbox;
    ctx.fillRect(60, 32, 904, 92);

    // Secondary sharp specular light blades for liquid-chrome contrast
    ctx.save();
    ctx.translate(width * 0.28, height * 0.44);
    ctx.rotate(-0.34);
    const blade1 = ctx.createLinearGradient(-240, -28, 240, 28);
    blade1.addColorStop(0, "rgba(255,255,255,0)");
    blade1.addColorStop(0.5, "rgba(255,255,255,0.95)");
    blade1.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = blade1;
    ctx.fillRect(-260, -22, 520, 44);
    ctx.restore();

    ctx.save();
    ctx.translate(width * 0.74, height * 0.42);
    ctx.rotate(0.28);
    const blade2 = ctx.createLinearGradient(-180, -20, 180, 20);
    blade2.addColorStop(0, "rgba(255,255,255,0)");
    blade2.addColorStop(0.5, "rgba(228,228,231,0.86)");
    blade2.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = blade2;
    ctx.fillRect(-200, -18, 400, 36);
    ctx.restore();

    // Neutral silver horizon bounce band
    const horizon = ctx.createLinearGradient(0, 240, 0, 286);
    horizon.addColorStop(0, "rgba(244,244,245,0)");
    horizon.addColorStop(0.5, "rgba(244,244,245,0.78)");
    horizon.addColorStop(1, "rgba(244,244,245,0)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, 240, width, 46);

    // Lower soft silver floor rim reflection
    const floorRim = ctx.createLinearGradient(0, 355, 0, 415);
    floorRim.addColorStop(0, "rgba(212,212,216,0)");
    floorRim.addColorStop(0.5, "rgba(212,212,216,0.42)");
    floorRim.addColorStop(1, "rgba(212,212,216,0)");
    ctx.fillStyle = floorRim;
    ctx.fillRect(80, 355, 864, 60);
  }

  const equirectTex = new THREE.CanvasTexture(canvas);
  equirectTex.mapping = THREE.EquirectangularReflectionMapping;
  equirectTex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const renderTarget = pmrem.fromEquirectangular(equirectTex);

  equirectTex.dispose();
  pmrem.dispose();

  return {
    envMap: renderTarget.texture,
    dispose: () => {
      renderTarget.dispose();
    },
  };
}

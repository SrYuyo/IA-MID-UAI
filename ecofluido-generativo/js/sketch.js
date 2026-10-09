/**
 * ============================================================================
 * EcoFluido Generativo: Orquestador Principal (p5.js)
 * ============================================================================
 * Conecta:
 * 1. BodyTracker (ml5.js bodyPose / MoveNet)
 * 2. FluidField (Grilla de vectores Navier-Stokes / Perlin advectivo)
 * 3. ParticleSystem (Estelas reactivas y modulación de color)
 * 4. Interfaz de Instalación (HUD, pantalla completa y proyección ambiental)
 */

let tracker;
let fluid;
let particles;

// Parámetros de simulación ajustables desde la interfaz
let config = {
  particleCount: 3500,
  forceMultiplier: 1.8,
  fadeAlpha: 18,        // Opacidad del difuminado para estelas (0-255)
  vorticityFactor: 1.2, // Turbulencia en pasos rápidos
  showDebug: false,
  isHudVisible: true
};

// Referencias al DOM
let dom = {};

function setup() {
  const container = document.getElementById("canvas-container");
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(container);

  // Inicializar modo de color base
  colorMode(RGB, 255);
  background(5, 7, 15);

  // Instanciar módulos
  fluid = new FluidField(26);
  fluid.init(width, height);

  particles = new ParticleSystem(config.particleCount);
  particles.init(width, height);

  tracker = new BodyTracker();
  tracker.init(() => {
    updateStateUI(true, 0);
  });

  // Vincular controles de la interfaz de usuario
  initUI();
}

function draw() {
  // 1. Actualizar módulo de visión computacional
  const trackingData = tracker.update(width, height);
  const isIdle = trackingData.isIdle;
  const persons = trackingData.persons;
  const intensity = trackingData.intensity;

  // 2. Modos de Operación e Inyección de Fuerzas
  if (!isIdle && persons.length > 0) {
    for (let p of persons) {
      // Diferenciación de paso según el diagrama:
      const isFast = p.intensity >= 0.4 || p.speed > 5.5;

      if (isFast) {
        // PASO RÁPIDO / DINÁMICO:
        // Inyectar fuerza alta y turbulencia con amplia dispersión
        const force = config.forceMultiplier * 2.2;
        const radius = 170;
        const vorticity = config.vorticityFactor * 1.5;

        fluid.injectForce(p.x, p.y, p.vx, p.vy, radius, force, vorticity);
        // Excitación de partículas en el punto de contacto
        particles.respawnAround(p.x, p.y, 8, 45);
      } else {
        // PASO LENTO / CALMO:
        // Inyectar fuerza baja: Ondulación suave y tonos fríos
        const force = config.forceMultiplier * 0.9;
        const radius = 110;
        const vorticity = 0.15;

        fluid.injectForce(p.x, p.y, p.vx, p.vy, radius, force, vorticity);
      }
    }
  }

  // 3. Actualizar Campo Vectorial y Partículas
  fluid.update(intensity, isIdle);

  // 4. Salida Visual: Difuminado Alpha (Fade) para estelas etéreas
  push();
  blendMode(BLEND);
  noStroke();
  // El fondo se dibuja con transparencia para preservar el rastro del fluido
  fill(5, 7, 15, config.fadeAlpha);
  rect(0, 0, width, height);
  pop();

  // Actualizar y dibujar partículas fluidas con resplandor aditivo
  particles.update(fluid, isIdle, intensity);
  particles.draw(isIdle, intensity);

  // 5. Actualizar Telemetría del HUD
  updateTelemetry(trackingData);

  // 6. Monitor de Depuración si está activo
  if (config.showDebug) {
    tracker.renderDebug(document.getElementById("debug-video-container"));
    updateDebugInfo(trackingData);
  }
}

/**
 * Ajusta dinámicamente el lienzo ante cambios de resolución de pantalla o proyector
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  fluid.init(width, height);
  particles.init(width, height);
  background(5, 7, 15);
}

/**
 * Inicializa y asocia los elementos del panel interactivo
 */
function initUI() {
  dom.hud = document.getElementById("hud-panel");
  dom.restoreBtn = document.getElementById("hud-restore-btn");
  dom.debugOverlay = document.getElementById("debug-overlay");
  dom.statePill = document.getElementById("state-pill");
  dom.statusText = document.getElementById("status-text");

  dom.metricPersons = document.getElementById("metric-persons");
  dom.metricSpeed = document.getElementById("metric-speed");
  dom.metricIntensity = document.getElementById("metric-intensity");
  dom.metricParticles = document.getElementById("metric-particles");
  dom.metricFps = document.getElementById("metric-fps");

  // Select de modo de entrada
  const inputMode = document.getElementById("input-mode");
  inputMode.addEventListener("change", (e) => {
    tracker.mode = e.target.value;
  });

  // Sliders
  const slParticles = document.getElementById("slider-particles");
  const valParticles = document.getElementById("val-particles");
  slParticles.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    valParticles.textContent = val.toLocaleString();
    config.particleCount = val;
    particles.setCount(val);
  });

  const slForce = document.getElementById("slider-force");
  const valForce = document.getElementById("val-force");
  slForce.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    valForce.textContent = val.toFixed(1);
    config.forceMultiplier = val;
  });

  const slFade = document.getElementById("slider-fade");
  const valFade = document.getElementById("val-fade");
  slFade.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    valFade.textContent = val;
    config.fadeAlpha = val;
  });

  const slVorticity = document.getElementById("slider-vorticity");
  const valVorticity = document.getElementById("val-vorticity");
  slVorticity.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    valVorticity.textContent = val.toFixed(1);
    config.vorticityFactor = val;
  });

  // Botones de acción
  document.getElementById("btn-fullscreen").addEventListener("click", toggleFullscreen);
  document.getElementById("btn-debug").addEventListener("click", toggleDebug);
  document.getElementById("btn-clear").addEventListener("click", () => {
    fluid.clear();
    background(5, 7, 15);
  });

  dom.restoreBtn.addEventListener("click", toggleHUD);
}

/**
 * Atajos de Teclado para Instalaciones y Proyecciones en Muros
 */
function keyPressed() {
  if (key === 'f' || key === 'F') {
    toggleFullscreen();
  } else if (key === 'h' || key === 'H') {
    toggleHUD();
  } else if (key === 'd' || key === 'D') {
    toggleDebug();
  } else if (key === 'c' || key === 'C') {
    fluid.clear();
    background(5, 7, 15);
  } else if (key === 's' || key === 'S') {
    // Alternar ciclo de modos de entrada
    const modes = ['webcam', 'sim_mouse', 'sim_auto'];
    const curIdx = modes.indexOf(tracker.mode);
    const nextMode = modes[(curIdx + 1) % modes.length];
    tracker.mode = nextMode;
    const select = document.getElementById("input-mode");
    if (select) select.value = nextMode;
  }
}

function toggleFullscreen() {
  const fs = fullscreen();
  fullscreen(!fs);
}

function toggleHUD() {
  config.isHudVisible = !config.isHudVisible;
  if (config.isHudVisible) {
    dom.hud.classList.remove("hidden");
    dom.restoreBtn.classList.add("hidden");
  } else {
    dom.hud.classList.add("hidden");
    dom.restoreBtn.classList.remove("hidden");
  }
}

function toggleDebug() {
  config.showDebug = !config.showDebug;
  const btn = document.getElementById("btn-debug");
  if (config.showDebug) {
    dom.debugOverlay.classList.remove("hidden");
    btn.classList.add("active");
  } else {
    dom.debugOverlay.classList.add("hidden");
    btn.classList.remove("active");
  }
}

/**
 * Actualiza la información en pantalla y el estado semántico según el diagrama
 */
function updateTelemetry(data) {
  if (frameCount % 6 !== 0) return; // Limitar refresco DOM para optimizar CPU

  updateStateUI(data.isIdle, data.intensity);

  dom.metricPersons.textContent = data.persons.length;
  dom.metricParticles.textContent = particles.particles.length.toLocaleString();
  dom.metricFps.innerHTML = `${Math.round(frameRate())} <small>FPS</small>`;

  if (data.persons.length > 0) {
    let maxSpeed = 0;
    for (let p of data.persons) {
      if (p.speed > maxSpeed) maxSpeed = p.speed;
    }
    dom.metricSpeed.innerHTML = `${maxSpeed.toFixed(1)} <small>px/f</small>`;
    dom.metricIntensity.textContent = `${Math.round(data.intensity * 100)}%`;
  } else {
    dom.metricSpeed.innerHTML = `0.0 <small>px/f</small>`;
    dom.metricIntensity.textContent = `0%`;
  }
}

function updateStateUI(isIdle, intensity) {
  dom.statePill.classList.remove("state-idle", "state-calm", "state-dynamic");

  if (isIdle) {
    dom.statePill.classList.add("state-idle");
    dom.statusText.textContent = "Modo Reposo: Flujo Calmo";
  } else {
    if (intensity < 0.4) {
      dom.statePill.classList.add("state-calm");
      dom.statusText.textContent = "Paso Lento: Ondulación Fría";
    } else {
      dom.statePill.classList.add("state-dynamic");
      dom.statusText.textContent = "Paso Rápido: Turbulencia Viva";
    }
  }
}

function updateDebugInfo(data) {
  const kpInfo = document.getElementById("debug-keypoints-info");
  const comInfo = document.getElementById("debug-com-info");
  const velInfo = document.getElementById("debug-vel-info");

  if (data.persons.length > 0) {
    const p = data.persons[0];
    kpInfo.textContent = `Cuerpos activos: ${data.persons.length}`;
    comInfo.textContent = `CoM: [${Math.round(p.x)}, ${Math.round(p.y)}]`;
    velInfo.textContent = `Velocidad: (${p.vx.toFixed(1)}, ${p.vy.toFixed(1)}) | ${p.speed.toFixed(1)} px/f`;
  } else {
    kpInfo.textContent = "Sin detección de cuerpo";
    comInfo.textContent = "Centro de masa: En espera";
    velInfo.textContent = "Vector: (0, 0)";
  }
}

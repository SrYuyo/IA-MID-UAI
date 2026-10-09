/**
 * ============================================================================
 * InvadersSketch: Orquestador Principal de Space Invaders (1978) en p5.js
 * ============================================================================
 * Sincroniza la entrada gestual de la mano, audio arcade y física de invasores.
 */

let audio;
let game;
let tracker;
let showVision = false;

// Variables de teclado acumuladas
let keyP1_X = 300;
let keyP2_X = 500;
let keyP1_Shoot = false;
let keyP2_Shoot = false;

function setup() {
  const container = document.getElementById("canvas-container");
  const w = container.clientWidth || 800;
  const h = container.clientHeight || 600;

  const canvas = createCanvas(w, h);
  canvas.parent(container);

  audio = new InvadersAudio();
  game = new InvadersGame(audio);
  game.resize(w, h);

  tracker = new InvadersTracker();
  tracker.init(() => {
    console.log("MoveNet listo para Space Invaders.");
  });

  initUIEvents();
}

function draw() {
  // 1. Actualizar tracking de visión
  tracker.update();

  const is2P = (tracker.gameMode === '2p_coop');

  // 2. Determinar posición y disparo del Jugador 1
  let p1TargetX = null;
  let p1Shoot = tracker.p1Shoot || keyP1_Shoot;

  if (tracker.controlMode === 'hand' || tracker.controlMode === 'torso') {
    p1TargetX = tracker.p1NormX * (game.w - game.cannonW);

    // Ajuste fino por teclado opcional
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) keyP1_X -= 6;
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) keyP1_X += 6;
  } else {
    // Teclado puro P1
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) keyP1_X -= 6;
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) keyP1_X += 6;
    keyP1_X = Math.max(20, Math.min(game.w - 20 - game.cannonW, keyP1_X));
    p1TargetX = keyP1_X;
  }

  // 3. Determinar posición y disparo del Jugador 2 (si está activo)
  let p2TargetX = null;
  let p2Shoot = tracker.p2Shoot || keyP2_Shoot;

  if (is2P) {
    if ((tracker.controlMode === 'hand' || tracker.controlMode === 'torso') && tracker.rawPoses.length >= 2) {
      p2TargetX = tracker.p2NormX * (game.w - game.cannonW);
    } else {
      // Teclado P2 (J/L y K)
      if (keyIsDown(74)) keyP2_X -= 6; // J
      if (keyIsDown(76)) keyP2_X += 6; // L
      keyP2_X = Math.max(20, Math.min(game.w - 20 - game.cannonW, keyP2_X));
      p2TargetX = keyP2_X;
    }
  }

  // Resetear disparos de teclado de un solo disparo
  keyP1_Shoot = false;
  keyP2_Shoot = false;

  // 4. Actualizar estado y física de Space Invaders
  game.update(p1TargetX, p1Shoot, p2TargetX, p2Shoot, is2P);

  // 5. Renderizado en el canvas
  game.draw(is2P);

  // 6. Monitor de visión si está abierto
  if (showVision) {
    tracker.renderDebug(document.getElementById("vision-video-wrapper"));
  }
}

function windowResized() {
  const container = document.getElementById("canvas-container");
  if (container) {
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    resizeCanvas(w, h);
    game.resize(w, h);
  }
}

function keyPressed() {
  if (key === ' ' || key === 'w' || key === 'W' || keyCode === UP_ARROW) {
    keyP1_Shoot = true;
  } else if (key === 'k' || key === 'K') {
    keyP2_Shoot = true;
  } else if (key === 'r' || key === 'R') {
    game.wave = 1;
    game.score1 = 0;
    game.score2 = 0;
    game.lives1 = 3;
    game.lives2 = 3;
    game.state = 'PLAY';
    game.initWave();
  } else if (key === 'v' || key === 'V') {
    toggleVision();
  } else if (key === 'm' || key === 'M') {
    toggleMute();
  } else if (key === 'f' || key === 'F') {
    toggleFullscreen();
  }
}

function toggleVision() {
  showVision = !showVision;
  const popup = document.getElementById("vision-monitor");
  const btn = document.getElementById("btn-camera");
  if (showVision) {
    popup.classList.remove("hidden");
    btn.classList.add("active");
  } else {
    popup.classList.add("hidden");
    btn.classList.remove("active");
  }
}

function toggleMute() {
  const isMuted = audio.toggleMute();
  const btn = document.getElementById("btn-sound");
  btn.textContent = isMuted ? "🔇 Silenciado" : "🔊 Audio [M]";
}

function toggleFullscreen() {
  const elem = document.documentElement;
  if (!document.fullscreenElement) {
    elem.requestFullscreen().catch(err => console.log(err));
  } else {
    document.exitFullscreen().catch(err => console.log(err));
  }
}

function initUIEvents() {
  document.getElementById("select-mode").addEventListener("change", (e) => {
    tracker.gameMode = e.target.value;
  });

  document.getElementById("select-tracking").addEventListener("change", (e) => {
    tracker.controlMode = e.target.value;
  });

  document.getElementById("select-difficulty").addEventListener("change", (e) => {
    if (e.target.value === 'fast') {
      game.marchInterval = 28;
    } else if (e.target.value === 'insane') {
      game.marchInterval = 14;
    } else {
      game.marchInterval = 44;
    }
  });

  document.getElementById("btn-camera").addEventListener("click", toggleVision);
  document.getElementById("btn-sound").addEventListener("click", toggleMute);
  document.getElementById("btn-fullscreen").addEventListener("click", toggleFullscreen);
  document.getElementById("btn-reset").addEventListener("click", () => {
    game.wave = 1;
    game.score1 = 0;
    game.score2 = 0;
    game.lives1 = 3;
    game.lives2 = 3;
    game.state = 'PLAY';
    game.initWave();
  });
}

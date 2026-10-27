/**
 * ============================================================================
 * PongSketch: Orquestador Principal de Atari PONG (1972) en p5.js
 * ============================================================================
 * Conecta los módulos de audio, física, IA de CPU, visión MoveNet e interfaz.
 */

let audio;
let game;
let ai;
let tracker;
let showVision = false;

// Posiciones acumuladas para entrada por teclado
let keyP1_Y = 200;
let keyP2_Y = 200;

function setup() {
  const container = document.getElementById("canvas-container");
  const w = container.clientWidth || 800;
  const h = container.clientHeight || 560;

  const canvas = createCanvas(w, h);
  canvas.parent(container);

  audio = new PongAudio();
  game = new PongGame(audio);
  game.resize(w, h);

  ai = new PongAI('arcade');
  tracker = new PongTracker();

  tracker.init(() => {
    console.log("MoveNet listo para PONG.");
  });

  initUIEvents();
  game.resetMatch();
}

function draw() {
  // 1. Actualizar tracking MoveNet
  tracker.update();

  // 2. Determinar posición objetivo para Pala 1 (Izquierda)
  // Mientras se presiona W/S el teclado tiene prioridad; así el juego sigue
  // siendo jugable aunque la cámara no esté disponible o no detecte a nadie.
  const p1KeyActive = keyIsDown(87) || keyIsDown(83); // W / S
  let p1TargetY;

  if (tracker.controlMode !== 'keyboard' && !p1KeyActive) {
    // Control por Visión (cabeza o brazos)
    p1TargetY = tracker.p1NormY * (game.h - game.paddleH);
    keyP1_Y = game.p1Y; // Mantener sincronizado para que el teclado no "salte"
  } else {
    if (keyIsDown(87)) keyP1_Y -= 7; // W
    if (keyIsDown(83)) keyP1_Y += 7; // S
    keyP1_Y = constrain(keyP1_Y, 0, game.h - game.paddleH);
    p1TargetY = keyP1_Y;
  }

  // 3. Determinar posición objetivo para Pala 2 (Derecha)
  let p2TargetY = game.p2Y;

  if (tracker.gameMode === '1p_ai') {
    // Modo 1 Jugador: IA de la CPU
    p2TargetY = ai.computePaddleY(game);
  } else {
    // Modo 2 Jugadores Local
    if (tracker.controlMode !== 'keyboard' && tracker.rawPoses.length >= 2) {
      p2TargetY = tracker.p2NormY * (game.h - game.paddleH);
    } else {
      // Teclado P2 (Flechas arriba/abajo o I/K)
      if (keyIsDown(UP_ARROW) || keyIsDown(73)) keyP2_Y -= 7;
      if (keyIsDown(DOWN_ARROW) || keyIsDown(75)) keyP2_Y += 7;
      keyP2_Y = constrain(keyP2_Y, 0, game.h - game.paddleH);
      p2TargetY = keyP2_Y;
    }
  }

  // 4. Actualizar física y reglas del juego
  game.update(p1TargetY, p2TargetY);

  // 5. Renderizado en pantalla CRT
  game.draw();

  // 6. Monitor de visión si está visible
  if (showVision) {
    tracker.renderDebug(document.getElementById("vision-video-wrapper"));
  }
}

function windowResized() {
  const container = document.getElementById("canvas-container");
  if (container) {
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 560;
    resizeCanvas(w, h);
    game.resize(w, h);
  }
}

function keyPressed() {
  if (key === ' ' && game.state === 'SERVE') {
    game.launchBall();
  } else if (key === ' ' && game.state === 'GAME_OVER') {
    // El cartel de fin de partida ofrece [R] o [ESPACIO] para reiniciar
    game.resetMatch();
  } else if (key === 'r' || key === 'R') {
    game.resetMatch();
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
    ai.setDifficulty(e.target.value);
  });

  document.getElementById("btn-camera").addEventListener("click", toggleVision);
  document.getElementById("btn-sound").addEventListener("click", toggleMute);
  document.getElementById("btn-fullscreen").addEventListener("click", toggleFullscreen);
  document.getElementById("btn-reset").addEventListener("click", () => {
    game.resetMatch();
  });
}

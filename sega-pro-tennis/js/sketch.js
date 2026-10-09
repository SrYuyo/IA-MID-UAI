/**
 * ============================================================================
 * SegaProTennis: Orquestador Principal del Juego Arcade (p5.js)
 * ============================================================================
 * Gestiona el bucle de juego, la máquina de estados de partido,
 * las colisiones raqueta-pelota y la sincronización con el HUD.
 */

let court;
let ball;
let p1;
let p2;
let ai;
let score;
let tracker;
let audio;

// Estados del partido
let gameState = 'SERVE_WAIT'; // 'SERVE_WAIT', 'IN_PLAY', 'POINT_OVER', 'MATCH_OVER'
let servePhase = 'toss';      // 'toss', 'strike'
let pointOverTimer = 0;
let rallyCount = 0;
let showVision = false;

function setup() {
  const container = document.getElementById("canvas-wrapper");
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(container);

  // Inicializar subsistemas
  audio = new SegaTennisAudio();
  court = new TennisCourt();
  ball = new TennisBall(court);
  p1 = new TennisPlayer(true, court);
  p2 = new TennisPlayer(false, court);
  ai = new TennisAI(p2, court);
  score = new TennisScore(audio);
  tracker = new TennisTracker();

  tracker.init(() => {
    console.log("Sistema de visión MoveNet inicializado.");
  });

  initUIEvents();
  prepareServe();
}

function draw() {
  background(10, 16, 28);

  // 1. Actualizar visión corporal
  tracker.update();

  // 2. Manejar entrada del Jugador 1
  handlePlayer1Input();

  // 3. Manejar Jugador 2 (CPU o 2P Local)
  if (tracker.gameMode === '1p_ai') {
    ai.update(ball, p1, audio);
  } else {
    handlePlayer2Input();
  }

  // 4. Actualizar lógica de estados
  if (gameState === 'SERVE_WAIT') {
    updateServeWait();
  } else if (gameState === 'IN_PLAY') {
    updateInPlay();
  } else if (gameState === 'POINT_OVER') {
    pointOverTimer--;
    if (pointOverTimer <= 0) {
      prepareServe();
    }
  }

  // 5. Renderizado en orden de profundidad (Painter's Algorithm)
  court.draw(width, height);
  p2.draw(width, height);
  ball.draw(width, height);
  p1.draw(width, height);

  // 6. Monitor de depuración
  if (showVision) {
    tracker.renderDebug(document.getElementById("vision-video-wrapper"));
  }

  // 7. Actualizar Marcador
  updateHUD();
}

function handlePlayer1Input() {
  const dt = tracker.p1Data;

  // Movimiento horizontal por visión (Brazos o Cabeza)
  if (Math.abs(dt.xOffset) > 0.08) {
    p1.vx = dt.xOffset * p1.speed * 1.5;
  } else {
    // Control por Teclado (Flechas / A-D)
    let kx = 0;
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) kx -= 1; // Left / A
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) kx += 1; // Right / D
    p1.vx = kx * p1.speed;
  }

  // Movimiento vertical por teclado (W-S / Arriba-Abajo)
  let ky = 0;
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) ky += 1;
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) ky -= 1;
  p1.vy = ky * p1.speed * 0.7;

  // Triggers de golpe por visión o teclado
  const triggerHit = dt.triggerForehand || dt.triggerBackhand || dt.triggerSmash || 
                     (tracker.controlMode === 'head' && p1.canHit(ball) && ball.vy < 0);

  if (triggerHit) {
    attemptPlayer1Hit(dt.triggerSmash);
  }

  p1.update();
}

function handlePlayer2Input() {
  const dt = tracker.p2Data;
  if (Math.abs(dt.xOffset) > 0.08) {
    p2.vx = dt.xOffset * p2.speed * 1.5;
  } else {
    let kx = 0;
    if (keyIsDown(74)) kx -= 1; // J
    if (keyIsDown(76)) kx += 1; // L
    p2.vx = kx * p2.speed;
  }

  if (dt.triggerForehand || dt.triggerBackhand || dt.triggerSmash) {
    if (p2.canHit(ball)) {
      p2.performSwing('auto', ball);
      p2.hitBall(ball, p1.x > 0 ? -120 : 120, dt.triggerSmash, audio);
      registerRallyHit();
    }
  }

  p2.update();
}

function attemptPlayer1Hit(isSmash = false) {
  if (gameState === 'SERVE_WAIT' && score.server === 'p1') {
    // Ejecutar golpe de Saque
    if (servePhase === 'toss' || ball.z > 40) {
      executeServeHit('p1');
    }
  } else if (gameState === 'IN_PLAY') {
    if (p1.canHit(ball)) {
      p1.performSwing(isSmash ? 'smash' : 'auto', ball);

      // Calcular dirección apuntada (según posición en pista)
      const targetAimX = (p1.x > 0) ? -130 : 130;
      p1.hitBall(ball, targetAimX, isSmash, audio);
      registerRallyHit();
    }
  }
}

function prepareServe() {
  gameState = 'SERVE_WAIT';
  servePhase = 'toss';
  rallyCount = 0;

  const side = score.getCurrentCourtSide();
  p1.reset(side);
  p2.reset(side === 'right' ? 'left' : 'right');

  // Si saca la CPU en modo 1 Jugador, programa su saque automático
  if (score.server === 'p2' && tracker.gameMode === '1p_ai') {
    setTimeout(() => {
      ball.serveToss(p2.x, p2.y);
      setTimeout(() => {
        executeServeHit('p2');
      }, 550);
    }, 900);
  }

  showBanner("READY", 900);
}

function updateServeWait() {
  // Animación del sacador botando la pelota antes de servir
  if (score.server === 'p1') {
    ball.x = p1.x + 16;
    ball.y = p1.y + 6;
    ball.z = Math.abs(Math.sin(frameCount * 0.12)) * 14;
    ball.inPlay = false;
  }
}

function executeServeHit(server) {
  const isP1 = (server === 'p1');
  const hitter = isP1 ? p1 : p2;

  hitter.performSwing('smash');
  const targetX = isP1 ? (p2.x > 0 ? -110 : 110) : (p1.x > 0 ? -110 : 110);
  const targetY = isP1 ? (court.length - 110) : 110;

  const frames = 26;
  const vy = (targetY - hitter.y) / frames;
  const vx = (targetX - hitter.x) / frames;
  const vz = 2.5;

  ball.hit(vx, vy, vz, server, true);
  audio.playHit(true);

  gameState = 'IN_PLAY';
  rallyCount = 1;
}

function updateInPlay() {
  const event = ball.update(audio);

  if (event) {
    if (event.type === 'bounce') {
      const b = event.details || ball.firstBounce;

      // Primer bote: Comprobar si fue fuera (OUT)
      if (event.first) {
        if (!b.isInside) {
          // Fuera de la pista
          endPoint(ball.lastHitter === 'p1' ? 'p2' : 'p1', "OUT!");
          return;
        }
      }

      // Segundo bote consecutivo sin que el rival golpee -> Punto para el tirador
      if (ball.bounceCountP1 >= 2) {
        endPoint('p2', "WINNER!");
        return;
      }
      if (ball.bounceCountP2 >= 2) {
        endPoint('p1', "WINNER!");
        return;
      }
    } else if (event.type === 'net_hit') {
      // Si la pelota impactó la red y no pasa
      setTimeout(() => {
        if (gameState === 'IN_PLAY' && ball.z <= 0) {
          endPoint(ball.lastHitter === 'p1' ? 'p2' : 'p1', "NET FAULT");
        }
      }, 600);
    }
  }

  // Comprobar si la pelota se alejó demasiado fuera de la pista
  if (ball.y < -120 || ball.y > court.length + 120 || Math.abs(ball.x) > court.width * 0.95) {
    if (ball.firstBounce && ball.firstBounce.isInside) {
      endPoint(ball.lastHitter, "WINNER!");
    } else {
      endPoint(ball.lastHitter === 'p1' ? 'p2' : 'p1', "OUT!");
    }
  }
}

function registerRallyHit() {
  rallyCount++;
  document.getElementById("rally-count").textContent = rallyCount;
  if (rallyCount > 4 && rallyCount % 4 === 0) {
    audio.playCrowdCheer();
  }
}

function endPoint(winner, reason = "POINT") {
  if (gameState !== 'IN_PLAY') return;

  gameState = 'POINT_OVER';
  pointOverTimer = 90; // frames (~1.5s)

  showBanner(reason, 1200);
  const result = score.pointWonBy(winner);

  if (result.type === 'match_win') {
    gameState = 'MATCH_OVER';
    showBanner("MATCH WON!", 4000);
  }
}

function showBanner(text, duration = 1200) {
  const announcer = document.getElementById("arcade-announcer");
  const el = document.getElementById("announcer-text");
  el.textContent = text;
  announcer.classList.remove("hidden");

  setTimeout(() => {
    announcer.classList.add("hidden");
  }, duration);
}

function updateHUD() {
  const d = score.getScoreDisplay();
  document.getElementById("p1-points").textContent = d.p1Points;
  document.getElementById("p2-points").textContent = d.p2Points;
  document.getElementById("p1-games").textContent = d.p1Games;
  document.getElementById("p2-games").textContent = d.p2Games;
  document.getElementById("umpire-callout").textContent = (gameState === 'SERVE_WAIT') ? 'SERVE' : 'IN PLAY';
}

function keyPressed() {
  if (key === ' ' || key === 'z' || key === 'Z') {
    attemptPlayer1Hit(false);
  } else if (key === 'x' || key === 'X') {
    attemptPlayer1Hit(true); // Smash / Globo
  } else if (key === 'v' || key === 'V') {
    toggleVision();
  } else if (key === 'm' || key === 'M') {
    toggleMute();
  } else if (key === 'f' || key === 'F') {
    const fs = fullscreen();
    fullscreen(!fs);
  } else if (key === 'r' || key === 'R') {
    score.resetMatch();
    prepareServe();
  }
}

function toggleVision() {
  showVision = !showVision;
  const win = document.getElementById("vision-monitor");
  const btn = document.getElementById("btn-camera");
  if (showVision) {
    win.classList.remove("hidden");
    btn.classList.add("active");
  } else {
    win.classList.add("hidden");
    btn.classList.remove("active");
  }
}

function toggleMute() {
  const isMuted = audio.toggleMute();
  const btn = document.getElementById("btn-sound");
  btn.textContent = isMuted ? "🔇 Silenciado" : "🔊 Audio [M]";
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function initUIEvents() {
  document.getElementById("select-game-mode").addEventListener("change", (e) => {
    tracker.gameMode = e.target.value;
    const p2Label = document.getElementById("p2-label");
    p2Label.textContent = (e.target.value === '1p_ai') ? "CPU (BORIS)" : "2P (RIVAL)";
  });

  document.getElementById("select-control-type").addEventListener("change", (e) => {
    tracker.controlMode = e.target.value;
  });

  document.getElementById("select-ai-diff").addEventListener("change", (e) => {
    ai.setDifficulty(e.target.value);
  });

  document.getElementById("btn-camera").addEventListener("click", toggleVision);
  document.getElementById("btn-sound").addEventListener("click", toggleMute);
  document.getElementById("btn-fullscreen").addEventListener("click", () => {
    fullscreen(!fullscreen());
  });
}

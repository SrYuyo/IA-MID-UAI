/**
 * Main Game Loop & UI State Machine
 * Super K.O. Boxing Web Edition (p5.js + ml5.js)
 */

let video;
let tracker;
let soundFX;
let fxManager;
let ring;
let player;
let opponent;

// Game State: 'MENU', 'CALIBRATION', 'ROUND_INTRO', 'FIGHT', 'KNOCKDOWN', 'GAME_OVER'
let gameState = 'MENU';
let currentRound = 1;
let roundTimer = 99; // 99 arcade seconds
let roundTimerFrames = 0;
let refereeCount = 0;
let refereeTimer = 0;
let winner = null; // 'PLAYER' or 'OPPONENT'

// Settings & Toggles
let showCameraPip = true;
let selectedOpponent = 'BORIS'; // 'BORIS' or 'LEO'

// Canvas Dimensions
const GAME_W = 800;
const GAME_H = 600;

function setup() {
  const canvas = createCanvas(GAME_W, GAME_H);
  canvas.parent('game-container');
  frameRate(60);

  // Initialize Audio
  soundFX = new SoundFX();

  // Initialize Effects
  fxManager = new FXManager();

  // Initialize Ring Environment
  ring = new BoxingRing(GAME_W, GAME_H);

  // Initialize Player
  player = new Player(GAME_W, GAME_H);

  // Initialize Opponent Boss
  opponent = new Opponent(GAME_W, GAME_H, selectedOpponent);

  // Initialize Webcam Capture
  video = createCapture(VIDEO, { flipped: true }, () => {
    console.log("Webcam capture initialized successfully.");
    if (video && video.elt) {
      video.elt.width = 640;
      video.elt.height = 480;
    }
  });
  video.size(640, 480);
  video.hide();

  if (video && video.elt) {
    video.elt.width = 640;
    video.elt.height = 480;
    video.elt.setAttribute('width', '640');
    video.elt.setAttribute('height', '480');
    video.elt.setAttribute('playsinline', '');
    video.elt.setAttribute('autoplay', '');
    video.elt.muted = true;
    const playPromise = video.elt.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  }

  // Initialize Pose Tracker with ml5.js
  tracker = new PoseTracker();
  tracker.init(video);
}

function startCalibration() {
  soundFX.init();
  gameState = 'CALIBRATION';
  tracker.startCalibration();
}

function startMatch() {
  soundFX.init();
  currentRound = 1;
  roundTimer = 99;
  roundTimerFrames = 0;
  player.reset();
  opponent.reset();
  gameState = 'ROUND_INTRO';
  refereeTimer = 90; // ~1.5s intro banner
  soundFX.playBell();
  if (typeof loop === 'function') {
    loop();
  }
}

function draw() {
  try {
    _renderFrame();
  } catch (err) {
    console.error("Frame render error:", err);
  }
}

function _renderFrame() {
  // Update Tracking
  if (tracker) {
    tracker.update();
  }

  // Update Visual Effects (Skip game logic on freeze-frame hit-stop)
  const continueSim = fxManager.update();

  // Main Render Pipeline
  push();
  fxManager.applyScreenShake(window);

  // 1. Draw Ring Background & Crowd
  ring.update();
  ring.draw(window);

  // 2. Draw & Update Opponent & Combat Simulation
  if (continueSim) {
    updateGameLogic();
  }

  opponent.draw(window);

  // 3. Draw Player 1st-Person Avatar (Gloves)
  player.draw(window);

  // 4. Draw Particles & Comic FX
  fxManager.draw(window);

  pop();

  // 5. Draw Arcade HUD & Overlays
  drawHUD();

  // 6. Draw State Menus (Menu, Calibration, Round Banners, Game Over)
  drawStateOverlays();

  // 7. Draw Live Camera PiP with Tracking Skeleton (in all states except Calibration)
  if (showCameraPip && gameState !== 'CALIBRATION') {
    const pipW = 210;
    const pipH = 158;
    const pipX = GAME_W - pipW - 16;
    const pipY = GAME_H - pipH - 16;
    tracker.drawHUD(window, pipX, pipY, pipW, pipH);
  }
}

function updateGameLogic() {
  if (gameState === 'FIGHT') {
    // Decrement round timer
    roundTimerFrames++;
    if (roundTimerFrames >= 60) {
      roundTimerFrames = 0;
      if (roundTimer > 0) roundTimer--;
      if (roundTimer <= 0) {
        // Time over: Decision by health
        endRoundByDecision();
      }
    }

    // Update Player & Opponent
    player.update(tracker);
    opponent.update(soundFX, fxManager, player);

    // Process Punches from Pose Tracker
    if (tracker.lastPunchAction) {
      executePlayerPunch(tracker.lastPunchAction);
    }

    // Check Player Left Glove Impact
    checkPlayerGloveCollision(player.leftGlove);
    // Check Player Right Glove Impact
    checkPlayerGloveCollision(player.rightGlove);

    // Check Player Knockdown
    if (player.isDead) {
      gameState = 'KNOCKDOWN';
      refereeCount = 1;
      refereeTimer = 60;
      winner = 'OPPONENT';
      soundFX.playCrowdGasp();
    }

    // Check Opponent Knockdown
    if (opponent.state === 'KNOCKDOWN' && gameState !== 'KNOCKDOWN') {
      gameState = 'KNOCKDOWN';
      refereeCount = 1;
      refereeTimer = 60;
      winner = 'PLAYER';
      soundFX.playCheer();
    }
  } else if (gameState === 'MENU') {
    // Interactive gloves in Menu: provides instant feedback that webcam is tracking
    player.update(tracker);
    if (tracker.lastPunchAction) {
      executePlayerPunch(tracker.lastPunchAction);
      startMatch();
    }
  } else if (gameState === 'ROUND_INTRO') {
    player.update(tracker);
    refereeTimer--;
    if (refereeTimer <= 0) {
      gameState = 'FIGHT';
    }
  } else if (gameState === 'KNOCKDOWN') {
    player.update(tracker);
    refereeTimer--;

    if (refereeTimer <= 0) {
      refereeTimer = 60;
      soundFX.playCountBeep(refereeCount);
      refereeCount++;

      if (refereeCount > 10) {
        // Full 10-count K.O.!
        gameState = 'GAME_OVER';
        soundFX.playBell();
      } else {
        // If Opponent was knocked down and recovers
        if (winner === 'PLAYER' && opponent.state === 'IDLE') {
          gameState = 'FIGHT';
          soundFX.playBell();
        }
      }
    }
  } else if (gameState === 'GAME_OVER') {
    player.update(tracker);
    if (tracker.lastPunchAction) {
      executePlayerPunch(tracker.lastPunchAction);
      startMatch();
    }
  }
}

function executePlayerPunch(punchType) {
  const isSuper = (punchType === 'SUPER_PUNCH');
  const triggered = player.triggerPunch(punchType, isSuper);

  if (triggered) {
    soundFX.playWhoosh();
  }
}

function checkPlayerGloveCollision(glove) {
  // Trigger hit at peak of punch extension
  if (glove.state === 'PUNCHING' && glove.progress >= 0.88 && !glove.hasHit) {
    glove.hasHit = true;

    // Check Opponent vulnerability
    const isCounter = (opponent.state === 'WHIFF' || opponent.state === 'TELEGRAPH' || opponent.state === 'STUNNED');
    const baseDamage = glove.isSuper ? 38 : 12;

    const hitResult = opponent.takeDamage(baseDamage, isCounter, glove.isSuper);

    if (hitResult === 'BLOCKED') {
      soundFX.playBlock();
      fxManager.triggerShake(4, 6);
      fxManager.spawnImpact(opponent.x, opponent.y - 60, false, true);
      fxManager.addText("¡DEFENDIDO!", opponent.x, opponent.y - 120, {
        color: [140, 200, 255],
        size: 32
      });
    } else if (hitResult === 'COUNTER') {
      soundFX.playHit(true, glove.isSuper);
      fxManager.triggerShake(glove.isSuper ? 24 : 16, 16);
      fxManager.triggerHitStop(glove.isSuper ? 10 : 6);
      fxManager.triggerFlash([255, 240, 100], 8);
      fxManager.spawnImpact(opponent.x, opponent.y - 80, true);
      ring.triggerRopeBounce();

      fxManager.addText("¡CONTRA-GOLPE!", opponent.x, opponent.y - 140, {
        color: [255, 230, 0],
        size: 46
      });

      player.addSuper(25);
    } else if (hitResult === 'HIT' || hitResult === 'KNOCKDOWN') {
      soundFX.playHit(false, glove.isSuper);
      fxManager.triggerShake(glove.isSuper ? 22 : 12, 12);
      fxManager.triggerHitStop(glove.isSuper ? 8 : 4);
      fxManager.spawnImpact(opponent.x, opponent.y - 70, glove.isSuper);
      ring.triggerRopeBounce();

      if (glove.isSuper) {
        fxManager.addText("¡¡SUPER K.O.!!", opponent.x, opponent.y - 150, {
          color: [255, 60, 40],
          size: 52
        });
      } else {
        const comicHits = ["¡POW!", "¡BAM!", "¡WHAM!", "¡CRACK!"];
        const hitWord = comicHits[Math.floor(Math.random() * comicHits.length)];
        fxManager.addText(hitWord, opponent.x + (Math.random() - 0.5) * 60, opponent.y - 120, {
          color: [255, 220, 50],
          size: 36
        });
        player.addSuper(10);
      }
    }
  } else if (glove.state === 'RETRACTING') {
    glove.hasHit = false; // Reset for next punch
  }
}

function endRoundByDecision() {
  if (player.hp > opponent.hp) {
    winner = 'PLAYER';
  } else {
    winner = 'OPPONENT';
  }
  gameState = 'GAME_OVER';
  soundFX.playBell();
}

// Draw Top Arcade HUD: Health Bars, Timer, KO Gauge
function drawHUD() {
  push();

  // Top HUD Bar Background
  noStroke();
  fill(8, 14, 26, 230);
  rect(0, 0, GAME_W, 75);
  stroke(0, 255, 204, 100);
  strokeWeight(2);
  line(0, 75, GAME_W, 75);

  // 1. Player Health Bar (Left)
  textAlign(LEFT, CENTER);
  fill(0, 255, 204);
  textSize(14);
  textStyle(BOLD);
  text("JUGADOR (TÚ)", 24, 20);

  // Health container
  stroke(20, 40, 60);
  strokeWeight(3);
  fill(20, 20, 30);
  rect(24, 32, 260, 22, 4);

  // Health fill
  noStroke();
  const playerHpRatio = player.hp / player.maxHp;
  if (playerHpRatio > 0.45) fill(0, 255, 160);
  else if (playerHpRatio > 0.2) fill(255, 200, 0);
  else fill(255, 40, 40);
  rect(24, 32, 260 * playerHpRatio, 22, 4);

  // 2. Round & Timer (Center)
  textAlign(CENTER, CENTER);
  fill(255, 215, 0);
  textSize(13);
  text("ROUND " + currentRound, GAME_W / 2, 18);

  // Retro 7-Segment Digital Clock style
  fill(255);
  textSize(30);
  textStyle(BOLD);
  const formattedTime = (roundTimer < 10 ? "0" : "") + roundTimer;
  text(formattedTime, GAME_W / 2, 46);

  // 3. Opponent Health Bar (Right)
  textAlign(RIGHT, CENTER);
  fill(255, 80, 80);
  textSize(14);
  text(opponent.name, GAME_W - 24, 20);

  // Opponent Health container
  stroke(20, 40, 60);
  strokeWeight(3);
  fill(20, 20, 30);
  rect(GAME_W - 284, 32, 260, 22, 4);

  // Opponent Health fill (drains from left to right)
  noStroke();
  const oppHpRatio = opponent.hp / opponent.maxHp;
  fill(255, 60, 60);
  rect(GAME_W - 24 - 260 * oppHpRatio, 32, 260 * oppHpRatio, 22, 4);

  // 4. Super K.O. Adrenaline Gauge (Bottom Left)
  if (gameState === 'FIGHT' || gameState === 'ROUND_INTRO') {
    const isSuperFull = (player.superMeter >= 100);
    fill(0, 0, 0, 180);
    rect(24, GAME_H - 46, 260, 26, 6);

    // Border
    if (isSuperFull) {
      stroke(255, 220, 0, 200 + Math.sin(frameCount * 0.4) * 55);
      strokeWeight(3);
    } else {
      stroke(50, 80, 120);
      strokeWeight(2);
    }

    noStroke();
    // Super fill
    if (isSuperFull) {
      fill(255, 200, 0);
    } else {
      fill(255, 120, 0);
    }
    rect(24, GAME_H - 46, 260 * (player.superMeter / 100), 26, 6);

    // Label
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(12);
    textStyle(BOLD);
    if (isSuperFull) {
      text("¡SUPER K.O. LISTO! (DOBLE PUÑETAZO / TECLA S)", 154, GAME_H - 33);
    } else {
      text("SUPER MEDIDOR: " + Math.floor(player.superMeter) + "%", 154, GAME_H - 33);
    }
  }

  pop();
}

// Draw Menu, Calibration Guide, Round Transition, and Game Over Screen
function drawStateOverlays() {
  push();

  if (gameState === 'MENU') {
    // Title Overlay
    fill(10, 15, 30, 230);
    rect(0, 0, GAME_W, GAME_H);

    // Main Title
    textAlign(CENTER, CENTER);
    textSize(54);
    textStyle(BOLD);

    // Shadow
    fill(255, 0, 80);
    text("SUPER K.O. BOXING", GAME_W / 2 + 3, GAME_H * 0.22 + 3);
    fill(255, 220, 0);
    text("SUPER K.O. BOXING", GAME_W / 2, GAME_H * 0.22);

    textSize(20);
    fill(0, 255, 204);
    text("EDICIÓN WEB - TRAQUEO CORPORAL CON ML5 & P5.JS", GAME_W / 2, GAME_H * 0.30);

    // Instruction Box
    fill(16, 26, 44, 210);
    stroke(0, 255, 204, 150);
    strokeWeight(2);
    rect(GAME_W * 0.15, GAME_H * 0.36, GAME_W * 0.7, GAME_H * 0.38, 12);

    noStroke();
    fill(255);
    textSize(16);
    textStyle(NORMAL);
    textAlign(LEFT, CENTER);
    const startX = GAME_W * 0.18;
    let textY = GAME_H * 0.40;

    text("🥊 CÓMO JUGAR CON TU CÁMARA WEB:", startX, textY);
    textSize(14);
    fill(200, 230, 255);
    text("• Esquiva Izq / Der: Mueve la cabeza/cuerpo a un lado", startX, textY += 26);
    text("• Agacharse (Duck): Inclina o agacha tu cuerpo hacia abajo", startX, textY += 24);
    text("• Guardia / Bloqueo: Junta ambas manos frente a tu cara", startX, textY += 24);
    text("• Puñetazos: Lanza tu mano izquierda o derecha rápido hacia el frente", startX, textY += 24);
    text("• Super K.O.: Llena la barra y lanza ambos brazos al frente", startX, textY += 24);

    fill(255, 220, 100);
    text("⌨️ También compatible con teclado: Flechas = Esquivar | Z, X = Golpes | Espacio = Guardia", startX, textY += 28);

    // Select Boss Button
    textAlign(CENTER, CENTER);
    textSize(15);
    fill(selectedOpponent === 'BORIS' ? [255, 80, 80] : [200, 200, 200]);
    text("[ 1 ] Oponente: BRUISER BORIS", GAME_W * 0.35, GAME_H * 0.80);
    fill(selectedOpponent === 'LEO' ? [255, 220, 0] : [200, 200, 200]);
    text("[ 2 ] Oponente: LIGHTNING LEO", GAME_W * 0.65, GAME_H * 0.80);

    // Start prompt (pulsing)
    const pulse = Math.sin(frameCount * 0.1) * 35 + 220;
    fill(255, pulse, 0);
    textSize(21);
    textStyle(BOLD);
    text("¡LANZA UN GOLPE, HAZ CLIC O PRESIONA ESPACIO PARA INICIAR!", GAME_W / 2, GAME_H * 0.88);

  } else if (gameState === 'CALIBRATION') {
    // Calibration Guide Overlay
    fill(10, 18, 32, 215);
    rect(0, 0, GAME_W, GAME_H);

    textAlign(CENTER, CENTER);
    fill(0, 255, 204);
    textSize(34);
    textStyle(BOLD);
    text("CALIBRACIÓN DE CÁMARA", GAME_W / 2, 100);

    textSize(18);
    fill(255);
    textStyle(NORMAL);
    text("Ponte de pie o sentado en el centro frente a tu cámara web.", GAME_W / 2, 140);
    text("Mantén una postura neutra y relajada mientras se calibra.", GAME_W / 2, 168);

    // Large Center Video Reticle
    const boxW = 380;
    const boxH = 285;
    const boxX = (GAME_W - boxW) / 2;
    const boxY = 200;

    tracker.drawHUD(window, boxX, boxY, boxW, boxH);

    // Timer / Status
    fill(255, 220, 0);
    textSize(20);
    textStyle(BOLD);
    if (tracker.isCalibrated) {
      fill(0, 255, 140);
      text("¡CALIBRACIÓN LISTA!", GAME_W / 2, 520);
      fill(255);
      textSize(16);
      text("PRESIONA ESPACIO O HAZ CLIC PARA PELEAR", GAME_W / 2, 550);
    } else {
      text("Detectando cuerpo y hombros...", GAME_W / 2, 520);
    }

  } else if (gameState === 'ROUND_INTRO') {
    // Round Banner Pop-in
    fill(0, 0, 0, 160);
    rect(0, GAME_H * 0.38, GAME_W, 140);

    textAlign(CENTER, CENTER);
    fill(255, 215, 0);
    textSize(48);
    textStyle(BOLD);
    text("¡ROUND " + currentRound + "!", GAME_W / 2, GAME_H * 0.44);

    fill(255);
    textSize(26);
    text("¡¡A PELEAR!!", GAME_W / 2, GAME_H * 0.52);

  } else if (gameState === 'KNOCKDOWN') {
    // Referee Count Overlay
    textAlign(CENTER, CENTER);
    textSize(80);
    textStyle(BOLD);

    // Pulsing Comic Count
    fill(255, 40, 40);
    text("CUENTA: " + refereeCount, GAME_W / 2 + 4, GAME_H * 0.45 + 4);
    fill(255, 230, 0);
    text("CUENTA: " + refereeCount, GAME_W / 2, GAME_H * 0.45);

    textSize(22);
    fill(255);
    if (winner === 'PLAYER') {
      text("¡EL OPONENTE ESTÁ EN LA LONA!", GAME_W / 2, GAME_H * 0.58);
    } else {
      text("¡TE DERRIBARON! ¡LEVANTA TUS MANOS!", GAME_W / 2, GAME_H * 0.58);
    }

  } else if (gameState === 'GAME_OVER') {
    fill(0, 0, 0, 225);
    rect(0, 0, GAME_W, GAME_H);

    textAlign(CENTER, CENTER);
    textStyle(BOLD);

    if (winner === 'PLAYER') {
      fill(0, 255, 160);
      textSize(56);
      text("¡¡VICTORIA POR K.O.!!", GAME_W / 2, GAME_H * 0.26);

      fill(255, 220, 0);
      textSize(25);
      text("¡ERES EL NUEVO CAMPEÓN DEL RING!", GAME_W / 2, GAME_H * 0.36);
    } else {
      fill(255, 50, 50);
      textSize(60);
      text("¡¡K.O. TOTAL!!", GAME_W / 2, GAME_H * 0.26);

      fill(220, 220, 220);
      textSize(25);
      text("HAS SIDO DERROTADO", GAME_W / 2, GAME_H * 0.36);
    }

    // Rematch Button
    const btnW = 340;
    const btnH = 54;
    const btnX = GAME_W / 2 - btnW / 2;
    const btnY = GAME_H * 0.46;

    const isHoverRematch = (mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH);
    fill(isHoverRematch ? [0, 255, 180] : [0, 210, 150]);
    stroke(255, 255, 255, 220);
    strokeWeight(isHoverRematch ? 3 : 2);
    rect(btnX, btnY, btnW, btnH, 10);

    noStroke();
    fill(10, 20, 30);
    textSize(21);
    textStyle(BOLD);
    text("🔄 VOLVER A JUGAR (REVANCHA)", GAME_W / 2, btnY + btnH / 2);

    // Menu Button
    const menuBtnW = 240;
    const menuBtnH = 44;
    const menuBtnX = GAME_W / 2 - menuBtnW / 2;
    const menuBtnY = btnY + btnH + 18;

    const isHoverMenu = (mouseX >= menuBtnX && mouseX <= menuBtnX + menuBtnW && mouseY >= menuBtnY && mouseY <= menuBtnY + menuBtnH);
    fill(isHoverMenu ? [60, 90, 130] : [40, 60, 90]);
    stroke(0, 255, 204, 150);
    strokeWeight(isHoverMenu ? 2.5 : 1.5);
    rect(menuBtnX, menuBtnY, menuBtnW, menuBtnH, 8);

    noStroke();
    fill(255);
    textSize(17);
    textStyle(BOLD);
    text("🏠 MENÚ PRINCIPAL (M)", GAME_W / 2, menuBtnY + menuBtnH / 2);

    // Prompt info
    const pulse = Math.sin(frameCount * 0.1) * 35 + 220;
    fill(255, pulse, 0);
    textSize(16);
    textStyle(NORMAL);
    text("🥊 ¡Lanza un puñetazo o presiona R / Espacio para jugar de nuevo!", GAME_W / 2, menuBtnY + menuBtnH + 34);
  }

  pop();
}

// Global Restart Helper
function restartMatch() {
  soundFX.ensureContext();
  if (video && video.elt) {
    video.elt.play().catch(() => {});
  }
  startMatch();
}

// User Input & Keyboard Fallbacks
function keyPressed() {
  soundFX.ensureContext();
  if (video && video.elt) {
    video.elt.play().catch(() => {});
  }

  // Universal restart shortcut
  if (key === 'r' || key === 'R') {
    restartMatch();
    return;
  }

  // Fullscreen toggle shortcut
  if (key === 'f' || key === 'F') {
    if (typeof toggleFullscreen === 'function') {
      toggleFullscreen();
    }
    return;
  }

  if (gameState === 'MENU') {
    if (key === '1') {
      selectedOpponent = 'BORIS';
      opponent = new Opponent(GAME_W, GAME_H, 'BORIS');
    } else if (key === '2') {
      selectedOpponent = 'LEO';
      opponent = new Opponent(GAME_W, GAME_H, 'LEO');
    } else if (key === 'c' || key === 'C') {
      startCalibration();
    } else if (key === ' ' || keyCode === ENTER) {
      startMatch();
    }
  } else if (gameState === 'CALIBRATION') {
    if (key === ' ' || keyCode === ENTER) {
      startMatch();
    }
  } else if (gameState === 'FIGHT') {
    // Keyboard fallback punches & dodges
    if (key === 'z' || key === 'Z') {
      executePlayerPunch('PUNCH_LEFT');
    } else if (key === 'x' || key === 'X') {
      executePlayerPunch('PUNCH_RIGHT');
    } else if (key === 's' || key === 'S') {
      executePlayerPunch('SUPER_PUNCH');
    } else if (keyCode === LEFT_ARROW) {
      tracker.currentAction = 'DODGE_LEFT';
    } else if (keyCode === RIGHT_ARROW) {
      tracker.currentAction = 'DODGE_RIGHT';
    } else if (keyCode === DOWN_ARROW) {
      tracker.currentAction = 'DUCK';
    } else if (key === ' ') {
      tracker.isBlocking = !tracker.isBlocking;
    } else if (key === 'c' || key === 'C') {
      startCalibration();
    } else if (key === 'p' || key === 'P') {
      showCameraPip = !showCameraPip;
    }
  } else if (gameState === 'GAME_OVER') {
    if (key === 'm' || key === 'M') {
      gameState = 'MENU';
    } else if (key === ' ' || keyCode === ENTER) {
      restartMatch();
    }
  }
}

function keyReleased() {
  if (gameState === 'FIGHT') {
    if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || keyCode === DOWN_ARROW) {
      tracker.currentAction = 'IDLE';
    }
  }
}

function mousePressed() {
  soundFX.ensureContext();
  if (video && video.elt) {
    video.elt.play().catch(() => {});
  }

  if (gameState === 'MENU') {
    startMatch();
  } else if (gameState === 'CALIBRATION') {
    startMatch();
  } else if (gameState === 'GAME_OVER') {
    const btnW = 340;
    const btnH = 54;
    const btnY = GAME_H * 0.46;
    const menuBtnW = 240;
    const menuBtnH = 44;
    const menuBtnX = GAME_W / 2 - menuBtnW / 2;
    const menuBtnY = btnY + btnH + 18;

    if (mouseX >= menuBtnX && mouseX <= menuBtnX + menuBtnW && mouseY >= menuBtnY && mouseY <= menuBtnY + menuBtnH) {
      gameState = 'MENU';
    } else {
      restartMatch();
    }
  }
}

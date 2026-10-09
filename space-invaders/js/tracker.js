/**
 * ============================================================================
 * InvadersTracker: Control Gestual con la Mano y Visión por Computadora (MoveNet)
 * ============================================================================
 * Cumple con la especificación del tablero Miro "Space Invaders con la mano":
 * - Modo MANO: El desplazamiento horizontal de la mano/muñeca en el aire mueve el cañón.
 *   El disparo se ejecuta mediante un toque/aceleración rápida hacia arriba o elevación.
 * - Modo TORSO: Inclinación corporal lateral para mover, elevación de mano para disparar.
 * - Modo 2 JUGADORES: Detección dual en cámara para defensa cooperativa simultánea.
 */

class InvadersTracker {
  constructor() {
    this.video = null;
    this.bodyPose = null;
    this.isReady = false;
    this.controlMode = 'hand'; // 'hand', 'torso', 'keyboard'
    this.gameMode = '1p';      // '1p', '2p_coop'
    this.rawPoses = [];

    // Salidas normalizadas (0.0 a 1.0)
    this.p1NormX = 0.5;
    this.p1Shoot = false;
    this.p2NormX = 0.7;
    this.p2Shoot = false;

    // Historial para detección de gestos rápidos
    this.prevWristY = { p1: 0, p2: 0 };
    this.debugCanvas = null;
    this.debugCtx = null;
  }

  init(onReadyCallback) {
    this.onReadyCallback = onReadyCallback;

    try {
      this.video = createCapture(VIDEO, () => {
        this.video.size(640, 480);
        this.video.hide();
        this.loadMoveNet();
      });

      this.video.elt.onerror = () => {
        this.fallbackToKeyboard();
      };
    } catch (e) {
      this.fallbackToKeyboard();
    }
  }

  loadMoveNet() {
    if (typeof ml5 === 'undefined' || !ml5.bodyPose) {
      this.fallbackToKeyboard();
      return;
    }

    const options = {
      modelType: "MULTIPOSE_LIGHTNING",
      enableSmoothing: true,
      minPoseScore: 0.2
    };

    try {
      this.bodyPose = ml5.bodyPose("MoveNet", options, () => {
        this.isReady = true;
        const statusEl = document.getElementById("tracker-status");
        if (statusEl) statusEl.textContent = "MoveNet Activo";

        this.bodyPose.detectStart(this.video, (results) => {
          this.rawPoses = results || [];
        });

        if (this.onReadyCallback) this.onReadyCallback();
      });
    } catch (err) {
      this.fallbackToKeyboard();
    }
  }

  fallbackToKeyboard() {
    this.controlMode = 'keyboard';
    const statusEl = document.getElementById("tracker-status");
    if (statusEl) statusEl.textContent = "Modo Teclado Activo";
    if (this.onReadyCallback) this.onReadyCallback();
  }

  update() {
    this.p1Shoot = false;
    this.p2Shoot = false;

    if (!this.isReady || this.rawPoses.length === 0) return;

    const vw = this.video.width || 640;
    const vh = this.video.height || 480;

    // Extraer personas y ordenar por posición X espejada
    const validBodies = [];

    for (let pose of this.rawPoses) {
      const kps = pose.keypoints || (pose.pose && pose.pose.keypoints) || [];
      let nose = null, lShoulder = null, rShoulder = null;
      let lWrist = null, rWrist = null, lElbow = null, rElbow = null;

      for (let kp of kps) {
        const name = kp.name || "";
        const conf = kp.confidence || kp.score || 0;
        if (conf < 0.2) continue;

        if (name === "nose") nose = kp;
        else if (name === "left_shoulder") lShoulder = kp;
        else if (name === "right_shoulder") rShoulder = kp;
        else if (name === "left_wrist") lWrist = kp;
        else if (name === "right_wrist") rWrist = kp;
        else if (name === "left_elbow") lElbow = kp;
        else if (name === "right_elbow") rElbow = kp;
      }

      if (nose || lShoulder || rShoulder) {
        const refX = nose ? nose.x : ((lShoulder.x + rShoulder.x) / 2);
        const normScreenX = 1.0 - (refX / vw);

        validBodies.push({
          screenX: normScreenX,
          nose, lShoulder, rShoulder, lWrist, rWrist, lElbow, rElbow
        });
      }
    }

    validBodies.sort((a, b) => a.screenX - b.screenX);

    if (validBodies.length >= 2 && this.gameMode === '2p_coop') {
      const resP1 = this.processBody(validBodies[0], vw, vh, 'p1');
      const resP2 = this.processBody(validBodies[1], vw, vh, 'p2');
      this.p1NormX = resP1.x;
      this.p1Shoot = resP1.shoot;
      this.p2NormX = resP2.x;
      this.p2Shoot = resP2.shoot;
    } else if (validBodies.length >= 1) {
      const resP1 = this.processBody(validBodies[0], vw, vh, 'p1');
      this.p1NormX = resP1.x;
      this.p1Shoot = resP1.shoot;
    }
  }

  processBody(body, vw, vh, playerKey) {
    let outX = 0.5;
    let shoot = false;

    if (this.controlMode === 'hand') {
      // MODO MANO (Tablero Miro):
      // Usar la mano más activa (muñeca derecha o izquierda)
      let activeWrist = null;
      let refElbow = null;

      if (body.rWrist && (body.rWrist.confidence || 0) > 0.25) {
        activeWrist = body.rWrist;
        refElbow = body.rElbow;
      } else if (body.lWrist && (body.lWrist.confidence || 0) > 0.25) {
        activeWrist = body.lWrist;
        refElbow = body.lElbow;
      }

      if (activeWrist) {
        // Posición horizontal espejada de la mano
        const normHandX = 1.0 - (activeWrist.x / vw);
        outX = Math.max(0.05, Math.min(0.95, (normHandX - 0.2) / 0.6));

        // Detección de Gesto de Disparo:
        // 1. Movimiento brusco ascendente de la muñeca (flinch/tap)
        const prevY = this.prevWristY[playerKey] || activeWrist.y;
        const deltaY = prevY - activeWrist.y; // Positivo si sube rápido
        if (deltaY > 16) {
          shoot = true;
        }

        // 2. Mano significativamente elevada respecto al codo o los hombros
        if (body.rShoulder && activeWrist.y < body.rShoulder.y - 15) {
          shoot = true;
        }

        this.prevWristY[playerKey] = activeWrist.y;
      } else if (body.nose) {
        outX = 1.0 - (body.nose.x / vw);
      }

    } else {
      // MODO TORSO / CABEZA:
      if (body.nose) {
        const normNoseX = 1.0 - (body.nose.x / vw);
        outX = Math.max(0.05, Math.min(0.95, (normNoseX - 0.25) / 0.5));
      }

      // Disparar levantando cualquiera de las muñecas
      if (body.rWrist && body.rShoulder && body.rWrist.y < body.rShoulder.y) {
        shoot = true;
      }
      if (body.lWrist && body.lShoulder && body.lWrist.y < body.lShoulder.y) {
        shoot = true;
      }
    }

    return { x: outX, shoot: shoot };
  }

  renderDebug(container) {
    if (!container) return;
    if (!this.debugCanvas) {
      this.debugCanvas = document.createElement("canvas");
      this.debugCanvas.width = 200;
      this.debugCanvas.height = 120;
      container.innerHTML = "";
      container.appendChild(this.debugCanvas);
      this.debugCtx = this.debugCanvas.getContext("2d");
    }

    const ctx = this.debugCtx;
    const w = this.debugCanvas.width;
    const h = this.debugCanvas.height;
    ctx.clearRect(0, 0, w, h);

    if (this.video && this.video.elt) {
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      try { ctx.drawImage(this.video.elt, 0, 0, w, h); } catch(e){}
      ctx.restore();

      // Indicadores de posición de cañón y disparo
      ctx.fillStyle = this.p1Shoot ? "#ff007f" : "#00ff66";
      ctx.fillRect(this.p1NormX * (w - 18), h - 14, 18, 10);

      if (this.gameMode === '2p_coop') {
        ctx.fillStyle = this.p2Shoot ? "#ff007f" : "#00e5ff";
        ctx.fillRect(this.p2NormX * (w - 18), h - 14, 18, 10);
      }
    }
  }
}

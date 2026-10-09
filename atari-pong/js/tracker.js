/**
 * ============================================================================
 * PongTracker: Visión por Computadora (MoveNet) para Control de Palas PONG
 * ============================================================================
 * Modos de control seleccionables:
 * 1. CABEZA ('head'): La altura y posición vertical de la cabeza/nariz mueve la pala
 * 2. BRAZOS ('arms'): La elevación de las muñecas/manos mueve la pala
 * 3. TECLADO ('keyboard'): W/S para P1, Flechas para P2
 * 
 * Modos de juego:
 * - 1P vs IA: La persona detectada controla la pala izquierda (P1)
 * - 2P Local: Si hay 2 personas, persona izquierda -> P1, persona derecha -> P2
 */

class PongTracker {
  constructor() {
    this.video = null;
    this.bodyPose = null;
    this.isReady = false;
    this.controlMode = 'head'; // 'head', 'arms', 'keyboard'
    this.gameMode = '1p_ai';   // '1p_ai', '2p_local'
    this.rawPoses = [];

    // Valores normalizados de salida (0.0 = arriba, 1.0 = abajo)
    this.p1NormY = 0.5;
    this.p2NormY = 0.5;

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
        if (statusEl) statusEl.textContent = "MoveNet Conectado";

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
    if (!this.isReady || this.rawPoses.length === 0) return;

    const vw = this.video.width || 640;
    const vh = this.video.height || 480;

    // Filtrar personas válidas y ordenar de izquierda a derecha (espejado)
    const validBodies = [];

    for (let pose of this.rawPoses) {
      const kps = pose.keypoints || (pose.pose && pose.pose.keypoints) || [];
      let nose = null, lShoulder = null, rShoulder = null;
      let lWrist = null, rWrist = null;

      for (let kp of kps) {
        const name = kp.name || "";
        const conf = kp.confidence || kp.score || 0;
        if (conf < 0.2) continue;

        if (name === "nose") nose = kp;
        else if (name === "left_shoulder") lShoulder = kp;
        else if (name === "right_shoulder") rShoulder = kp;
        else if (name === "left_wrist") lWrist = kp;
        else if (name === "right_wrist") rWrist = kp;
      }

      if (nose || lShoulder || rShoulder) {
        // Centro X del cuerpo (espejado)
        const refX = nose ? nose.x : ((lShoulder.x + rShoulder.x) / 2);
        const normScreenX = 1.0 - (refX / vw);

        validBodies.push({
          screenX: normScreenX,
          nose: nose,
          lShoulder: lShoulder,
          rShoulder: rShoulder,
          lWrist: lWrist,
          rWrist: rWrist
        });
      }
    }

    validBodies.sort((a, b) => a.screenX - b.screenX);

    if (validBodies.length >= 2 && this.gameMode === '2p_local') {
      // 2 Jugadores: El de la izquierda controla P1, el de la derecha controla P2
      this.p1NormY = this.computeNormY(validBodies[0], vh);
      this.p2NormY = this.computeNormY(validBodies[1], vh);
    } else if (validBodies.length >= 1) {
      // 1 Jugador: Controla P1
      this.p1NormY = this.computeNormY(validBodies[0], vh);
    }
  }

  computeNormY(body, vh) {
    if (this.controlMode === 'head') {
      // MODO CABEZA:
      // Usar posición Y de la nariz. Calibrado para sensibilidad de escritorio
      if (body.nose) {
        const rawNormY = body.nose.y / vh;
        // Remapear rango típico de movimiento de cabeza (0.15 a 0.75) al rango completo (0.0 a 1.0)
        const mapped = (rawNormY - 0.18) / 0.55;
        return Math.max(0.0, Math.min(1.0, mapped));
      }
    } else if (this.controlMode === 'arms') {
      // MODO BRAZOS:
      // Usar la muñeca más alta (menor valor Y) o la muñeca derecha activa
      let wristY = null;
      if (body.rWrist && body.lWrist) {
        wristY = Math.min(body.rWrist.y, body.lWrist.y);
      } else if (body.rWrist) {
        wristY = body.rWrist.y;
      } else if (body.lWrist) {
        wristY = body.lWrist.y;
      }

      if (wristY !== null) {
        const rawNormY = wristY / vh;
        const mapped = (rawNormY - 0.2) / 0.6;
        return Math.max(0.0, Math.min(1.0, mapped));
      }
    }

    return 0.5; // Centro por defecto
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

      // Indicadores de altura detectada
      ctx.fillStyle = "#ffe600";
      ctx.fillRect(8, this.p1NormY * (h - 20), 6, 20);

      if (this.gameMode === '2p_local') {
        ctx.fillStyle = "#00e5ff";
        ctx.fillRect(w - 14, this.p2NormY * (h - 20), 6, 20);
      }
    }
  }
}

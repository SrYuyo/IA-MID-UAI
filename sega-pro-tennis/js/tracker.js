/**
 * ============================================================================
 * TennisTracker: Detección Corporal Multimodal (Brazos / Cabeza / Teclado)
 * ============================================================================
 * Procesa la visión en tiempo real mediante ml5.js MoveNet:
 * 1. MODO BRAZOS:
 *    - Desplazamiento por centro corporal (hombros)
 *    - Swing de Muñeca Derecha -> Forehand / Drive
 *    - Swing de Muñeca Izquierda -> Backhand / Revés
 *    - Ambas muñecas arriba -> Saque / Smash
 * 2. MODO CABEZA:
 *    - Inclinación lateral de cabeza (nariz/ojos) para correr
 *    - Swing automático sincronizado o cabeceo
 * 3. MODO 2 JUGADORES:
 *    - Divide la cámara: Persona izquierda = P1, Persona derecha = P2
 */

class TennisTracker {
  constructor() {
    this.video = null;
    this.bodyPose = null;
    this.isReady = false;
    this.controlMode = 'arms'; // 'arms', 'head', 'hybrid'
    this.gameMode = '1p_ai';   // '1p_ai', '2p_local'
    this.rawPoses = [];

    // Estado P1
    this.p1Data = {
      xOffset: 0,
      yOffset: 0,
      triggerForehand: false,
      triggerBackhand: false,
      triggerSmash: false,
      triggerServe: false
    };

    // Estado P2 (si se activa modo 2 jugadores)
    this.p2Data = {
      xOffset: 0,
      yOffset: 0,
      triggerForehand: false,
      triggerBackhand: false,
      triggerSmash: false
    };

    // Historial para cálculo de velocidad de extremidades
    this.prevWrists = { p1_lw: 0, p1_rw: 0, p2_lw: 0, p2_rw: 0 };
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
      minPoseScore: 0.22
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
    this.controlMode = 'hybrid';
    const statusEl = document.getElementById("tracker-status");
    if (statusEl) statusEl.textContent = "Modo Teclado/Híbrido";
    if (this.onReadyCallback) this.onReadyCallback();
  }

  update() {
    // Resetear triggers de un solo disparo
    this.p1Data.triggerForehand = false;
    this.p1Data.triggerBackhand = false;
    this.p1Data.triggerSmash = false;
    this.p1Data.triggerServe = false;

    this.p2Data.triggerForehand = false;
    this.p2Data.triggerBackhand = false;
    this.p2Data.triggerSmash = false;

    if (this.isReady && this.rawPoses.length > 0) {
      const vw = this.video.width || 640;
      const vh = this.video.height || 480;

      // Ordenar poses de izquierda a derecha (en espacio espejo: 1.0 - normX)
      const detected = [];
      for (let pose of this.rawPoses) {
        const kps = pose.keypoints || (pose.pose && pose.pose.keypoints) || [];
        const nose = kps.find(k => k.name === 'nose') || kps[0];
        if (nose && (nose.confidence || nose.score || 0) > 0.2) {
          const normX = 1.0 - (nose.x / vw);
          detected.push({ kps: kps, screenX: normX });
        }
      }

      detected.sort((a, b) => a.screenX - b.screenX);

      if (detected.length >= 2 && this.gameMode === '2p_local') {
        // Modo 2 Jugadores: Jugador a la izquierda y jugador a la derecha
        this.processPersonPose(detected[0].kps, this.p1Data, vw, vh, 'p1');
        this.processPersonPose(detected[1].kps, this.p2Data, vw, vh, 'p2');
      } else if (detected.length >= 1) {
        this.processPersonPose(detected[0].kps, this.p1Data, vw, vh, 'p1');
      }
    }
  }

  processPersonPose(keypoints, outData, vw, vh, playerKey) {
    let nose = null, lShoulder = null, rShoulder = null;
    let lWrist = null, rWrist = null;

    for (let kp of keypoints) {
      const name = kp.name || "";
      const conf = kp.confidence || kp.score || 0;
      if (conf < 0.2) continue;

      if (name === "nose") nose = kp;
      else if (name === "left_shoulder") lShoulder = kp;
      else if (name === "right_shoulder") rShoulder = kp;
      else if (name === "left_wrist") lWrist = kp;
      else if (name === "right_wrist") rWrist = kp;
    }

    if (this.controlMode === 'head' && nose) {
      // CONTROL POR CABEZA:
      // Desplazamiento X basado en el desplazamiento horizontal de la nariz respecto al centro
      const normNoseX = 1.0 - (nose.x / vw); // Espejado
      outData.xOffset = (normNoseX - 0.5) * 2.2; // Rango aprox -1.0 a 1.0

      // Detección de cabeceo rápido para swing
      if (lShoulder && rShoulder) {
        const avgShoulderY = (lShoulder.y + rShoulder.y) / 2;
        if (avgShoulderY - nose.y < 40) {
          outData.triggerForehand = true;
        }
      }
    } else {
      // CONTROL POR BRAZOS (Predeterminado):
      // Posición X corporal basada en el centro entre hombros
      if (lShoulder && rShoulder) {
        const midShoulderX = (lShoulder.x + rShoulder.x) / 2;
        const normX = 1.0 - (midShoulderX / vw);
        outData.xOffset = (normX - 0.5) * 2.4;
      }

      // Gestos de Brazos:
      if (lWrist && rWrist && lShoulder && rShoulder) {
        // 1. Saque / Smash: Ambas muñecas elevadas por encima de los hombros
        const bothArmsUp = (lWrist.y < lShoulder.y - 20) && (rWrist.y < rShoulder.y - 20);
        if (bothArmsUp) {
          outData.triggerSmash = true;
          outData.triggerServe = true;
        }

        // 2. Forehand (Drive derecha): muñeca derecha cruza o acelera hacia el frente
        const rwSpeed = Math.abs(rWrist.x - (this.prevWrists[playerKey + '_rw'] || rWrist.x));
        if (rwSpeed > 18 && rWrist.y < rShoulder.y + 30) {
          outData.triggerForehand = true;
        }

        // 3. Backhand (Revés izquierda): muñeca izquierda cruza
        const lwSpeed = Math.abs(lWrist.x - (this.prevWrists[playerKey + '_lw'] || lWrist.x));
        if (lwSpeed > 18 && lWrist.y < lShoulder.y + 30) {
          outData.triggerBackhand = true;
        }

        this.prevWrists[playerKey + '_rw'] = rWrist.x;
        this.prevWrists[playerKey + '_lw'] = lWrist.x;
      }
    }
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

      // Dibujar keypoints
      const vw = this.video.width || 640;
      const vh = this.video.height || 480;

      for (let pose of this.rawPoses) {
        const kps = pose.keypoints || (pose.pose && pose.pose.keypoints) || [];
        for (let kp of kps) {
          if ((kp.confidence || kp.score || 0) > 0.25) {
            const kx = (1.0 - kp.x / vw) * w;
            const ky = (kp.y / vh) * h;
            ctx.fillStyle = (kp.name && kp.name.includes('wrist')) ? '#ffe600' : '#00e5ff';
            ctx.beginPath();
            ctx.arc(kx, ky, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }
}

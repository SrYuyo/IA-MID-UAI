/**
 * ============================================================================
 * BodyTracker: Módulo de Visión Computacional (ml5.js bodyPose / MoveNet)
 * ============================================================================
 * Cumple con las etapas 1 y 2 del diagrama:
 * 1. Captura con Webcam / Gran angular y detección en tiempo real.
 * 2. Si se detecta cuerpo:
 *    - Extrae hombros, caderas y calcula el Centro de Masa (CoM).
 *    - Calcula vectores: Posición (x, y), Velocidad (dx, dy), Aceleración / Cadencia.
 *    - Clasifica: Paso Lento / Calmo vs. Paso Rápido / Dinámico.
 * 3. Si no hay detección: Activa Modo Reposo.
 * 4. Soporta fallback y modos de simulación para pruebas en oficina o sin webcam.
 */

class BodyTracker {
  constructor() {
    this.video = null;
    this.bodyPose = null;
    this.isModelLoaded = false;
    this.rawPoses = [];

    // Estado analítico de personas rastreadas
    this.trackedPersons = [];
    this.isIdle = true;
    this.globalIntensity = 0.0; // 0.0 (calmo) a 1.0 (dinámico máximo)
    this.lastDetectionTime = 0;
    this.idleThresholdMs = 1200; // Tiempo para confirmar modo reposo

    // Modo de entrada: 'webcam', 'sim_mouse', 'sim_auto'
    this.mode = 'webcam';

    // Agentes autónomos para simulación de transeúntes
    this.ghostWalkers = [];

    // Referencias al DOM de debug
    this.debugCanvas = null;
    this.debugCtx = null;
  }

  /**
   * Inicializa la captura de video y el modelo ml5.bodyPose
   */
  init(onReadyCallback) {
    this.onReadyCallback = onReadyCallback;

    // Inicializar simulación autónoma por defecto como respaldo
    this.initGhostWalkers();

    // Intentar inicializar captura de video
    try {
      this.video = createCapture(VIDEO, () => {
        console.log("📹 Cámara iniciada exitosamente.");
        this.video.size(640, 480);
        this.video.hide();
        this.loadBodyPoseModel();
      });

      this.video.elt.onerror = (err) => {
        console.warn("No se pudo acceder a la webcam, alternando a modo simulación.", err);
        this.fallbackToSimulation();
      };
    } catch (e) {
      console.warn("Excepción al iniciar captura de video:", e);
      this.fallbackToSimulation();
    }
  }

  /**
   * Carga el modelo MoveNet de ml5.js
   */
  loadBodyPoseModel() {
    if (typeof ml5 === 'undefined' || !ml5.bodyPose) {
      console.warn("ml5.bodyPose no disponible, alternando a modo simulación.");
      this.fallbackToSimulation();
      return;
    }

    const options = {
      modelType: "MULTIPOSE_LIGHTNING", // Soporte para múltiples personas en tránsito
      enableSmoothing: true,
      minPoseScore: 0.25
    };

    try {
      this.bodyPose = ml5.bodyPose("MoveNet", options, () => {
        console.log("✨ ml5.js MoveNet cargado y listo.");
        this.isModelLoaded = true;
        const statusEl = document.getElementById("debug-model-status");
        if (statusEl) statusEl.textContent = "MoveNet Conectado";

        // Iniciar bucle continuo de detección
        this.bodyPose.detectStart(this.video, (results) => {
          this.rawPoses = results || [];
        });

        if (this.onReadyCallback) this.onReadyCallback();
      });
    } catch (err) {
      console.error("Error al instanciar ml5.bodyPose:", err);
      this.fallbackToSimulation();
    }
  }

  fallbackToSimulation() {
    this.mode = 'sim_mouse';
    const select = document.getElementById("input-mode");
    if (select) select.value = 'sim_mouse';
    const statusEl = document.getElementById("debug-model-status");
    if (statusEl) statusEl.textContent = "Modo Simulación Activo";
    if (this.onReadyCallback) this.onReadyCallback();
  }

  initGhostWalkers() {
    this.ghostWalkers = [
      { x: 100, y: 300, vx: 2.2, vy: 0.3, speed: 2.2, intensity: 0.2, hue: 190 },
      { x: 500, y: 400, vx: -4.5, vy: -0.2, speed: 4.5, intensity: 0.8, hue: 350 }
    ];
  }

  /**
   * Procesa la entrada en cada frame y extrae los vectores clave
   */
  update(canvasWidth, canvasHeight) {
    const now = performance.now();

    if (this.mode === 'webcam' && this.isModelLoaded && this.rawPoses.length > 0) {
      this.processVisionPoses(canvasWidth, canvasHeight, now);
    } else if (this.mode === 'sim_mouse') {
      this.processMouseSimulation(canvasWidth, canvasHeight, now);
    } else if (this.mode === 'sim_auto') {
      this.processAutoSimulation(canvasWidth, canvasHeight, now);
    } else {
      // Si estamos en webcam pero aún no hay poses detectadas
      if (now - this.lastDetectionTime > this.idleThresholdMs) {
        this.isIdle = true;
        this.trackedPersons = [];
        this.globalIntensity *= 0.92;
      }
    }

    return {
      isIdle: this.isIdle,
      persons: this.trackedPersons,
      intensity: this.globalIntensity
    };
  }

  /**
   * Extrae keypoints clave (hombros, caderas, centro de masa) y calcula vectores
   */
  processVisionPoses(canvasWidth, canvasHeight, now) {
    const validPersons = [];
    const videoW = this.video.width || 640;
    const videoH = this.video.height || 480;

    for (let i = 0; i < this.rawPoses.length; i++) {
      const poseData = this.rawPoses[i];
      const keypoints = poseData.keypoints || (poseData.pose && poseData.pose.keypoints) || [];

      // Buscar hombros y caderas por nombre o índice estándar de MoveNet (5: L-Shoulder, 6: R-Shoulder, 11: L-Hip, 12: R-Hip)
      let leftShoulder = null, rightShoulder = null;
      let leftHip = null, rightHip = null;

      for (let k = 0; k < keypoints.length; k++) {
        const kp = keypoints[k];
        const name = kp.name || "";
        const conf = kp.confidence || kp.score || 0;
        if (conf < 0.2) continue;

        if (name === "left_shoulder" || k === 5) leftShoulder = kp;
        else if (name === "right_shoulder" || k === 6) rightShoulder = kp;
        else if (name === "left_hip" || k === 11) leftHip = kp;
        else if (name === "right_hip" || k === 12) rightHip = kp;
      }

      // Cálculo del Centro de Masa (CoM)
      let comX = 0, comY = 0, count = 0;
      if (leftShoulder) { comX += leftShoulder.x; comY += leftShoulder.y; count++; }
      if (rightShoulder) { comX += rightShoulder.x; comY += rightShoulder.y; count++; }
      if (leftHip) { comX += leftHip.x; comY += leftHip.y; count++; }
      if (rightHip) { comX += rightHip.x; comY += rightHip.y; count++; }

      // Si no hay hombros ni caderas visibles, promediar keypoints disponibles
      if (count === 0) {
        let validCount = 0;
        for (let kp of keypoints) {
          if ((kp.confidence || kp.score || 0) > 0.25) {
            comX += kp.x;
            comY += kp.y;
            validCount++;
          }
        }
        if (validCount > 0) {
          comX /= validCount;
          comY /= validCount;
          count = validCount;
        }
      } else {
        comX /= count;
        comY /= count;
      }

      if (count > 0) {
        // Mapeo a coordenadas del lienzo (soporta coordenadas absolutas o normalizadas [0, 1])
        const normX = (comX > 1.0) ? (comX / videoW) : comX;
        const normY = (comY > 1.0) ? (comY / videoH) : comY;

        // Efecto espejo horizontal para interacción natural frente a la pared/pantalla
        const screenX = (1.0 - Math.min(1.0, Math.max(0.0, normX))) * canvasWidth;
        const screenY = Math.min(1.0, Math.max(0.0, normY)) * canvasHeight;

        // Buscar coincidencia previa con la persona más cercana
        const prev = this.findClosestPerson(screenX, screenY);
        let vx = 0, vy = 0, speed = 0, accel = 0;

        if (prev) {
          // Suavizado exponencial de posición
          const smoothX = prev.x * 0.65 + screenX * 0.35;
          const smoothY = prev.y * 0.65 + screenY * 0.35;

          vx = smoothX - prev.x;
          vy = smoothY - prev.y;
          speed = Math.sqrt(vx * vx + vy * vy);
          accel = Math.abs(speed - prev.speed);

          validPersons.push({
            id: prev.id,
            x: smoothX,
            y: smoothY,
            vx: vx,
            vy: vy,
            speed: speed,
            accel: accel,
            intensity: Math.min(1.0, speed / 18.0),
            keypoints: keypoints
          });
        } else {
          validPersons.push({
            id: Math.random().toString(36).substr(2, 9),
            x: screenX,
            y: screenY,
            vx: 0,
            vy: 0,
            speed: 0,
            accel: 0,
            intensity: 0.1,
            keypoints: keypoints
          });
        }
      }
    }

    if (validPersons.length > 0) {
      this.isIdle = false;
      this.lastDetectionTime = now;
      this.trackedPersons = validPersons;

      // Calcular intensidad global promedio
      let totalInt = 0;
      for (let p of validPersons) totalInt += p.intensity;
      const targetInt = totalInt / validPersons.length;
      this.globalIntensity = this.globalIntensity * 0.7 + targetInt * 0.3;
    } else {
      if (now - this.lastDetectionTime > this.idleThresholdMs) {
        this.isIdle = true;
        this.trackedPersons = [];
        this.globalIntensity *= 0.94;
      }
    }
  }

  findClosestPerson(x, y, maxDist = 200) {
    let closest = null;
    let minDist = maxDist;
    for (let p of this.trackedPersons) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < minDist) {
        minDist = d;
        closest = p;
      }
    }
    return closest;
  }

  /**
   * Simulación interactiva con Mouse
   */
  processMouseSimulation(canvasWidth, canvasHeight, now) {
    // Si el mouse está dentro del canvas y se mueve
    const inBounds = mouseX >= 0 && mouseX <= canvasWidth && mouseY >= 0 && mouseY <= canvasHeight;
    const dx = mouseX - pmouseX;
    const dy = mouseY - pmouseY;
    const speed = Math.sqrt(dx * dx + dy * dy);

    if (inBounds && (speed > 0.5 || mouseIsPressed)) {
      this.isIdle = false;
      this.lastDetectionTime = now;

      const intensity = Math.min(1.0, speed / 25.0);
      this.globalIntensity = this.globalIntensity * 0.8 + intensity * 0.2;

      this.trackedPersons = [{
        id: 'mouse-user',
        x: mouseX,
        y: mouseY,
        vx: dx,
        vy: dy,
        speed: speed,
        accel: Math.abs(speed),
        intensity: intensity,
        keypoints: []
      }];
    } else {
      if (now - this.lastDetectionTime > this.idleThresholdMs) {
        this.isIdle = true;
        this.trackedPersons = [];
        this.globalIntensity *= 0.94;
      }
    }
  }

  /**
   * Simulación autónoma con transeúntes paseando por la pantalla
   */
  processAutoSimulation(canvasWidth, canvasHeight, now) {
    this.isIdle = false;
    this.lastDetectionTime = now;
    const simulated = [];

    for (let g of this.ghostWalkers) {
      g.x += g.vx;
      g.y += g.vy;

      // Rebote o reaparición en los extremos
      if (g.x < -50) { g.x = canvasWidth + 50; g.y = Math.random() * canvasHeight; }
      if (g.x > canvasWidth + 50) { g.x = -50; g.y = Math.random() * canvasHeight; }
      if (g.y < 50 || g.y > canvasHeight - 50) { g.vy *= -1; }

      simulated.push({
        id: 'ghost-' + g.speed,
        x: g.x,
        y: g.y,
        vx: g.vx,
        vy: g.vy,
        speed: Math.abs(g.vx),
        accel: 0.1,
        intensity: g.intensity,
        keypoints: []
      });
    }

    this.trackedPersons = simulated;
    let avgInt = 0;
    for (let s of simulated) avgInt += s.intensity;
    this.globalIntensity = avgInt / simulated.length;
  }

  /**
   * Dibuja la ventana de monitorización en el canvas de depuración
   */
  renderDebug(targetContainer) {
    if (!targetContainer) return;

    if (!this.debugCanvas) {
      this.debugCanvas = document.createElement("canvas");
      this.debugCanvas.width = 240;
      this.debugCanvas.height = 140;
      targetContainer.innerHTML = "";
      targetContainer.appendChild(this.debugCanvas);
      this.debugCtx = this.debugCanvas.getContext("2d");
    }

    const ctx = this.debugCtx;
    const w = this.debugCanvas.width;
    const h = this.debugCanvas.height;

    ctx.clearRect(0, 0, w, h);

    if (this.mode === 'webcam' && this.video && this.video.elt) {
      // Dibujar preview de cámara espejada
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      try {
        ctx.drawImage(this.video.elt, 0, 0, w, h);
      } catch (e) {}
      ctx.restore();

      // Dibujar keypoints sobre el monitor
      if (this.rawPoses.length > 0) {
        const vw = this.video.width || 640;
        const vh = this.video.height || 480;

        for (let pose of this.rawPoses) {
          const kps = pose.keypoints || (pose.pose && pose.pose.keypoints) || [];
          for (let kp of kps) {
            if ((kp.confidence || kp.score || 0) > 0.25) {
              const kx = (1.0 - kp.x / vw) * w;
              const ky = (kp.y / vh) * h;

              ctx.fillStyle = "#00d2ff";
              ctx.beginPath();
              ctx.arc(kx, ky, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    } else {
      // Vista sintética en modo simulación
      ctx.fillStyle = "#090f1d";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#8b9bb4";
      ctx.font = "11px sans-serif";
      ctx.fillText(`Modo: ${this.mode}`, 12, 24);

      for (let p of this.trackedPersons) {
        const screenW = window.innerWidth || 1920;
        const screenH = window.innerHeight || 1080;
        const px = (p.x / screenW) * w;
        const py = (p.y / screenH) * h;
        ctx.fillStyle = "#ffb347";
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        // Vector de velocidad
        ctx.strokeStyle = "#00f0b5";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + p.vx * 3, py + p.vy * 3);
        ctx.stroke();
      }
    }
  }
}

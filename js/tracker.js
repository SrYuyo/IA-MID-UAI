/**
 * Pose Tracking & Gesture Classifier using ml5.js (MoveNet)
 * Super K.O. Boxing Web Edition
 */

class PoseTracker {
  constructor() {
    this.video = null;
    this.bodyPose = null;
    this.poses = [];
    this.isModelLoaded = false;
    this.cameraReady = false;
    this.statusMessage = "Iniciando cámara...";
    this.detectionCount = 0;

    // Smoothed Keypoints cache
    this.smoothed = {};
    this.prevKeypoints = {};
    this.velocity = {};

    // Arm extension history for punch detection (depth movement)
    this.prevArmExtension = { left: 0, right: 0 };
    this.armExtensionVelocity = { left: 0, right: 0 };

    // Calibration data
    this.isCalibrated = false;
    this.isCalibrating = false;
    this.calibrationSamples = [];
    this.calibrationTimer = 0;
    this.neutralPose = {
      noseX: 320,
      noseY: 200,
      shoulderSpan: 160,
      shoulderY: 240,
    };

    // Detected actions state
    this.currentAction = 'IDLE'; // 'IDLE', 'DODGE_LEFT', 'DODGE_RIGHT', 'DUCK', 'BLOCK'
    this.lastPunchAction = null; // 'PUNCH_LEFT', 'PUNCH_RIGHT', 'SUPER_PUNCH'
    this.punchCooldown = 0;

    // Metrics for HUD and continuous glove sway
    this.dodgeAmountX = 0; // -1 to 1
    this.duckAmountY = 0;  // 0 to 1
    this.isBlocking = false;
  }

  init(videoCapture) {
    this.video = videoCapture;

    // Ensure HTMLVideoElement has explicit dimensions, attributes and is playing
    if (this.video && this.video.elt) {
      const vElt = this.video.elt;
      vElt.width = 640;
      vElt.height = 480;
      vElt.setAttribute('width', '640');
      vElt.setAttribute('height', '480');
      vElt.setAttribute('playsinline', '');
      vElt.setAttribute('autoplay', '');
      vElt.muted = true;

      const playPromise = vElt.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.cameraReady = true;
          this.statusMessage = "Cámara lista. Cargando IA...";
        }).catch(err => {
          console.warn("Autoplay notice:", err);
          this.statusMessage = "Haz clic para activar cámara";
        });
      }
    }

    if (this.video) {
      this.video.width = 640;
      this.video.height = 480;
    }

    // Options for MoveNet in ml5 v1
    const options = {
      modelType: "SINGLEPOSE_LIGHTNING",
      enableSmoothing: true,
      minPoseScore: 0.20,
      flipped: true
    };

    try {
      if (typeof ml5 !== 'undefined' && ml5.bodyPose) {
        console.log("Iniciando ml5.bodyPose (MoveNet)...");
        this.statusMessage = "Cargando MoveNet AI...";

        let modelStarted = false;
        const onModelReady = (detector) => {
          if (modelStarted) return;
          modelStarted = true;
          this.isModelLoaded = true;
          this.statusMessage = "MoveNet cargado. Buscando cuerpo...";
          console.log("MoveNet cargado correctamente.");

          const activeDetector = detector || this.bodyPose;
          if (activeDetector && typeof activeDetector.detectStart === 'function') {
            // Guarantee dimensions on video before starting detection
            if (this.video && this.video.elt) {
              this.video.elt.width = 640;
              this.video.elt.height = 480;
            }

            activeDetector.detectStart(this.video, (results) => {
              this.poses = results || [];
              this.detectionCount++;
              if (this.poses.length > 0) {
                this.statusMessage = "Rastreo activo";
              } else {
                this.statusMessage = "Ponte frente a la cámara";
              }
            });
          }
        };

        const instance = ml5.bodyPose("MoveNet", options, () => {
          onModelReady(instance);
        });
        this.bodyPose = instance;

        // In ml5 v1, instance.ready is a Promise
        if (instance && instance.ready && typeof instance.ready.then === 'function') {
          instance.ready.then((readyModel) => {
            onModelReady(readyModel || instance);
          }).catch(err => {
            console.error("Error en instance.ready:", err);
            this.statusMessage = "Error cargando MoveNet";
          });
        }
      } else {
        console.warn("ml5.bodyPose no disponible, usando fallback.");
        this.statusMessage = "ml5.js no disponible";
      }
    } catch (err) {
      console.error("Error al inicializar MoveNet:", err);
      this.statusMessage = "Error al iniciar cámara/IA";
    }
  }

  startCalibration() {
    this.isCalibrating = true;
    this.calibrationSamples = [];
    this.calibrationTimer = 60; // 1 segundo a 60fps
    this.statusMessage = "Calibrando postura neutra...";
  }

  getKeypoint(pose, name) {
    if (!pose) return null;

    // 1. Direct property on pose object (e.g. pose.nose)
    if (pose[name] && typeof pose[name].x === 'number') {
      const conf = pose[name].confidence ?? pose[name].score ?? 1.0;
      if (conf > 0.08) {
        return pose[name];
      }
    }

    // 2. Search inside pose.keypoints array
    if (pose.keypoints && Array.isArray(pose.keypoints)) {
      const pt = pose.keypoints.find(k => k.name === name);
      if (pt && typeof pt.x === 'number') {
        const conf = pt.confidence ?? pt.score ?? 1.0;
        if (conf > 0.08) {
          return pt;
        }
      }
    }

    return null;
  }

  update() {
    if (this.punchCooldown > 0) {
      this.punchCooldown--;
    }
    this.lastPunchAction = null;

    // Ensure video element properties stay valid
    if (this.video && this.video.elt) {
      if (!this.video.elt.width || this.video.elt.width === 0) {
        this.video.elt.width = 640;
        this.video.elt.height = 480;
      }
    }

    if (!this.poses || this.poses.length === 0) {
      // Smooth decay to neutral if tracking is lost temporarily
      this.dodgeAmountX *= 0.85;
      this.duckAmountY *= 0.85;
      if (Math.abs(this.dodgeAmountX) < 0.05 && this.duckAmountY < 0.05) {
        this.currentAction = 'IDLE';
      }
      this.isBlocking = false;
      return;
    }

    const rawPose = this.poses[0];
    const keypointNames = [
      'nose', 'left_shoulder', 'right_shoulder',
      'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'
    ];

    // Smooth keypoints with Exponential Moving Average (EMA)
    const alpha = 0.65; // High responsiveness
    const currentFrame = {};

    for (let name of keypointNames) {
      const raw = this.getKeypoint(rawPose, name);
      if (raw) {
        if (!this.smoothed[name]) {
          this.smoothed[name] = { x: raw.x, y: raw.y, confidence: raw.confidence || 0.9 };
        } else {
          this.smoothed[name].x = this.smoothed[name].x * (1 - alpha) + raw.x * alpha;
          this.smoothed[name].y = this.smoothed[name].y * (1 - alpha) + raw.y * alpha;
          this.smoothed[name].confidence = raw.confidence || 0.9;
        }

        // Velocity calculation
        if (this.prevKeypoints[name]) {
          this.velocity[name] = {
            x: this.smoothed[name].x - this.prevKeypoints[name].x,
            y: this.smoothed[name].y - this.prevKeypoints[name].y
          };
        } else {
          this.velocity[name] = { x: 0, y: 0 };
        }

        currentFrame[name] = { x: this.smoothed[name].x, y: this.smoothed[name].y };
      } else if (this.smoothed[name]) {
        // Retain previous keypoint with zero velocity if lost for 1 frame
        this.velocity[name] = { x: 0, y: 0 };
        currentFrame[name] = { x: this.smoothed[name].x, y: this.smoothed[name].y };
      }
    }
    this.prevKeypoints = currentFrame;

    // Calibration processing
    const nose = this.smoothed['nose'];
    const lSh = this.smoothed['left_shoulder'];
    const rSh = this.smoothed['right_shoulder'];

    if (nose && lSh && rSh) {
      const span = Math.hypot(lSh.x - rSh.x, lSh.y - rSh.y);
      const shoulderY = (lSh.y + rSh.y) * 0.5;

      if (this.isCalibrating) {
        this.calibrationSamples.push({
          noseX: nose.x,
          noseY: nose.y,
          span: span,
          shoulderY: shoulderY
        });
        this.calibrationTimer--;

        if (this.calibrationTimer <= 0 && this.calibrationSamples.length > 20) {
          let sumX = 0, sumY = 0, sumSpan = 0, sumShY = 0;
          const count = this.calibrationSamples.length;
          for (let s of this.calibrationSamples) {
            sumX += s.noseX;
            sumY += s.noseY;
            sumSpan += s.span;
            sumShY += s.shoulderY;
          }
          this.neutralPose.noseX = sumX / count;
          this.neutralPose.noseY = sumY / count;
          this.neutralPose.shoulderSpan = Math.max(90, sumSpan / count);
          this.neutralPose.shoulderY = sumShY / count;

          this.isCalibrating = false;
          this.isCalibrated = true;
          this.statusMessage = "¡Calibrado exitosamente!";
          console.log("Calibración completada:", this.neutralPose);
        }
      } else if (!this.isCalibrated && this.calibrationSamples.length < 35) {
        // Initial soft auto-calibration
        this.calibrationSamples.push({
          noseX: nose.x,
          noseY: nose.y,
          span: span,
          shoulderY: shoulderY
        });
        if (this.calibrationSamples.length === 35) {
          let sumX = 0, sumY = 0, sumSpan = 0, sumShY = 0;
          for (let s of this.calibrationSamples) {
            sumX += s.noseX;
            sumY += s.noseY;
            sumSpan += s.span;
            sumShY += s.shoulderY;
          }
          this.neutralPose.noseX = sumX / 35;
          this.neutralPose.noseY = sumY / 35;
          this.neutralPose.shoulderSpan = Math.max(90, sumSpan / 35);
          this.neutralPose.shoulderY = sumShY / 35;
          this.isCalibrated = true;
          console.log("Postura inicial calibrada:", this.neutralPose);
        }
      }
    }

    // Classify Gestures
    this.classifyGestures();
  }

  classifyGestures() {
    const nose = this.smoothed['nose'];
    const lSh = this.smoothed['left_shoulder'];
    const rSh = this.smoothed['right_shoulder'];
    const lWr = this.smoothed['left_wrist'];
    const rWr = this.smoothed['right_wrist'];
    const span = Math.max(90, this.neutralPose.shoulderSpan || 150);

    if (!nose) {
      this.currentAction = 'IDLE';
      this.isBlocking = false;
      return;
    }

    // 1. Calculate Body Displacement relative to Neutral Stance
    const deltaX = (nose.x - this.neutralPose.noseX) / span;
    const deltaY = (nose.y - this.neutralPose.noseY) / span;

    // Smooth continuous amount (-1.5 to 1.5) for glove lean
    this.dodgeAmountX = Math.max(-1.5, Math.min(1.5, deltaX * 2.2));
    this.duckAmountY = Math.max(0, Math.min(1.5, deltaY * 2.4));

    // 2. Check Guard / Block
    // Both wrists raised in front of face/head level and close together
    let blocking = false;
    if (lWr && rWr && lSh && rSh) {
      const wristsDistance = Math.hypot(lWr.x - rWr.x, lWr.y - rWr.y);
      const wristsClose = wristsDistance < span * 0.70;
      const wristsUp = (lWr.y < lSh.y + span * 0.15) && (rWr.y < rSh.y + span * 0.15);
      const wristsNearFace = Math.abs((lWr.x + rWr.x) * 0.5 - nose.x) < span * 0.55;

      if (wristsClose && wristsUp && wristsNearFace) {
        blocking = true;
      }
    }
    this.isBlocking = blocking;

    // 3. Track Arm Extension for Punch Detection
    // When punching straight towards webcam (depth/Z movement), 2D distance between wrist and shoulder extends rapidly
    let lArmExt = 0;
    let rArmExt = 0;
    if (lWr && lSh) {
      lArmExt = Math.hypot(lWr.x - lSh.x, lWr.y - lSh.y) / span;
    }
    if (rWr && rSh) {
      rArmExt = Math.hypot(rWr.x - rSh.x, rWr.y - rSh.y) / span;
    }

    this.armExtensionVelocity.left = lArmExt - (this.prevArmExtension.left || lArmExt);
    this.armExtensionVelocity.right = rArmExt - (this.prevArmExtension.right || rArmExt);
    this.prevArmExtension.left = lArmExt;
    this.prevArmExtension.right = rArmExt;

    // 4. Punch Detection (Thrust velocity OR extension forward)
    if (this.punchCooldown === 0 && !this.isBlocking) {
      const lVel = this.velocity['left_wrist'] || { x: 0, y: 0 };
      const rVel = this.velocity['right_wrist'] || { x: 0, y: 0 };

      const lSpeed = Math.hypot(lVel.x, lVel.y);
      const rSpeed = Math.hypot(rVel.x, rVel.y);

      // Speed threshold adapted to body scale (~12-16px per frame at 60fps)
      const punchSpeedThreshold = span * 0.085;

      // Arm is extended or moving rapidly forward/upward
      const lExtended = lArmExt > 0.85 || this.armExtensionVelocity.left > 0.08;
      const rExtended = rArmExt > 0.85 || this.armExtensionVelocity.right > 0.08;

      const lThrust = (lSpeed > punchSpeedThreshold || this.armExtensionVelocity.left > 0.09) && (lWr && lSh && lWr.y < lSh.y + 40);
      const rThrust = (rSpeed > punchSpeedThreshold || this.armExtensionVelocity.right > 0.09) && (rWr && rSh && rWr.y < rSh.y + 40);

      // Check Super Punch (both fists thrusting simultaneously with high speed)
      if (lThrust && rThrust && (lSpeed + rSpeed > punchSpeedThreshold * 1.8 || (lExtended && rExtended))) {
        this.lastPunchAction = 'SUPER_PUNCH';
        this.punchCooldown = 18; // ~300ms cooldown
      } else if (lThrust && (lSpeed > rSpeed * 1.15 || this.armExtensionVelocity.left > 0.08)) {
        // Player's left fist (left side of mirrored screen)
        this.lastPunchAction = 'PUNCH_LEFT';
        this.punchCooldown = 11; // ~180ms cooldown
      } else if (rThrust && (rSpeed > lSpeed * 1.15 || this.armExtensionVelocity.right > 0.08)) {
        // Player's right fist (right side of mirrored screen)
        this.lastPunchAction = 'PUNCH_RIGHT';
        this.punchCooldown = 11;
      }
    }

    // 5. Dodge and Duck Classification
    if (this.isBlocking) {
      this.currentAction = 'BLOCK';
    } else if (deltaY > 0.22) {
      this.currentAction = 'DUCK';
    } else if (deltaX < -0.22) {
      this.currentAction = 'DODGE_LEFT';
    } else if (deltaX > 0.22) {
      this.currentAction = 'DODGE_RIGHT';
    } else {
      this.currentAction = 'IDLE';
    }
  }

  // Draw Camera Feeds & Skeleton Overlay in a stylish cyber arcade HUD
  drawHUD(p, x, y, w, h) {
    p.push();
    p.translate(x, y);

    // Border & Background
    p.stroke(0, 255, 204, 200);
    p.strokeWeight(2);
    p.fill(8, 16, 28, 235);
    p.rect(0, 0, w, h, 8);

    // Render Mirrored Video safely (only if video has loaded and readyState >= 2)
    const vElt = this.video && this.video.elt;
    if (vElt && vElt.readyState >= 2 && vElt.videoWidth > 0) {
      try {
        p.push();
        p.image(this.video, 4, 4, w - 8, h - 8);
        p.fill(0, 25, 35, 90); // Subtle cyber tint
        p.rect(4, 4, w - 8, h - 8);
        p.pop();
      } catch (err) {
        // Safe guard against canvas drawImage exceptions
      }
    } else {
      // Placeholder while camera initializes
      p.noStroke();
      p.fill(12, 22, 38);
      p.rect(4, 4, w - 8, h - 8);
      p.fill(0, 255, 204, 180);
      p.textAlign((p.CENTER || 'center'), (p.CENTER || 'center'));
      p.textSize(10);
      p.text("Conectando cámara...", w / 2, h / 2);
    }

    // Video coordinate scale to HUD box
    const vidW = (this.video && this.video.elt && this.video.elt.videoWidth) || (this.video && this.video.width) || 640;
    const vidH = (this.video && this.video.elt && this.video.elt.videoHeight) || (this.video && this.video.height) || 480;
    const scaleX = (w - 8) / vidW;
    const scaleY = (h - 8) / vidH;

    // Draw Neutral Stance Reticle (Target zone for center)
    if (this.isCalibrated) {
      const nx = 4 + this.neutralPose.noseX * scaleX;
      const ny = 4 + this.neutralPose.noseY * scaleY;
      const nSpan = this.neutralPose.shoulderSpan * scaleX;

      p.noFill();
      p.stroke(0, 255, 204, 110);
      p.strokeWeight(1.5);
      p.ellipse(nx, ny, nSpan * 0.7, nSpan * 0.9);
      p.line(nx - 10, ny, nx + 10, ny);
      p.line(nx, ny - 10, nx, ny + 10);
    }

    // Draw Skeleton Lines
    const connections = [
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist']
    ];

    p.stroke(0, 255, 240, 220);
    p.strokeWeight(2.5);
    for (let [p1, p2] of connections) {
      const pt1 = this.smoothed[p1];
      const pt2 = this.smoothed[p2];
      if (pt1 && pt2) {
        p.line(
          4 + pt1.x * scaleX, 4 + pt1.y * scaleY,
          4 + pt2.x * scaleX, 4 + pt2.y * scaleY
        );
      }
    }

    // Draw Keypoints
    for (let name in this.smoothed) {
      const pt = this.smoothed[name];
      if (pt) {
        const kx = 4 + pt.x * scaleX;
        const ky = 4 + pt.y * scaleY;

        if (name === 'left_wrist' || name === 'right_wrist') {
          // Boxing Glove Points (Red/Gold glow)
          p.fill(255, 50, 90);
          p.stroke(255, 255, 255);
          p.strokeWeight(2);
          p.circle(kx, ky, 12);
        } else if (name === 'nose') {
          p.fill(255, 220, 0);
          p.stroke(0);
          p.strokeWeight(1.5);
          p.circle(kx, ky, 9);
        } else {
          p.fill(0, 255, 200);
          p.noStroke();
          p.circle(kx, ky, 6);
        }
      }
    }

    // Top Bar: AI & Camera Status Badge
    p.noStroke();
    p.fill(0, 0, 0, 180);
    p.rect(0, 0, w, 22, 8, 8, 0, 0);

    p.textSize(10);
    p.textAlign((p.LEFT || 'left'), (p.CENTER || 'center'));
    if (this.poses && this.poses.length > 0) {
      p.fill(0, 255, 140);
      p.text("● RASTREO ACTIVO (MOVENET)", 8, 11);
    } else if (this.isModelLoaded) {
      p.fill(255, 220, 0);
      p.text("● BUSCANDO JUGADOR...", 8, 11);
    } else {
      p.fill(255, 80, 80);
      p.text("● CARGANDO IA...", 8, 11);
    }

    // Bottom Bar: Detected Action / Status Text
    p.noStroke();
    p.fill(0, 0, 0, 210);
    p.rect(0, h - 26, w, 26, 0, 0, 8, 8);

    p.textSize(11);
    p.textAlign((p.CENTER || 'center'), (p.CENTER || 'center'));

    let statusText = "ESTADO: " + this.currentAction;
    p.fill(255);

    if (this.isCalibrating) {
      statusText = "CALIBRANDO... QUÉDATE EN EL CENTRO";
      p.fill(255, 220, 0);
    } else if (this.lastPunchAction === 'SUPER_PUNCH') {
      statusText = "¡¡SUPER K.O. BLOW!!";
      p.fill(255, 60, 40);
    } else if (this.lastPunchAction === 'PUNCH_LEFT') {
      statusText = "🥊 GOLPE IZQUIERDO";
      p.fill(255, 100, 100);
    } else if (this.lastPunchAction === 'PUNCH_RIGHT') {
      statusText = "🥊 GOLPE DERECHO";
      p.fill(255, 100, 100);
    } else if (this.isBlocking) {
      statusText = "🛡️ ¡GUARDIA / BLOQUEO ACTIVO!";
      p.fill(100, 220, 255);
    } else if (this.currentAction === 'DODGE_LEFT') {
      statusText = "◀ ESQUIVA IZQUIERDA";
      p.fill(0, 255, 130);
    } else if (this.currentAction === 'DODGE_RIGHT') {
      statusText = "ESQUIVA DERECHA ▶";
      p.fill(0, 255, 130);
    } else if (this.currentAction === 'DUCK') {
      statusText = "▼ AGACHADO (DUCK) ▼";
      p.fill(255, 180, 0);
    } else if (this.poses.length === 0) {
      statusText = "PARATE FRENTE A LA CÁMARA";
      p.fill(200, 200, 200);
    }
    p.text(statusText, w / 2, h - 13);

    p.pop();
  }
}

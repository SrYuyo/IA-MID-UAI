/**
 * ============================================================================
 * ParticleSystem: Motor de Partículas Fluidas y Renderizado de Estelas
 * ============================================================================
 * Maneja la física de miles de partículas que navegan el campo vectorial.
 * Modula la cromática dinámicamente:
 * - MODO REPOSO: Tonos fríos meditativos (índigo, cian profundo, bioluminiscencia)
 * - PASO CALMO: Tonos aguamarina, esmeralda y turquesa
 * - PASO RÁPIDO: Tonos cálidos enérgicos (ámbar, coral, magenta, dorado)
 */

class Particle {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.reset(true);
  }

  reset(randomLife = false) {
    this.x = Math.random() * this.w;
    this.y = Math.random() * this.h;
    this.prevX = this.x;
    this.prevY = this.y;

    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;

    this.maxSpeed = 4.0 + Math.random() * 3.5;
    this.mass = 0.8 + Math.random() * 0.6;

    this.maxLife = 150 + Math.floor(Math.random() * 200);
    this.life = randomLife ? Math.floor(Math.random() * this.maxLife) : this.maxLife;

    this.size = 1.0 + Math.random() * 1.5;
    this.hue = 200;
  }

  update(fluidField, isIdle, motionIntensity) {
    // Decrementar vida
    this.life--;
    if (this.life <= 0) {
      this.reset(false);
      return;
    }

    this.prevX = this.x;
    this.prevY = this.y;

    // Muestrear el campo de fluidos
    const fluid = fluidField.sample(this.x, this.y, isIdle, motionIntensity);

    // Fuerza de arrastre del fluido
    const steeringFactor = 0.16 / this.mass;
    this.vx += (fluid.u * 1.8 - this.vx) * steeringFactor;
    this.vy += (fluid.v * 1.8 - this.vy) * steeringFactor;

    // Pequeño movimiento browniano para naturalidad orgánica
    this.vx += (Math.random() - 0.5) * 0.12;
    this.vy += (Math.random() - 0.5) * 0.12;

    // Limitar velocidad según dinamismo
    const curMaxSpeed = isIdle ? 2.5 : this.maxSpeed * (1.0 + motionIntensity * 0.8);
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > curMaxSpeed) {
      const scale = curMaxSpeed / speed;
      this.vx *= scale;
      this.vy *= scale;
    }

    // Actualizar posición
    this.x += this.vx;
    this.y += this.vy;

    // Envoltura toroidal suave en los bordes de pantalla
    if (this.x < 0) {
      this.x += this.w;
      this.prevX = this.x;
    } else if (this.x >= this.w) {
      this.x -= this.w;
      this.prevX = this.x;
    }

    if (this.y < 0) {
      this.y += this.h;
      this.prevY = this.y;
    } else if (this.y >= this.h) {
      this.y -= this.h;
      this.prevY = this.y;
    }

    // Modulación cromática según el diagrama:
    // - Reposo: 200 - 230 (Azul/Índigo meditativo)
    // - Paso lento: 165 - 210 (Esmeralda/Cian/Teal - Ondulación suave y tonos fríos)
    // - Paso rápido: 350 - 45 (Coral/Magenta/Ámbar/Dorado - Dispersión y tonos vivos)
    let targetHue = 210;
    if (isIdle) {
      targetHue = 215 + Math.sin(this.life * 0.03) * 15;
    } else {
      if (motionIntensity < 0.4) {
        // Paso lento / Calmo
        const factor = Math.min(1.0, Math.max(0.0, motionIntensity / 0.4));
        targetHue = 210 - factor * 45; // 210 (azul/cian) hasta 165 (turquesa/esmeralda)
      } else {
        // Paso rápido / Dinámico
        const warmFactor = Math.min(1.0, Math.max(0.0, (motionIntensity - 0.4) / 0.6));
        targetHue = (350 + warmFactor * 50) % 360; // 350 (coral/magenta) -> 40 (ámbar/dorado)
      }
    }

    // Interpolar tono de la partícula suavemente
    this.hue += (targetHue - this.hue) * 0.08;
  }

  draw(isIdle, motionIntensity) {
    const lifeRatio = this.life / this.maxLife;
    const fade = Math.sin(lifeRatio * Math.PI); // Entrada y salida suave

    // Cálculo de brillo y opacidad
    let alpha = fade * (isIdle ? 0.35 : 0.65 + motionIntensity * 0.3);
    let sat = isIdle ? 75 : 85 + motionIntensity * 15;
    let bri = isIdle ? 80 : 90 + motionIntensity * 10;

    stroke(this.hue, sat, bri, alpha);
    strokeWeight(this.size * (isIdle ? 1.0 : 1.0 + motionIntensity * 0.8));

    // Dibujar estela lineal fluida
    line(this.prevX, this.prevY, this.x, this.y);
  }
}

class ParticleSystem {
  constructor(count = 3500) {
    this.targetCount = count;
    this.particles = [];
    this.width = 0;
    this.height = 0;
  }

  init(w, h) {
    this.width = w;
    this.height = h;
    this.particles = [];
    this.adjustCount(this.targetCount);
  }

  setCount(newCount) {
    this.targetCount = newCount;
    this.adjustCount(newCount);
  }

  adjustCount(count) {
    while (this.particles.length < count) {
      this.particles.push(new Particle(this.width, this.height));
    }
    if (this.particles.length > count) {
      this.particles.length = count;
    }
  }

  update(fluidField, isIdle, motionIntensity) {
    const len = this.particles.length;
    for (let i = 0; i < len; i++) {
      this.particles[i].update(fluidField, isIdle, motionIntensity);
    }
  }

  draw(isIdle, motionIntensity) {
    push();
    colorMode(HSB, 360, 100, 100, 1.0);
    blendMode(ADD); // Resplandor aditivo luminoso para estética de proyección

    const len = this.particles.length;
    for (let i = 0; i < len; i++) {
      this.particles[i].draw(isIdle, motionIntensity);
    }
    pop();
  }

  respawnAround(x, y, count = 20, radius = 40) {
    // Inyecta partículas frescas cerca de la persona
    let respawned = 0;
    for (let i = 0; i < this.particles.length && respawned < count; i++) {
      if (this.particles[i].life < 30 || Math.random() < 0.05) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        this.particles[i].x = x + Math.cos(angle) * r;
        this.particles[i].y = y + Math.sin(angle) * r;
        this.particles[i].prevX = this.particles[i].x;
        this.particles[i].prevY = this.particles[i].y;
        this.particles[i].life = this.particles[i].maxLife;
        respawned++;
      }
    }
  }
}

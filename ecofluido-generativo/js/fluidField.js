/**
 * ============================================================================
 * FluidField: Campo Vectorial Bidimensional y Grilla Advectiva
 * ============================================================================
 * Implementa un modelo de flujo híbrido:
 * 1. MODO REPOSO: Flujo calmo y derivas lentas basado en ruido Perlin advectivo tridimensional.
 * 2. MODO ACTIVO: Inyección de momento, ondas de choque y turbulencia/vórtices al detectar
 *    pasos lentos o rápidos.
 */

class FluidField {
  constructor(resolution = 28) {
    this.resolution = resolution;
    this.cols = 0;
    this.rows = 0;
    this.width = 0;
    this.height = 0;

    // Vectores dinámicos inyectados por cuerpos
    this.u = []; // Velocidad horizontal
    this.v = []; // Velocidad vertical

    // Parámetros de ruido y atenuación
    this.noiseScale = 0.0035;
    this.timeScale = 0.0003;
    this.zOff = 0;
    this.decayRate = 0.94; // Disipación por frame
    this.baseFlowSpeed = 0.85; // Velocidad del flujo calmo en reposo
  }

  /**
   * Inicializa o redimensiona la grilla de vectores
   */
  init(w, h) {
    this.width = w;
    this.height = h;
    this.cols = Math.ceil(w / this.resolution) + 1;
    this.rows = Math.ceil(h / this.resolution) + 1;

    const totalCells = this.cols * this.rows;
    this.u = new Float32Array(totalCells);
    this.v = new Float32Array(totalCells);
  }

  /**
   * Actualiza el campo de fluidos en cada fotograma
   * @param {number} motionIntensity - Intensidad global actual (0.0 a 1.0)
   * @param {boolean} isIdle - Verdadero si no se detectan cuerpos
   */
  update(motionIntensity = 0, isIdle = true) {
    // Avanzar tiempo del ruido Perlin más lentamente en reposo
    const tSpeed = isIdle ? this.timeScale : this.timeScale * (1.0 + motionIntensity * 1.5);
    this.zOff += tSpeed;

    // Amortiguar el momento inyectado (disipación viscosa)
    const decay = this.decayRate;
    const total = this.cols * this.rows;
    for (let i = 0; i < total; i++) {
      this.u[i] *= decay;
      this.v[i] *= decay;
    }
  }

  /**
   * Inyecta una fuerza/impulso desde una posición corporal
   * @param {number} x - Posición X en píxeles del lienzo
   * @param {number} y - Posición Y en píxeles del lienzo
   * @param {number} dx - Componente X del vector de velocidad del cuerpo
   * @param {number} dy - Componente Y del vector de velocidad del cuerpo
   * @param {number} radius - Radio de afectación física
   * @param {number} strength - Magnitud de la fuerza inyectada
   * @param {number} vorticity - Factor de turbulencia/vórtice (0 para calmo, alto para dinámico)
   */
  injectForce(x, y, dx, dy, radius = 120, strength = 1.0, vorticity = 0.0) {
    const minCol = Math.max(0, Math.floor((x - radius) / this.resolution));
    const maxCol = Math.min(this.cols - 1, Math.ceil((x + radius) / this.resolution));
    const minRow = Math.max(0, Math.floor((y - radius) / this.resolution));
    const maxRow = Math.min(this.rows - 1, Math.ceil((y + radius) / this.resolution));

    const radiusSq = radius * radius;

    for (let c = minCol; c <= maxCol; c++) {
      const cellX = c * this.resolution;
      for (let r = minRow; r <= maxRow; r++) {
        const cellY = r * this.resolution;
        const distSq = (cellX - x) * (cellX - x) + (cellY - y) * (cellY - y);

        if (distSq < radiusSq) {
          const dist = Math.sqrt(distSq);
          // Caída cúbica suave (Hermite falloff)
          const factor = (1.0 - dist / radius);
          const falloff = factor * factor * (3.0 - 2.0 * factor) * strength;

          const idx = c + r * this.cols;

          // Impulso direccional del cuerpo
          let fx = dx * falloff;
          let fy = dy * falloff;

          // Inyección de turbulencia y vórtices para paso rápido/dinámico
          if (vorticity > 0.01 && dist > 1.0) {
            // Vector tangencial perpendicular para generar remolino
            const nx = (cellX - x) / dist;
            const ny = (cellY - y) / dist;
            const swirlStrength = vorticity * falloff * 2.5;

            // Remolino perpendicular (-ny, nx)
            fx += -ny * swirlStrength;
            fy += nx * swirlStrength;
          }

          this.u[idx] += fx;
          this.v[idx] += fy;
        }
      }
    }
  }

  /**
   * Consulta el vector resultante en cualquier punto (x, y) del espacio continuo
   * Combina el flujo orgánico en reposo con el momento inyectado
   */
  sample(x, y, isIdle = true, motionIntensity = 0.0) {
    // Coordenadas en la grilla
    const gx = x / this.resolution;
    const gy = y / this.resolution;

    const c0 = Math.floor(gx);
    const r0 = Math.floor(gy);
    const fx = gx - c0;
    const fy = gy - r0;

    // Interpolación bilineal de las fuerzas inyectadas
    const c1 = Math.min(this.cols - 1, Math.max(0, c0 + 1));
    const r1 = Math.min(this.rows - 1, Math.max(0, r0 + 1));

    const c0_clamped = Math.min(this.cols - 1, Math.max(0, c0));
    const r0_clamped = Math.min(this.rows - 1, Math.max(0, r0));

    const i00 = c0_clamped + r0_clamped * this.cols;
    const i10 = c1 + r0_clamped * this.cols;
    const i01 = c0_clamped + r1 * this.cols;
    const i11 = c1 + r1 * this.cols;

    const u0 = this.u[i00] * (1 - fx) + this.u[i10] * fx;
    const u1 = this.u[i01] * (1 - fx) + this.u[i11] * fx;
    const injU = u0 * (1 - fy) + u1 * fy;

    const v0 = this.v[i00] * (1 - fx) + this.v[i10] * fx;
    const v1 = this.v[i01] * (1 - fx) + this.v[i11] * fx;
    const injV = v0 * (1 - fy) + v1 * fy;

    // Flujo calmo de base: Ruido Perlin orgánico (Modo Reposo o corriente subyacente)
    const angle = noise(x * this.noiseScale, y * this.noiseScale, this.zOff) * Math.PI * 4;
    const baseSpeed = isIdle ? this.baseFlowSpeed : this.baseFlowSpeed * 0.7;

    const baseU = Math.cos(angle) * baseSpeed;
    const baseV = Math.sin(angle) * baseSpeed;

    return {
      u: baseU + injU,
      v: baseV + injV,
      injectedMag: Math.sqrt(injU * injU + injV * injV)
    };
  }

  /**
   * Limpia todas las fuerzas inyectadas
   */
  clear() {
    this.u.fill(0);
    this.v.fill(0);
  }
}

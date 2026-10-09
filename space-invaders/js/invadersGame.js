/**
 * ============================================================================
 * InvadersGame: Motor de Juego, Enemigos, Escudos y Física de Space Invaders
 * ============================================================================
 * Recrea fielmente el clásico de Taito (1978):
 * - Enjambre de 55 alienígenas (Calamar, Cangrejo, Pulpo) con sprites de 2 cuadros
 * - Aceleración progresiva de marcha alienígena
 * - 4 búnkeres defensivos con destrucción por píxeles
 * - Platillo volante OVNI misterioso
 * - Modo cooperativo para 2 jugadores simultáneos
 */

class InvadersGame {
  constructor(audio) {
    this.audio = audio;
    this.w = 800;
    this.h = 600;

    this.score1 = 0;
    this.score2 = 0;
    this.hiScore = 9990;
    this.lives1 = 3;
    this.lives2 = 3;
    this.wave = 1;

    // Cañones de los jugadores
    this.cannonW = 26;
    this.cannonH = 16;
    this.p1X = this.w * 0.3;
    this.p2X = this.w * 0.7;
    this.cannonY = this.h - 44;

    this.p1Lasers = [];
    this.p2Lasers = [];
    this.alienMissiles = [];

    // Enjambre de Invasores
    this.invaders = [];
    this.invaderRows = 5;
    this.invaderCols = 11;
    this.invaderDir = 1; // 1 = der, -1 = izq
    this.invaderStepX = 8;
    this.invaderDropY = 16;
    this.invaderAnimFrame = 0;
    this.marchTimer = 0;
    this.marchInterval = 44; // Se acelera progresivamente

    // Búnkeres de defensa
    this.bunkers = [];

    // OVNI
    this.ufo = null;
    this.ufoTimer = 0;

    // Estado del juego
    this.state = 'PLAY'; // 'PLAY', 'PLAYER_DEAD', 'GAME_OVER', 'WAVE_CLEAR'
    this.deathTimer = 0;
    this.initWave();
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
    this.cannonY = this.h - 44;
  }

  initWave() {
    this.invaders = [];
    const startX = 60;
    const startY = 85 + Math.min(6, this.wave - 1) * 12; // Cada oleada bajan un poco más

    for (let r = 0; r < this.invaderRows; r++) {
      for (let c = 0; c < this.invaderCols; c++) {
        let type = 'squid'; // 30 pts
        let pts = 30;
        if (r === 1 || r === 2) {
          type = 'crab'; // 20 pts
          pts = 20;
        } else if (r >= 3) {
          type = 'octopus'; // 10 pts
          pts = 10;
        }

        this.invaders.push({
          x: startX + c * 38,
          y: startY + r * 30,
          w: 24,
          h: 18,
          type: type,
          points: pts,
          alive: true
        });
      }
    }

    this.invaderDir = 1;
    this.marchInterval = 44;
    this.marchTimer = this.marchInterval;
    this.alienMissiles = [];
    this.p1Lasers = [];
    this.p2Lasers = [];

    this.initBunkers();
  }

  initBunkers() {
    this.bunkers = [];
    const bunkerCount = 4;
    const spacing = this.w / (bunkerCount + 1);

    for (let b = 0; b < bunkerCount; b++) {
      const bx = spacing * (b + 1) - 24;
      const by = this.cannonY - 55;
      const blocks = [];

      // Estructura de bloques 6x4 para cada búnker
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          // Hueco del arco inferior del búnker
          if (r === 3 && (c === 2 || c === 3)) continue;
          // Esquinas biseladas superiores
          if (r === 0 && (c === 0 || c === 5)) continue;

          blocks.push({
            x: bx + c * 8,
            y: by + r * 8,
            w: 8,
            h: 8,
            health: 3
          });
        }
      }

      this.bunkers.push(blocks);
    }
  }

  update(p1TargetX, p1Shoot, p2TargetX, p2Shoot, is2P) {
    if (this.state === 'GAME_OVER') return;

    if (this.state === 'PLAYER_DEAD') {
      this.deathTimer--;
      if (this.deathTimer <= 0) {
        if (this.lives1 <= 0 && (!is2P || this.lives2 <= 0)) {
          this.state = 'GAME_OVER';
        } else {
          this.state = 'PLAY';
        }
      }
      return;
    }

    // 1. Mover Cañón P1
    if (p1TargetX !== null) {
      this.p1X += (p1TargetX - this.p1X) * 0.35;
      this.p1X = Math.max(20, Math.min(this.w - 20 - this.cannonW, this.p1X));
    }

    // Disparo P1 (1 láser activo por recarga)
    if (p1Shoot && this.p1Lasers.length === 0 && this.lives1 > 0) {
      this.p1Lasers.push({ x: this.p1X + this.cannonW / 2 - 2, y: this.cannonY - 8, vy: -9 });
      if (this.audio) this.audio.playShoot();
    }

    // 2. Mover Cañón P2 si está en cooperativo
    if (is2P) {
      if (p2TargetX !== null) {
        this.p2X += (p2TargetX - this.p2X) * 0.35;
        this.p2X = Math.max(20, Math.min(this.w - 20 - this.cannonW, this.p2X));
      }

      if (p2Shoot && this.p2Lasers.length === 0 && this.lives2 > 0) {
        this.p2Lasers.push({ x: this.p2X + this.cannonW / 2 - 2, y: this.cannonY - 8, vy: -9 });
        if (this.audio) this.audio.playShoot();
      }
    }

    // 3. Actualizar Láseres de Jugadores
    this.updatePlayerLasers(this.p1Lasers, 1);
    if (is2P) this.updatePlayerLasers(this.p2Lasers, 2);

    // 4. Actualizar Marcha de Alienígenas
    this.updateAlienMarch();

    // 5. Misiles Alienígenas
    this.updateAlienMissiles(is2P);

    // 6. Platillo OVNI
    this.updateUFO();

    // 7. Verificar si se limpió la oleada
    const aliveCount = this.invaders.filter(inv => inv.alive).length;
    if (aliveCount === 0) {
      this.wave++;
      this.initWave();
    }
  }

  updatePlayerLasers(lasers, playerNum) {
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.y += l.vy;

      // Colisión con Alienígenas
      let hit = false;
      for (let inv of this.invaders) {
        if (inv.alive && l.x >= inv.x && l.x <= inv.x + inv.w && l.y >= inv.y && l.y <= inv.y + inv.h) {
          inv.alive = false;
          hit = true;
          if (playerNum === 1) this.score1 += inv.points;
          else this.score2 += inv.points;
          if (this.score1 > this.hiScore) this.hiScore = this.score1;
          if (this.score2 > this.hiScore) this.hiScore = this.score2;

          if (this.audio) this.audio.playInvaderKilled();
          break;
        }
      }

      // Colisión con OVNI
      if (!hit && this.ufo && l.x >= this.ufo.x && l.x <= this.ufo.x + this.ufo.w && l.y >= this.ufo.y && l.y <= this.ufo.y + this.ufo.h) {
        if (playerNum === 1) this.score1 += this.ufo.points;
        else this.score2 += this.ufo.points;
        this.ufo = null;
        hit = true;
        if (this.audio) {
          this.audio.stopUfoSound();
          this.audio.playInvaderKilled();
        }
      }

      // Colisión con Búnkeres
      if (!hit) {
        hit = this.checkBunkerCollision(l.x, l.y, true);
      }

      if (hit || l.y < 40) {
        lasers.splice(i, 1);
      }
    }
  }

  updateAlienMarch() {
    this.marchTimer--;
    if (this.marchTimer <= 0) {
      const aliveInvaders = this.invaders.filter(inv => inv.alive);
      const aliveCount = aliveInvaders.length;
      if (aliveCount === 0) return;

      // Acelerar intervalo: 55 aliens = 44 frames, 1 alien = 4 frames
      this.marchInterval = Math.max(3, Math.floor(aliveCount * 0.75));
      this.marchTimer = this.marchInterval;
      this.invaderAnimFrame = (this.invaderAnimFrame === 0) ? 1 : 0;

      if (this.audio) this.audio.playMarchStep();

      // Comprobar si golpea el borde
      let hitEdge = false;
      for (let inv of aliveInvaders) {
        if (this.invaderDir === 1 && inv.x + inv.w >= this.w - 30) hitEdge = true;
        if (this.invaderDir === -1 && inv.x <= 30) hitEdge = true;
      }

      if (hitEdge) {
        this.invaderDir *= -1;
        for (let inv of aliveInvaders) {
          inv.y += this.invaderDropY;
          // Si los invasores tocan los búnkeres o la base -> Fin del juego
          if (inv.y + inv.h >= this.cannonY) {
            this.state = 'GAME_OVER';
          }
        }
      } else {
        for (let inv of aliveInvaders) {
          inv.x += this.invaderDir * this.invaderStepX;
        }
      }

      // Disparo aleatorio desde alienígenas inferiores
      if (Math.random() < 0.45 && this.alienMissiles.length < 3 + Math.floor(this.wave * 0.5)) {
        const randomInv = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
        if (randomInv) {
          this.alienMissiles.push({ x: randomInv.x + randomInv.w / 2, y: randomInv.y + randomInv.h, vy: 4.2 });
        }
      }
    }
  }

  updateAlienMissiles(is2P) {
    for (let i = this.alienMissiles.length - 1; i >= 0; i--) {
      const m = this.alienMissiles[i];
      m.y += m.vy;

      let destroyed = false;

      // Colisión con Búnkeres
      destroyed = this.checkBunkerCollision(m.x, m.y, false);

      // Colisión con Jugador 1
      if (!destroyed && this.lives1 > 0 &&
          m.x >= this.p1X && m.x <= this.p1X + this.cannonW &&
          m.y >= this.cannonY && m.y <= this.cannonY + this.cannonH) {
        this.lives1--;
        destroyed = true;
        this.triggerPlayerDeath();
      }

      // Colisión con Jugador 2
      if (!destroyed && is2P && this.lives2 > 0 &&
          m.x >= this.p2X && m.x <= this.p2X + this.cannonW &&
          m.y >= this.cannonY && m.y <= this.cannonY + this.cannonH) {
        this.lives2--;
        destroyed = true;
        this.triggerPlayerDeath();
      }

      if (destroyed || m.y > this.h - 15) {
        this.alienMissiles.splice(i, 1);
      }
    }
  }

  triggerPlayerDeath() {
    this.state = 'PLAYER_DEAD';
    this.deathTimer = 60;
    if (this.audio) this.audio.playPlayerExplosion();
  }

  checkBunkerCollision(x, y, fromBottom = true) {
    for (let b of this.bunkers) {
      for (let i = b.length - 1; i >= 0; i--) {
        const blk = b[i];
        if (x >= blk.x && x <= blk.x + blk.w && y >= blk.y && y <= blk.y + blk.h) {
          blk.health--;
          if (blk.health <= 0) {
            b.splice(i, 1);
          }
          return true;
        }
      }
    }
    return false;
  }

  updateUFO() {
    this.ufoTimer++;
    if (!this.ufo && this.ufoTimer > 600 && Math.random() < 0.008) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      this.ufo = {
        x: dir === 1 ? -40 : this.w + 10,
        y: 48,
        w: 36,
        h: 14,
        vx: dir * 2.8,
        points: [50, 100, 150, 300][Math.floor(Math.random() * 4)]
      };
      if (this.audio) this.audio.startUfoSound();
    }

    if (this.ufo) {
      this.ufo.x += this.ufo.vx;
      if (this.ufo.x < -50 || this.ufo.x > this.w + 50) {
        this.ufo = null;
        this.ufoTimer = 0;
        if (this.audio) this.audio.stopUfoSound();
      }
    }
  }

  draw(is2P) {
    background(0);

    // 1. Marcador Superior Estilo 1978 (SCORE<1>  HI-SCORE  SCORE<2>)
    this.drawHeader(is2P);

    // 2. Dibujar Alienígenas
    for (let inv of this.invaders) {
      if (inv.alive) {
        this.drawInvaderSprite(inv.type, inv.x, inv.y, this.invaderAnimFrame);
      }
    }

    // 3. Dibujar Búnkeres de Defensa (Verde clásico)
    fill(0, 255, 100);
    noStroke();
    for (let b of this.bunkers) {
      for (let blk of b) {
        const alpha = blk.health === 3 ? 255 : (blk.health === 2 ? 180 : 100);
        fill(0, 255, 100, alpha);
        rect(blk.x, blk.y, blk.w, blk.h);
      }
    }

    // 4. Dibujar Cañones de los Jugadores
    if (this.lives1 > 0) {
      fill(0, 255, 100);
      this.drawCannon(this.p1X, this.cannonY);
    }
    if (is2P && this.lives2 > 0) {
      fill(0, 229, 255); // Azul cyan para P2
      this.drawCannon(this.p2X, this.cannonY);
    }

    // 5. Dibujar Láseres y Misiles
    fill(255);
    for (let l of this.p1Lasers) rect(l.x, l.y, 3, 10);
    fill(0, 229, 255);
    for (let l of this.p2Lasers) rect(l.x, l.y, 3, 10);

    // Misiles alienígenas (en zigzag)
    fill(255, 230, 0);
    for (let m of this.alienMissiles) {
      rect(m.x - 1, m.y, 3, 8);
      rect(m.x - (frameCount % 4 < 2 ? 2 : -2), m.y + 4, 3, 3);
    }

    // 6. Dibujar OVNI (Rojo Taito)
    if (this.ufo) {
      this.drawUfoSprite(this.ufo.x, this.ufo.y);
    }

    // 7. Barra Inferior con Vidas y Línea Verde
    stroke(0, 255, 100);
    strokeWeight(2);
    line(0, this.h - 18, this.w, this.h - 18);

    noStroke();
    fill(255);
    textFont('Press Start 2P');
    textSize(10);
    text(`${this.lives1}`, 16, this.h - 6);
    fill(0, 255, 100);
    for (let i = 0; i < this.lives1 - 1; i++) {
      this.drawCannon(36 + i * 28, this.h - 14, 0.65);
    }

    if (is2P) {
      fill(0, 229, 255);
      text(`P2:${this.lives2}`, this.w - 120, this.h - 6);
    }

    // Cartel Game Over
    if (this.state === 'GAME_OVER') {
      textAlign(CENTER, CENTER);
      fill(255, 30, 60);
      textSize(28);
      text("GAME OVER", this.w / 2, this.h / 2 - 20);
      fill(255);
      textSize(12);
      text("PRESIONA [R] PARA REINTENTAR", this.w / 2, this.h / 2 + 25);
    }
  }

  drawHeader(is2P) {
    textFont('Press Start 2P');
    textSize(11);
    textAlign(LEFT, TOP);
    fill(255);
    text("SCORE<1>", 30, 15);
    text("HI-SCORE", this.w / 2 - 45, 15);
    if (is2P) text("SCORE<2>", this.w - 130, 15);

    fill(0, 255, 100);
    text(`${String(this.score1).padStart(4, '0')}`, 45, 30);
    fill(255);
    text(`${String(this.hiScore).padStart(4, '0')}`, this.w / 2 - 25, 30);
    if (is2P) {
      fill(0, 229, 255);
      text(`${String(this.score2).padStart(4, '0')}`, this.w - 110, 30);
    }
  }

  drawCannon(x, y, scale = 1.0) {
    const s = scale;
    noStroke();
    rect(x, y + 8 * s, 26 * s, 8 * s);
    rect(x + 2 * s, y + 4 * s, 22 * s, 4 * s);
    rect(x + 11 * s, y, 4 * s, 4 * s);
  }

  drawInvaderSprite(type, x, y, frame) {
    noStroke();
    fill(245);
    const s = 2; // pixel scale

    if (type === 'squid') {
      // 30 Pts Calamar (8x8)
      const bits = frame === 0 ? [
        "00011000",
        "00111100",
        "01111110",
        "11011011",
        "11111111",
        "00100100",
        "01011010",
        "10100101"
      ] : [
        "00011000",
        "00111100",
        "01111110",
        "11011011",
        "11111111",
        "01011010",
        "10000001",
        "01000010"
      ];
      this.renderMatrix(bits, x, y, s);

    } else if (type === 'crab') {
      // 20 Pts Cangrejo (11x8)
      const bits = frame === 0 ? [
        "00100000100",
        "00010001000",
        "00111111100",
        "01101110110",
        "11111111111",
        "10111111101",
        "10100000101",
        "00011011000"
      ] : [
        "00100000100",
        "10010001001",
        "10111111101",
        "11101110111",
        "11111111111",
        "01111111110",
        "00100000100",
        "01000000010"
      ];
      this.renderMatrix(bits, x, y, s);

    } else {
      // 10 Pts Pulpo (12x8)
      const bits = frame === 0 ? [
        "000011110000",
        "011111111110",
        "111111111111",
        "111001100111",
        "111111111111",
        "000110011000",
        "001101101100",
        "110000000011"
      ] : [
        "000011110000",
        "011111111110",
        "111111111111",
        "111001100111",
        "111111111111",
        "001100001100",
        "011011110110",
        "000100001000"
      ];
      this.renderMatrix(bits, x, y, s);
    }
  }

  drawUfoSprite(x, y) {
    fill(255, 30, 60);
    const bits = [
      "000111111000",
      "011111111110",
      "111111111111",
      "110110011011",
      "111111111111",
      "001110011100",
      "000100001000"
    ];
    this.renderMatrix(bits, x, y, 2);
  }

  renderMatrix(matrix, x, y, s) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] === '1') {
          rect(x + c * s, y + r * s, s, s);
        }
      }
    }
  }
}

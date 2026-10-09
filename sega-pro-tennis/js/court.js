/**
 * ============================================================================
 * TennisCourt: Proyección 2.5D y Pista de Tenis Arcade SEGA
 * ============================================================================
 * Modela la pista en coordenadas de mundo y proyecta a perspectiva arcade:
 * - Coordenadas mundo:
 *   X: [-width/2, width/2] (Izquierda a Derecha)
 *   Y: [0, length] (0 = Línea de fondo P1, length/2 = Red, length = Línea de fondo P2)
 *   Z: Altura (0 = Suelo)
 */

class TennisCourt {
  constructor() {
    this.width = 460;        // Ancho total de individuales en mundo
    this.length = 740;       // Longitud de fondo a fondo
    this.netY = this.length / 2; // Posición Y de la red
    this.netHeight = 52;     // Altura de la red en mundo

    // Parámetros de cámara perspectiva estilo Virtua Tennis
    this.camY = -180;
    this.camHeight = 280;
    this.fov = 340;
    this.screenHorizon = 0;
  }

  /**
   * Convierte coordenadas 3D del mundo (x, y, z) a coordenadas de pantalla (sx, sy, scale)
   */
  project(x, y, z = 0, screenW, screenH) {
    const depth = y - this.camY;
    if (depth <= 1) return { x: screenW / 2, y: screenH / 2, scale: 0.1 };

    const scale = this.fov / depth;
    const sx = screenW / 2 + x * scale;
    const sy = this.screenHorizon + (this.camHeight - z) * scale;

    return { x: sx, y: sy, scale: scale };
  }

  updateDimensions(screenW, screenH) {
    this.screenHorizon = screenH * 0.28;
  }

  draw(screenW, screenH) {
    this.updateDimensions(screenW, screenH);

    push();
    // 1. Estadio y Gradas SEGA Arcade
    this.drawStadium(screenW, screenH);

    // 2. Superficie exterior de la pista
    const pOutTL = this.project(-this.width * 0.8, this.length * 1.15, 0, screenW, screenH);
    const pOutTR = this.project(this.width * 0.8, this.length * 1.15, 0, screenW, screenH);
    const pOutBR = this.project(this.width * 0.95, -this.length * 0.12, 0, screenW, screenH);
    const pOutBL = this.project(-this.width * 0.95, -this.length * 0.12, 0, screenW, screenH);

    noStroke();
    fill(18, 55, 95); // Azul exterior estadio
    quad(pOutTL.x, pOutTL.y, pOutTR.x, pOutTR.y, pOutBR.x, pOutBR.y, pOutBL.x, pOutBL.y);

    // 3. Pista Principal (Azul Hard Court clásico)
    const pTL = this.project(-this.width / 2, this.length, 0, screenW, screenH);
    const pTR = this.project(this.width / 2, this.length, 0, screenW, screenH);
    const pBR = this.project(this.width / 2, 0, 0, screenW, screenH);
    const pBL = this.project(-this.width / 2, 0, 0, screenW, screenH);

    fill(24, 88, 158); // Azul cancha interior
    quad(pTL.x, pTL.y, pTR.x, pTR.y, pBR.x, pBR.y, pBL.x, pBL.y);

    // 4. Líneas Reglamentarias Blancas
    stroke(255, 255, 255, 230);
    strokeWeight(3);

    // Perímetro de individuales
    line(pTL.x, pTL.y, pTR.x, pTR.y);
    line(pTR.x, pTR.y, pBR.x, pBR.y);
    line(pBR.x, pBR.y, pBL.x, pBL.y);
    line(pBL.x, pBL.y, pTL.x, pTL.y);

    // Líneas de saque (Service lines: Y = netY - 140 y Y = netY + 140)
    const sBoxDist = 145;
    const pSL1_L = this.project(-this.width / 2, this.netY - sBoxDist, 0, screenW, screenH);
    const pSL1_R = this.project(this.width / 2, this.netY - sBoxDist, 0, screenW, screenH);
    line(pSL1_L.x, pSL1_L.y, pSL1_R.x, pSL1_R.y);

    const pSL2_L = this.project(-this.width / 2, this.netY + sBoxDist, 0, screenW, screenH);
    const pSL2_R = this.project(this.width / 2, this.netY + sBoxDist, 0, screenW, screenH);
    line(pSL2_L.x, pSL2_L.y, pSL2_R.x, pSL2_R.y);

    // Línea central de saque
    const pC_Near = this.project(0, this.netY - sBoxDist, 0, screenW, screenH);
    const pC_Far = this.project(0, this.netY + sBoxDist, 0, screenW, screenH);
    line(pC_Near.x, pC_Near.y, pC_Far.x, pC_Far.y);

    // Marca central de fondo
    const pBM_N1 = this.project(0, 0, 0, screenW, screenH);
    const pBM_N2 = this.project(0, 22, 0, screenW, screenH);
    line(pBM_N1.x, pBM_N1.y, pBM_N2.x, pBM_N2.y);

    const pBM_F1 = this.project(0, this.length, 0, screenW, screenH);
    const pBM_F2 = this.project(0, this.length - 22, 0, screenW, screenH);
    line(pBM_F1.x, pBM_F1.y, pBM_F2.x, pBM_F2.y);

    // 5. Red 3D con postes
    this.drawNet(screenW, screenH);
    pop();
  }

  drawStadium(screenW, screenH) {
    // Fondo de gradas oscuras con público pixelado y carteles SEGA
    fill(10, 16, 28);
    rect(0, 0, screenW, this.screenHorizon + 25);

    // Público con animación sutil de parpadeo de color
    for (let i = 0; i < 40; i++) {
      const rx = (i / 40) * screenW + Math.sin(frameCount * 0.05 + i) * 2;
      const ry = this.screenHorizon * 0.5 + (i % 3) * 12;
      fill(i % 2 === 0 ? '#ffb347' : '#00d2ff');
      circle(rx, ry, 6);
    }

    // Vallas publicitarias estilo arcade 90s
    const bannerY = this.screenHorizon * 0.72;
    fill(0, 60, 160);
    rect(0, bannerY, screenW, 26);
    stroke(255, 230, 0);
    strokeWeight(1.5);
    line(0, bannerY, screenW, bannerY);
    line(0, bannerY + 26, screenW, bannerY + 26);

    fill(255, 230, 0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(11);
    textFont('sans-serif');
    const brands = ["SEGA", "VIRTUA", "UAI ARCADE", "MOVE NET", "GRAND SLAM"];
    for (let b = 0; b < brands.length; b++) {
      text(brands[b], (b + 0.5) * (screenW / brands.length), bannerY + 13);
    }
  }

  drawNet(screenW, screenH) {
    const netExtWidth = this.width * 0.58;

    // Postes laterales
    const pNetBL = this.project(-netExtWidth, this.netY, 0, screenW, screenH);
    const pNetTL = this.project(-netExtWidth, this.netY, this.netHeight, screenW, screenH);
    const pNetBR = this.project(netExtWidth, this.netY, 0, screenW, screenH);
    const pNetTR = this.project(netExtWidth, this.netY, this.netHeight, screenW, screenH);

    // Malla de la red (Semitransparente)
    fill(255, 255, 255, 60);
    noStroke();
    quad(pNetTL.x, pNetTL.y, pNetTR.x, pNetTR.y, pNetBR.x, pNetBR.y, pNetBL.x, pNetBL.y);

    // Cordón superior blanco de la red
    stroke(255);
    strokeWeight(3.5);
    line(pNetTL.x, pNetTL.y, pNetTR.x, pNetTR.y);

    // Base de la red
    stroke(255, 255, 255, 120);
    strokeWeight(1.5);
    line(pNetBL.x, pNetBL.y, pNetBR.x, pNetBR.y);

    // Postes físicos
    stroke(40, 40, 40);
    strokeWeight(5);
    line(pNetBL.x, pNetBL.y, pNetTL.x, pNetTL.y);
    line(pNetBR.x, pNetBR.y, pNetTR.x, pNetTR.y);
  }

  /**
   * Comprueba si una posición está dentro de los límites válidos de la pista
   */
  isInsideSingles(x, y) {
    return Math.abs(x) <= this.width / 2 && y >= 0 && y <= this.length;
  }

  /**
   * Comprueba si la pelota aterriza en el cuadro de saque correcto
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {boolean} isServerP1 - ¿El sacador es P1?
   * @param {string} courtSide - 'right' (Deuce court) o 'left' (Ad court)
   */
  isInsideServiceBox(x, y, isServerP1, courtSide) {
    const sBoxDist = 145;
    if (isServerP1) {
      // P1 saca hacia la mitad de P2 (Y entre netY y netY + sBoxDist)
      const validY = y >= this.netY && y <= this.netY + sBoxDist;
      const validX = (courtSide === 'right') ? (x <= 0 && x >= -this.width / 2) : (x >= 0 && x <= this.width / 2);
      return validX && validY;
    } else {
      // P2 saca hacia la mitad de P1 (Y entre netY - sBoxDist y netY)
      const validY = y <= this.netY && y >= this.netY - sBoxDist;
      const validX = (courtSide === 'right') ? (x >= 0 && x <= this.width / 2) : (x <= 0 && x >= -this.width / 2);
      return validX && validY;
    }
  }
}

# SPACE INVADERS (1978) - Hand & Vision Arcade Edition

Recreación fiel del revolucionario clásico arcade de **Taito (1978)**, diseñado e implementado según la arquitectura establecida en el **tablero grupal de Miro ("Space Invaders con la mano")**, integrando **visión por computadora en tiempo real (`ml5.js / MoveNet`)**, **audio analógico con Web Audio API** y **modo cooperativo para 2 jugadores**.

---

## 👾 Características Principales

### 1. Control Gestual con la Mano (Especificación Miro)
- **🖐️ Movimiento del Cañón (Eje X)**:
  - Desplaza tu mano en el aire frente a la cámara web. El cañón defensor sigue la posición horizontal de tu mano con total fluidez.
- **⚡ Disparo Láser**:
  - Un movimiento ascendente rápido de la muñeca (gesto de percusión o "gatillo") dispara el láser inmediatamente.
  - También puedes disparar elevando la mano por encima de los hombros.
- **👤 Modo Alternativo Torso / Cabeza**:
  - Inclina tu cuerpo a la izquierda o derecha para mover el cañón; eleva tu brazo para disparar.
- **⌨️ Teclado (Respaldo)**:
  - **Jugador 1**: `[A]` y `[D]` (o flechas `[◄]` / `[►]`) para moverte. Disparo con `[Espacio]` o `[W]`.
  - **Jugador 2**: Teclas `[J]` y `[L]` para moverte. Disparo con `[K]`.

---

### 2. Modos de Juego
- **1 Jugador (Defensa Solitaria)**: Defiende la Tierra contra el enjambre alienígena de 55 invasores.
- **2 Jugadores (Cooperativo)**: Dos personas en cámara defienden simultáneamente el planeta con dos cañones (P1 en Verde y P2 en Cyan).

---

### 3. Fidelidad Histórica de 1978
- **Enjambre de 55 Invasores**:
  - Calamares (Fila superior, 30 pts).
  - Cangrejos (Filas medias, 20 pts).
  - Pulpos (Filas inferiores, 10 pts).
  - Sprites clásicos de 2 cuadros con animación de marcha.
- **Aceleración Hipnótica**:
  - La marcha de 4 notas graves se acelera a medida que quedan menos alienígenas, alcanzando un ritmo frenético cuando solo queda uno.
- **4 Búnkeres Defensivos**:
  - Compuestos por bloques destruibles píxel a píxel ante los impactos de los misiles alienígenas y los láseres defensivos.
- **Platillo OVNI Misterioso**:
  - Aparece periódicamente en la zona superior con su icónica sirena oscilante, otorgando hasta 300 puntos de bonificación.
- **Tiras de Celofán de Color**:
  - Simulación del filtro original de celofán (rojo arriba, blanco en medio y verde en la base).

---

## 🚀 Cómo Ejecutar

Desde la carpeta del proyecto:
```bash
py -m http.server 8000
```
Abre en tu navegador:
👉 [http://localhost:8000/space-invaders/](http://localhost:8000/space-invaders/)

---

## ⌨️ Atajos de Teclado
- **`[V]`**: Mostrar / ocultar monitor de cámara y MoveNet.
- **`[M]`**: Silenciar / activar audio.
- **`[F]`**: Pantalla completa (Full Screen).
- **`[R]`**: Reiniciar partida.
- **`[Espacio]`**: Disparo del cañón.

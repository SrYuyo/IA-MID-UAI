# PONG (1972) - Atari Arcade AI Edition

Recreación fiel y nostálgica del legendario arcade **PONG** (lanzado por Atari en 1972), adaptado con **visión por computadora en tiempo real (`ml5.js / MoveNet`)**, **física analógica original de Al Alcorn** y **sonido sintetizado mediante Web Audio API**.

---

## 🕹️ Características Principales

### 1. Modos de Control Corporal Seleccionables
El usuario puede elegir dinámicamente cómo controlar su pala:
- **🗣️ Cabeza (Posición Vertical)**:
  - Mueve la cabeza hacia arriba o hacia abajo frente a la cámara web para desplazar la pala con precisión natural.
- **💪 Brazos (Elevación de Muñecas)**:
  - Levanta o desciende el brazo/muñeca para dirigir la pala arriba o abajo.
- **⌨️ Teclado / Híbrido (Respaldo)**:
  - **Jugador 1**: Teclas `[W]` (subir) y `[S]` (bajar).
  - **Jugador 2**: Flechas `[▲]` (subir) y `[▼]` (bajar).
  - **Saque inmediato**: Barra espaciadora `[Espacio]`.

---

### 2. Modos de Juego
- **1 Jugador (vs IA)**: Compite contra la máquina con tres niveles de dificultad:
  - *Principiante*: Reacción pausada con margen de error.
  - *Arcade Clásico (1972)*: Simula el comportamiento del circuito integrado TTL original de Atari.
  - *Imposible (Master)*: Predicción balística con cálculo de rebotes en paredes.
- **2 Jugadores (2 Cuerpos en Cámara)**: Dos personas pueden jugar simultáneamente frente a la cámara web. La persona a la izquierda controla la **Pala 1** y la persona a la derecha controla la **Pala 2**.

---

### 3. Fidelidad Histórica y Visual
- **Gabinete de Madera de 1972**: Marco y marquesina fiel al mueble original mostrado en la imagen de referencia.
- **Pantalla CRT Curva**: Rayas scanlines, resplandor de fósforo blanco y fondo negro absoluto.
- **Física de 8 Zonas**: El ángulo de rebote depende de la parte de la pala donde impacte la pelota (centro = recto, bordes = ángulos extremos de hasta 55°).
- **Aceleración Progresiva**: La velocidad de la pelota aumenta a medida que el peloteo se prolonga.
- **Audio 100% Sintetizado**:
  - Impacto en pala: Onda cuadrada a **490 Hz**.
  - Rebote en pared: Onda cuadrada a **226 Hz**.
  - Punto anotado: Onda cuadrada grave a **115 Hz**.

---

## 🚀 Cómo Ejecutar

Desde la carpeta del proyecto:
```bash
py -m http.server 8000
```
Abre en tu navegador:
👉 [http://localhost:8000/atari-pong/](http://localhost:8000/atari-pong/)

---

## ⌨️ Atajos de Teclado
- **`[V]`**: Mostrar / ocultar el monitor de depuración de la cámara.
- **`[M]`**: Silenciar / activar audio.
- **`[F]`**: Pantalla completa (Full Screen).
- **`[R]`**: Reiniciar partida.
- **`[Espacio]`**: Lanzar saque de pelota.

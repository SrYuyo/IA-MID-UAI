# SEGA PRO TENNIS '98 - Arcade AI Edition

Juego de tenis estilo arcade retro (inspirado en **Virtua Tennis** y los clásicos de **SEGA**) desarrollado con **p5.js** y **ml5.js**, controlado mediante visión artificial por cámara web o teclado/híbrido.

---

## 🎮 Características Principales

### 1. Modos de Control Corporal Seleccionables
El usuario puede alternar dinámicamente entre tres esquemas de control:
- **💪 Brazos (Swing & Smash)**:
  - **Desplazamiento**: Movimiento lateral de torso/hombros para correr a lo largo de la línea de fondo.
  - **Drive / Forehand**: Agita la muñeca derecha hacia adelante al cruzar la pelota.
  - **Revés / Backhand**: Agita la muñeca izquierda cruzando el cuerpo.
  - **Saque / Smash**: Eleva ambas muñecas por encima de la cabeza.
- **🗣️ Cabeza (Inclinación Lateral)**:
  - **Desplazamiento**: Inclina la cabeza hacia la izquierda o derecha para correr hacia la pelota.
  - **Impacto**: Detección de swing automática y cabeceos sincronizados al llegar a la pelota.
- **⌨️ Teclado / Híbrido (Respaldo)**:
  - **Movimiento**: Flechas del teclado o teclas `[W]`, `[A]`, `[S]`, `[D]`.
  - **Golpe Normal**: `[Espacio]` o `[Z]`.
  - **Smash / Globo Potente**: `[X]`.

---

### 2. Modos de Juego
- **1 Jugador (vs IA)**: Enfréntate a una CPU inteligente con predicción balística y estilos de juego ajustables (**Amateur**, **Pro Circuit**, **Grand Slam**).
- **2 Jugadores (Local / 2 Cuerpos con Webcam)**: Dos personas pueden pararse frente a la cámara web. La persona a la izquierda controla al **Jugador 1** y la persona a la derecha controla al **Jugador 2**.

---

### 3. Física 2.5D y Estética SEGA Arcade
- Proyección de pista en perspectiva con sensación de profundidad estilo Virtua Tennis.
- Sombra de pelota y jugadores para cálculo visual de botes y alturas.
- Carteles publicitarios de marcas retro SEGA en las gradas.
- Carteles gigantes arcade con efectos de resplandor (*"ACE!!"*, *"SMASH!!"*, *"FAULT"*, *"OUT"*, *"DEUCE"*, *"GAME!"*).
- Sintetizador sonoro 100% generado por Web Audio API (raquetazos, botes, ovaciones del público y voz del árbitro).

---

## 🚀 Cómo Ejecutar

Desde la carpeta del proyecto:
```bash
py -m http.server 8000
```
Abre en tu navegador:
👉 [http://localhost:8000/sega-pro-tennis/](http://localhost:8000/sega-pro-tennis/)

---

## ⌨️ Atajos de Teclado
- **`[V]`**: Mostrar / ocultar monitor de cámara y esqueleto MoveNet.
- **`[M]`**: Silenciar / activar audio.
- **`[F]`**: Pantalla completa.
- **`[R]`**: Reiniciar partido.

# IA-MID-UAI - Proyectos de Inteligencia Artificial y Visión Computacional

Repositorio de proyectos y videojuegos desarrollados con **Inteligencia Artificial**, **Visión Computacional en Tiempo Real** (`ml5.js / MoveNet`) y **Diseño Generativo / Simulaciones Interactivas** (`p5.js`).

---

## 📁 Estructura del Repositorio

```
IA-MID-UAI/
│
├── 🕹️ atari-pong/                    # PONG Original (1972) - MoveNet + IA + 2P
│   ├── index.html                    # Mueble arcade clásico de madera y pantalla CRT
│   ├── style.css                     # Estética retro de Al Alcorn, bisel y scanlines
│   ├── README.md                     # Manual de juego, física de 8 zonas y controles
│   └── js/
│       ├── audio.js                  # Sintetizador de frecuencias originales (490Hz, 226Hz, 115Hz)
│       ├── pongGame.js               # Física, aceleración de pelota y rebotes
│       ├── ai.js                     # IA de la CPU (Principiante, Arcade 1972, Master)
│       ├── tracker.js                # Control por Visión: Cabeza / Brazos / Teclado
│       └── sketch.js                 # Ciclo de vida y orquestador p5.js
│
├── 🌊 ecofluido-generativo/          # Sistema Generativo de Fluidos (Pausa Activa)
│   ├── index.html                    # Lienzo interactivo y HUD ambiental
│   ├── style.css                     # Estilos oscuros para proyección en muro
│   ├── README.md                     # Documentación y guía de calibración
│   └── js/
│       ├── bodyTracker.js            # Visión computacional (ml5.js MoveNet / Centro de Masa)
│       ├── fluidField.js             # Grilla vectorial advectiva (Navier-Stokes / Perlin)
│       ├── particleSystem.js         # Motor de partículas reactivas y modulación cromática
│       └── sketch.js                 # Ciclo de vida y orquestador p5.js
│
└── 🥊 super-ko-boxing/               # Videojuego Arcade de Boxeo por Visión
    ├── index.html                    # Pantalla del ring y arcade UI
    ├── style.css                     # Estilos retro arcade
    ├── README.md                     # Manual de juego y movimientos
    └── js/
        ├── audio.js                  # Efectos de sonido y sintetizador de audio
        ├── fx.js                     # Efectos de impacto y partículas
        ├── opponent.js               # IA de los boxeadores rivales
        ├── player.js                 # Física y estados del jugador
        ├── ring.js                   # Renderizado del cuadrilátero
        ├── tracker.js                # Detección de golpes, esquivas y guardia con webcam
        └── sketch.js                 # Orquestador del juego
```

---

## 🕹️ 1. PONG (1972) - Atari Arcade AI Edition

Recreación fiel del mítico arcade **PONG de Atari (1972)**, con la física analógica original de Allan Alcorn y control multimodal por visión artificial:
- **Control por Cabeza**: Mueve la cabeza hacia arriba o abajo frente a la webcam para controlar la altura de la pala.
- **Control por Brazos**: Sube o baja la muñeca para dirigir la pala.
- **Modos de Juego**:
  - *1 Jugador vs IA*: Compite contra la CPU con tres dificultades (*Principiante*, *Arcade Clásico 1972*, *Imposible*).
  - *2 Jugadores*: Dos personas simultáneas en cámara (cuerpo izquierdo controla Pala 1, cuerpo derecho controla Pala 2).
- **Fidelidad**: Sonidos sintetizados en frecuencias originales (490 Hz, 226 Hz y 115 Hz), red de segmentos discontinuos, rebotes en 8 zonas y pantalla CRT de fósforo.

### Ejecución:
```bash
cd atari-pong
py -m http.server 8000
```
Abrir: [http://localhost:8000](http://localhost:8000)

---

## 🌊 2. EcoFluido Generativo (Pausa Activa)

Sistema de diseño generativo interactivo diseñado para instalaciones y proyección en muros de oficina. Analiza el tránsito de personas en tiempo real y responde con dinámicas de fluidos y estelas luminosas:
- **Modo Reposo**: Corrientes lentas y tonos fríos meditativos (azul e índigo).
- **Paso Lento / Calmo**: Ondulación suave y tonos cian/esmeralda.
- **Paso Rápido / Dinámico**: Turbulencia, vórtices y tonos cálidos vivos (magenta, ámbar, dorado).

### Ejecución:
```bash
cd ecofluido-generativo
py -m http.server 8000
```
Abrir: [http://localhost:8000](http://localhost:8000)

---

## 🥊 3. Super K.O. Boxing - Web Tracker Edition

Juego de boxeo arcade retro donde el jugador controla a su avatar usando su propio cuerpo frente a la cámara web (esquivas, agacharse, guardia y puñetazos).

### Ejecución:
```bash
cd super-ko-boxing
py -m http.server 8000
```
Abrir: [http://localhost:8000](http://localhost:8000)

---

## 🛠️ Requisitos
- Navegador web moderno con soporte para WebGL y WebRTC (Google Chrome, Edge, Firefox, Safari).
- Acceso a cámara web para el tracking MoveNet en tiempo real.
- Servidor local HTTP (`python -m http.server` o `npx serve`).

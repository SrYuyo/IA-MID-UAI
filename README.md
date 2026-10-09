# IA-MID-UAI - Proyectos de Inteligencia Artificial y Visión Computacional

Repositorio de proyectos y videojuegos desarrollados con **Inteligencia Artificial**, **Visión Computacional en Tiempo Real** (`ml5.js / MoveNet`) y **Diseño Generativo / Simulaciones Interactivas** (`p5.js`).

---

## 📁 Estructura del Repositorio

```
IA-MID-UAI/
│
├── 🎾 sega-pro-tennis/               # Pro Tenis SEGA Arcade '98 (MoveNet + IA + 2P)
│   ├── index.html                    # Pista 2.5D, marcador SEGA y HUD
│   ├── style.css                     # Estética retro arcade y scanlines CRT
│   ├── README.md                     # Manual de juego y calibración de gestos
│   └── js/
│       ├── audio.js                  # Efectos sonoros sintetizados y locuciones
│       ├── court.js                  # Proyección 2.5D de la pista y estadio
│       ├── ball.js                   # Física 3D de pelota, rebotes y sombras
│       ├── player.js                 # Animaciones 2.5D, swings y caja de colisión
│       ├── ai.js                     # Inteligencia Artificial táctica de CPU
│       ├── score.js                  # Reglas oficiales de tenis, deuce y ventajas
│       ├── tracker.js                # Detección corporal: Brazos / Cabeza / Teclado
│       └── sketch.js                 # Orquestador del ciclo de vida p5.js
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

## 🎾 1. SEGA Pro Tennis '98 - Arcade AI Edition

Juego de tenis arcade retro inspirado en los clásicos de SEGA (Virtua Tennis). Ofrece opciones de control corporal seleccionables por el usuario y soporte multijugador:
- **Control por Brazos**: Movimiento por tronco y swings rápidos de muñeca derecha (Drive), izquierda (Revés) o ambas arriba (Saque/Smash).
- **Control por Cabeza**: Desplazamiento lateral por inclinación de cabeza y golpe sincronizado.
- **Modos de Juego**: 1 Jugador contra IA táctica (Amateur, Pro, Grand Slam) o 2 Jugadores simultáneos frente a la cámara web.

### Ejecución:
```bash
cd sega-pro-tennis
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

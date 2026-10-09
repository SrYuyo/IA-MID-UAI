# IA-MID-UAI - Proyectos de Inteligencia Artificial y Visión Computacional

Repositorio de proyectos y experimentos desarrollados con **Inteligencia Artificial**, **Visión Computacional en Tiempo Real** (`ml5.js / MoveNet`) y **Diseño Generativo / Simulaciones Interactivas** (`p5.js`).

---

## 📁 Estructura del Repositorio

```
IA-MID-UAI/
│
├── 🌊 ecofluido-generativo/          # Sistema Generativo de Fluidos (Pausa Activa)
│   ├── index.html                    # Lienzo interactivo y HUD ambiental
│   ├── style.css                     # Estilos oscuros para proyección en muro
│   ├── README.md                     # Documentación y guía de calibración
│   └── js/
│       ├── bodyTracker.js            # Visión computacional (ml5.js MoveNet / Centro de Masa)
│       ├── fluidField.js             # Grilla vectorial advectiva (Navier-Stokes simplificado / Perlin)
│       ├── particleSystem.js         # Motor de partículas reactivas y modulación cromática
│       └── sketch.js                 # Ciclo de vida y orquestador p5.js
│
└── 🥊 super-ko-boxing/               # Videojuego Arcade Controlado por Visión
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

## 🌊 1. EcoFluido Generativo (Pausa Activa)

Sistema de diseño generativo interactivo diseñado para instalaciones y proyección en muros de oficina. Analiza el tránsito de personas en tiempo real y responde con dinámicas de fluidos y estelas bioluminiscentes:
- **Modo Reposo**: Corrientes lentas y tonos fríos meditativos (azul profundo e índigo) ante ausencia de movimiento.
- **Paso Lento / Calmo**: Ondulación suave y tonos cian/esmeralda para invitar a la relajación.
- **Paso Rápido / Dinámico**: Turbulencia, vórtices de dispersión amplia y tonos cálidos vivos (magenta, ámbar, dorado).

### Ejecución:
```bash
cd ecofluido-generativo
py -m http.server 8000
```
Abrir: [http://localhost:8000](http://localhost:8000)

---

## 🥊 2. Super K.O. Boxing - Web Tracker Edition

Juego de boxeo arcade retro donde el jugador controla a su avatar usando su propio cuerpo frente a la cámara web:
- **Esquivas Laterales**: Inclinaciones de torso para esquivar ganchos.
- **Agacharse (Duck)**: Descender el centro de gravedad para evadir golpes altos.
- **Guardia Activa**: Levantar ambas muñecas para bloquear ataques rivales.
- **Puñetazos Directos**: Jabs y cross con las manos hacia la cámara.
- **Super K.O. Uppercut**: Ataque especial al llenar la barra de adrenalina.

### Ejecución:
```bash
cd super-ko-boxing
py -m http.server 8000
```
Abrir: [http://localhost:8000](http://localhost:8000)

---

## 🛠️ Requisitos
- Navegador web moderno con soporte para WebGL y WebRTC (Google Chrome, Edge, Firefox, Safari).
- Acceso a cámara web (para el tracking en tiempo real con ml5.js).
- Servidor local HTTP (`python -m http.server`, `npx serve`, o Live Server) para evitar restricciones de seguridad CORS del navegador con la cámara.

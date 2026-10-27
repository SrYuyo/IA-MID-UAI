# IA-MID-UAI - Salón Arcade y Experiencias de Visión Artificial

Repositorio central de videojuegos arcade retro y experiencias de **Pausa Activa** desarrollados con **Inteligencia Artificial**, **Visión Computacional en Tiempo Real** (`ml5.js / MoveNet`) y **p5.js**.

---

## 🌐 PÁGINA WEB PRINCIPAL (COMPILADO DE LOS 4 JUEGOS)

Esta es la **página web completa e interactiva ("Arcade & Vision Lab")** que reúne el compilado de los 4 juegos en una sola interfaz con sus tarjetas, especificaciones y botones de lanzamiento rápido:

### 👉 **[https://sryuyo.github.io/IA-MID-UAI/](https://sryuyo.github.io/IA-MID-UAI/)**

*(Funciona en cualquier computador con cámara web, de forma autónoma y sin instalar nada).*

---

### 🎮 Tabla de Enlaces Directos:

| Experiencia / Juego | Tipo de Experiencia | Enlace Web Directo |
| :--- | :--- | :---: |
| 🌐 **PORTAL MAESTRO (COMPILADO)** | **Página central con los 4 juegos** | 👉 **[https://sryuyo.github.io/IA-MID-UAI/](https://sryuyo.github.io/IA-MID-UAI/)** |
| 👾 **Space Invaders (1978)** | Control aéreo gestual con la mano (Miro) | [https://sryuyo.github.io/IA-MID-UAI/space-invaders/](https://sryuyo.github.io/IA-MID-UAI/space-invaders/) |
| 🏓 **Atari PONG (1972)** | Control por cabeza o brazos e IA arcade | [https://sryuyo.github.io/IA-MID-UAI/atari-pong/](https://sryuyo.github.io/IA-MID-UAI/atari-pong/) |
| 🌊 **EcoFluido Generativo** | Instalación ambiental para Pausa Activa | [https://sryuyo.github.io/IA-MID-UAI/ecofluido-generativo/](https://sryuyo.github.io/IA-MID-UAI/ecofluido-generativo/) |
| 🥊 **Super K.O. Boxing** | Boxeo con esquivas y puñetazos corporales | [https://sryuyo.github.io/IA-MID-UAI/super-ko-boxing/](https://sryuyo.github.io/IA-MID-UAI/super-ko-boxing/) |

---

## 📁 Catálogo de Proyectos y Estructura del Repositorio

Cada juego vive en su propia carpeta y es una página independiente (HTML + CSS + JavaScript con p5.js y ml5.js cargados desde CDN). No hay que instalar ni compilar nada.

```
IA-MID-UAI/
├── index.html                 ← Portal "Arcade & Vision Lab" (página principal)
├── style.css
├── space-invaders/            ← 👾 Space Invaders con la mano
│   ├── index.html · style.css · README.md
│   └── js/  audio.js · invadersGame.js · tracker.js · sketch.js
├── atari-pong/                ← 🏓 Atari PONG
│   ├── index.html · style.css · README.md
│   └── js/  audio.js · pongGame.js · ai.js · tracker.js · sketch.js
├── ecofluido-generativo/      ← 🌊 EcoFluido Generativo
│   ├── index.html · style.css · README.md
│   └── js/  fluidField.js · particleSystem.js · bodyTracker.js · sketch.js
└── super-ko-boxing/           ← 🥊 Super K.O. Boxing
    ├── index.html · style.css · README.md
    └── js/  audio.js · fx.js · ring.js · tracker.js · player.js · opponent.js · sketch.js
```

Todos los juegos siguen la misma división:

| Archivo | Responsabilidad |
| :--- | :--- |
| `tracker.js` / `bodyTracker.js` | Cámara + MoveNet (ml5.js): convierte el cuerpo en valores de control |
| `*Game.js`, `player.js`, `opponent.js`, `fluidField.js`… | Reglas, física y dibujo del juego |
| `audio.js` | Efectos de sonido generados con Web Audio |
| `sketch.js` | Orquestador p5.js: `setup()`, `draw()`, teclado y botones |

### ▶️ Probar en local

Los navegadores solo dan acceso a la cámara en `https://` o en `localhost`, así que no basta con abrir el `index.html` con doble clic. Desde la carpeta del repositorio:

```bash
python3 -m http.server 8000
```

y luego abre <http://localhost:8000>.

### ⌨️ Si no hay cámara

Todos los juegos se pueden jugar con teclado; el teclado tiene prioridad mientras se presiona.

| Juego | Controles |
| :--- | :--- |
| Space Invaders | **A/D** o **←/→** mover · **Espacio/W** disparar · J/L y K para el jugador 2 |
| Atari PONG | **W/S** jugador 1 · **↑/↓** o **I/K** jugador 2 · **Espacio** sacar |
| EcoFluido | **S** cambia a simulación con mouse o automática · **C** limpiar · **H** ocultar panel |
| Super K.O. Boxing | **Z/X** golpes · **S** súper golpe · **←/→** esquivar · **↓** agacharse · **Espacio** guardia |

---

## 🕹️ Detalle de los 4 Juegos en el Compilado

### 👾 1. Space Invaders (1978) - Control Gestual con la Mano
* **Especificación del Tablero Miro**: Implementado siguiendo la arquitectura grupal *"Space Invaders con la mano"*.
* **Control Gestual**: Mueve la mano horizontalmente en el aire para desplazar el cañón; un gesto rápido de percusión/elevación dispara el láser.
* **Modos**: 1 Jugador o 2 Jugadores simultáneos en defensa cooperativa.
* **Fidelidad**: Marcha de 4 notas graves aceleradas, 4 búnkeres destructibles píxel a píxel, platillo OVNI misterioso y tiras de celofán de color.
* 👉 **Enlace Directo:** [https://sryuyo.github.io/IA-MID-UAI/space-invaders/](https://sryuyo.github.io/IA-MID-UAI/space-invaders/)

---

### 🏓 2. Atari PONG (1972) - Arcade AI Edition
* **Control Corporal**: Control de pala vertical mediante la cabeza (inclinación/altura) o brazos (elevación de muñecas).
* **Modos**: 1 Jugador contra la CPU (3 dificultades: *Principiante*, *Arcade 1972*, *Master*) o duelo local de 2 personas frente a la cámara.
* **Fidelidad**: Mueble original de madera, frecuencias de audio analógicas (490Hz, 226Hz, 115Hz) y rebotes segmentados en 8 zonas.
* 👉 **Enlace Directo:** [https://sryuyo.github.io/IA-MID-UAI/atari-pong/](https://sryuyo.github.io/IA-MID-UAI/atari-pong/)

---

### 🌊 3. EcoFluido Generativo (Pausa Activa)
* **Instalación Ambiental**: Arte generativo para proyectores y muros de oficina.
* **Dinámica**: Responde a la velocidad y cadencia de paso de los transeúntes inyectando turbulencia y estelas vivas, retornando a derivas lentas meditativas en reposo.
* 👉 **Enlace Directo:** [https://sryuyo.github.io/IA-MID-UAI/ecofluido-generativo/](https://sryuyo.github.io/IA-MID-UAI/ecofluido-generativo/)

---

### 🥊 4. Super K.O. Boxing - Tracker Edition
* **Control Corporal Total**: Esquivas laterales de torso, agacharse (duck), guardia activa protegiendo la cara y puñetazos directos.
* 👉 **Enlace Directo:** [https://sryuyo.github.io/IA-MID-UAI/super-ko-boxing/](https://sryuyo.github.io/IA-MID-UAI/super-ko-boxing/)

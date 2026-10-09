# IA-MID-UAI - Salón Arcade y Experiencias de Visión Artificial

Repositorio central de videojuegos arcade retro y experiencias de **Pausa Activa** desarrollados con **Inteligencia Artificial**, **Visión Computacional en Tiempo Real** (`ml5.js / MoveNet`) y **p5.js**.

Todos los proyectos están accesibles y testeables desde el portal maestro web en la raíz del proyecto.

---

## 🌐 Portal Web Central de Pruebas

Al levantar el servidor local (`python -m http.server 8000`), el portal de inicio (`index.html`) te permite seleccionar y lanzar cualquiera de los 4 juegos con un solo clic:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## 📁 Catálogo de Proyectos y Estructura

```
IA-MID-UAI/
│
├── 🌐 index.html                     # Portal Web Maestro (Lanzador de juegos y pruebas)
├── 🎨 style.css                      # Estilos del portal neón arcade
│
├── 👾 space-invaders/                # Space Invaders (1978) - Control Gestual con la Mano
│   ├── index.html                    # Mueble arcade, celofán de color y pantalla CRT
│   ├── style.css                     # Estilos retro de Taito 1978
│   ├── README.md                     # Manual y gestos (Miro "Space Invaders con la mano")
│   └── js/ (audio.js, invadersGame.js, tracker.js, sketch.js)
│
├── 🕹️ atari-pong/                    # PONG Original (1972) - Atari Arcade AI Edition
│   ├── index.html                    # Mueble arcade clásico de madera y marco CRT
│   ├── style.css                     # Fósforo blanco, bisel y estética de Al Alcorn
│   ├── README.md                     # Física de 8 zonas, rebotes y controles
│   └── js/ (audio.js, pongGame.js, ai.js, tracker.js, sketch.js)
│
├── 🌊 ecofluido-generativo/          # Sistema Generativo de Fluidos (Pausa Activa)
│   ├── index.html                    # Lienzo a pantalla completa y HUD ambiental
│   ├── style.css                     # Modo presentación oscura para muros de oficina
│   ├── README.md                     # Guía de proyección y parámetros Navier-Stokes
│   └── js/ (bodyTracker.js, fluidField.js, particleSystem.js, sketch.js)
│
└── 🥊 super-ko-boxing/               # Super K.O. Boxing - Arcade Fighting con Visión
    ├── index.html                    # Pantalla de combate y ring estilo Punch-Out!!
    ├── style.css                     # Estilos retro arcade
    ├── README.md                     # Manual de esquivas, guardia y puñetazos
    └── js/ (audio.js, fx.js, opponent.js, player.js, ring.js, tracker.js, sketch.js)
```

---

## 👾 1. Space Invaders (1978) - Control Gestual con la Mano
- **Especificación del Tablero Miro**: Implementado siguiendo la arquitectura grupal *"Space Invaders con la mano"*.
- **Control Gestual**: Mueve la mano horizontalmente en el aire para desplazar el cañón; un gesto rápido de percusión/elevación dispara el láser.
- **Modos**: 1 Jugador o 2 Jugadores simultáneos en defensa cooperativa.
- **Fidelidad**: Marcha de 4 notas graves aceleradas, 4 búnkeres destructibles píxel a píxel, platillo OVNI misterioso y tiras de celofán de color.
- 👉 Acceso directo: [http://localhost:8000/space-invaders/](http://localhost:8000/space-invaders/)

---

## 🕹️ 2. Atari PONG (1972) - Arcade AI Edition
- **Control Corporal**: Control de pala vertical mediante la cabeza (inclinación/altura) o brazos (elevación de muñecas).
- **Modos**: 1 Jugador contra la CPU (3 dificultades: *Principiante*, *Arcade 1972*, *Master*) o duelo local de 2 personas frente a la cámara.
- **Fidelidad**: Mueble original de madera, frecuencias de audio analógicas (490Hz, 226Hz, 115Hz) y rebotes segmentados en 8 zonas.
- 👉 Acceso directo: [http://localhost:8000/atari-pong/](http://localhost:8000/atari-pong/)

---

## 🌊 3. EcoFluido Generativo (Pausa Activa)
- **Instalación Ambiental**: Arte generativo para proyectores y muros de oficina.
- **Dinámica**: Responde a la velocidad y cadencia de paso de los transeúntes inyectando turbulencia y estelas vivas, retornando a derivas lentas meditativas en reposo.
- 👉 Acceso directo: [http://localhost:8000/ecofluido-generativo/](http://localhost:8000/ecofluido-generativo/)

---

## 🥊 4. Super K.O. Boxing - Tracker Edition
- **Control Corporal Total**: Esquivas laterales de torso, agacharse (duck), guardia activa protegiendo la cara y puñetazos directos.
- 👉 Acceso directo: [http://localhost:8000/super-ko-boxing/](http://localhost:8000/super-ko-boxing/)

---

## 🚀 Cómo Ejecutar

En la raíz del repositorio, inicia un servidor local HTTP:
```bash
py -m http.server 8000
```
Luego abre tu navegador en:
👉 [http://localhost:8000](http://localhost:8000)

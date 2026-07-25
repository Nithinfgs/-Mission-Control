#  Mission Control (APEX AERO)

> *Every mission starts with a countdown. Every decision changes the outcome.*

Mission Control is a realistic, browser-based spaceflight planning, telemetry monitoring, and orbital mechanics simulation platform. Users take on the role of Flight Director, managing spacecraft staging parameters, trajectory physics, system readiness checks, and celestial exploration.

---

##  Key Features

* **Control Center Dashboard**: Real-time telemetry monitoring, DSN communication tracking, solar wind status, and live spacecraft count.
* **Flight Planner**: Calculate target orbits, Hohmann transfer delta-v requirements, and vehicle lift capability checks.
* **Staged Rocket Designer**: 3D interactive assembly interface supporting modular solid boosters, fuel tank sizing, vacuum/ascent engines, and deployable solar arrays.
* **Launch Sequence Pad**: Pre-flight system checkouts, real-time meteorological GO/NO-GO checks, and active liftoff ignition countdowns.
* **Orbital Telemetry HUD**: Interactive 3D orbital trajectory visualizer utilizing Newtonian step-physics (Euler-Cromer integration) for real-time speed, altitude, and drag telemetry plots.
* **Celestial Database**: Solar System database modeling planet radius, gravity, escape velocity, and rotational periods.
* **Training Academy & Logbooks**: Space flight school tutorials with instant quiz verifications and JSON telemetry log exporters.
* **AI Flight Assistant**: An integrated LLM-style helper utility to check launchpad TWR, analyze flight anomalies, and review vehicle specs.

---

##Flat  Directory Structure

This project uses a clean, **folderless structure** consisting of exactly 8 files at the root level:

1. `App.jsx` - Core React views, state context providers, 3D canvases, and entry node.
2. `rocketPhysics.js` - Staging mass solvers, atmospheric density models, and Euler integration steps.
3. `orbitalMechanics.js` - Keplerian orbits, Hohmann transfer calculations, and planetary database.
4. `index.html` - HTML5 template including inline rocket SVG favicon.
5. `index.css` - Custom sci-fi dark tactical aerospace HUD styling.
6. `package.json` - Dependencies configuration (Vite, React 19, Three.js 0.160.0).
7. `vite.config.js` - Build compiler parameter options.
8. `README.md` - Documentation file.

---

## Getting Started

To run the application locally on your computer:

```bash
# 1. Navigate to the project directory
cd ~/Desktop/mission-control

# 2. Install package dependencies
npm install

# 3. Start the Vite hot-reloading development server
npm run dev
```

Open `http://localhost:5173` in your browser to fly your missions!

---

##  Production Build

To compile a minified production bundle:

```bash
npm run build
```
This generates a fast, optimized build inside a `./dist` folder.

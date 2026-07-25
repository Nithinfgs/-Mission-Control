Mission Control

Mission Control is a browser-based space mission operations platform inspired by modern aerospace control centers. Designed as an interactive engineering experience rather than a game, the application allows users to explore satellite operations, orbital mechanics, spacecraft telemetry, and mission planning through an immersive interface and real-time 3D visualization.

The project combines engineering-inspired dashboards with modern web technologies to create a professional mission control environment where users can monitor spacecraft health, visualize orbital trajectories, and interact with key mission systems. The interface emphasizes clarity, smooth animations, and an intuitive workflow while showcasing the possibilities of browser-based simulation and visualization.

### Live Demo

https://thunderous-stardust-d4cc3a.netlify.app/

### Features

* Interactive 3D Earth and spacecraft visualization
* Orbital mechanics simulation and trajectory rendering
* Mission dashboard with real-time spacecraft telemetry
* System health monitoring and mission status indicators
* Communication and mission operations panels
* Responsive glassmorphism interface with custom animations
* Smooth camera controls, transitions, and interactive UI
* Modular architecture for future mission and spacecraft expansion

### Technology Stack

* React
* Vite
* JavaScript (ES6)
* HTML5
* CSS3
* Three.js
* WebGL
* Custom orbital mechanics engine

### Project Structure

* `App.jsx` – Main application and UI layout
* `index.css` – Global styling and design system
* `index.html` – Application entry point
* `orbitalMechanics.js` – Orbital calculations and visualization logic
* `rocketPhysics.js` – Spacecraft motion and physics calculations
* `vite.config.js` – Vite configuration
* `package.json` – Project dependencies and scripts

### Running Locally

Clone the repository, install the dependencies, and start the development server.

```bash
npm install
npm run dev
```

### Future Improvements

Future versions may include support for multiple spacecraft, live public satellite data, mission planning tools, ground station visualization, orbital maneuver planning, and expanded telemetry systems to create an even more realistic mission operations experience.

Mission Control was built as an educational and engineering-focused project that demonstrates how modern browser technologies can be used to create immersive scientific visualization and simulation software.

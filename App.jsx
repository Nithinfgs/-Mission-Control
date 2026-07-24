import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import './index.css';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { 
  LayoutDashboard, 
  Compass, 
  Wrench, 
  Rocket, 
  Gauge, 
  Globe, 
  GraduationCap, 
  BookOpen, 
  Bot, 
  Volume2, 
  VolumeX, 
  AlertTriangle,
  Radio,
  ArrowRight,
  Activity,
  ShieldAlert,
  CheckCircle,
  Plus,
  Trash2,
  ChevronRight,
  Thermometer,
  Wind,
  Eye,
  RefreshCw,
  Award,
  Check,
  Send,
  User,
  Wifi
} from 'lucide-react';

import { calculateRocketStats, stepPhysics, COMPONENT_TEMPLATES, EARTH } from './rocketPhysics.js';
import { PLANETS } from './orbitalMechanics.js';

// ==========================================
// THREE.JS 3D CANVAS COMPONENTS
// ==========================================

export function RocketCanvas({ stages }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x313647);

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 400;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0xA3B087, 0.8);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const rocketGroup = new THREE.Group();
    scene.add(rocketGroup);

    let currentY = 2.0;
    stages.forEach((stage) => {
      if (stage.command) {
        const cmdGeom = new THREE.ConeGeometry(0.5, 0.9, 16);
        const cmdMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.8 });
        const cmdMesh = new THREE.Mesh(cmdGeom, cmdMat);
        cmdMesh.position.y = currentY - 0.45;
        rocketGroup.add(cmdMesh);
        currentY -= 0.9;
        
        if (stage.solar) {
          const panelGeom = new THREE.BoxGeometry(1.6, 0.3, 0.05);
          const panelMat = new THREE.MeshStandardMaterial({ color: 0xA3B087, emissive: 0x01303a, roughness: 0.1 });
          const panelLeft = new THREE.Mesh(panelGeom, panelMat);
          panelLeft.position.set(-1.1, cmdMesh.position.y, 0);
          rocketGroup.add(panelLeft);
          const panelRight = new THREE.Mesh(panelGeom, panelMat);
          panelRight.position.set(1.1, cmdMesh.position.y, 0);
          rocketGroup.add(panelRight);
        }
      }
      if (stage.payload) {
        const payGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.8, 16);
        const payMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.6 });
        const payMesh = new THREE.Mesh(payGeom, payMat);
        payMesh.position.y = currentY - 0.4;
        rocketGroup.add(payMesh);
        currentY -= 0.8;
      }
      if (stage.interstage) {
        const decGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
        const decMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.8 });
        const decMesh = new THREE.Mesh(decGeom, decMat);
        decMesh.position.y = currentY - 0.1;
        rocketGroup.add(decMesh);
        currentY -= 0.2;
      }
      let tankHeight = 0;
      if (stage.fuelTank === 'small') tankHeight = 1.0;
      else if (stage.fuelTank === 'medium') tankHeight = 1.8;
      else if (stage.fuelTank === 'large') tankHeight = 2.8;

      if (tankHeight > 0) {
        const tankGeom = new THREE.CylinderGeometry(0.5, 0.5, tankHeight, 16);
        const tankMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.7 });
        const tankMesh = new THREE.Mesh(tankGeom, tankMat);
        tankMesh.position.y = currentY - (tankHeight / 2);
        rocketGroup.add(tankMesh);
        currentY -= tankHeight;
      }
      if (stage.engine) {
        const engGeom = new THREE.ConeGeometry(0.3, 0.5, 12);
        const engMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, metalness: 0.9 });
        engGeom.rotateX(Math.PI);
        const engMesh = new THREE.Mesh(engGeom, engMat);
        engMesh.position.y = currentY - 0.25;
        rocketGroup.add(engMesh);
        currentY -= 0.5;
      }
    });

    const box = new THREE.Box3().setFromObject(rocketGroup);
    const center = box.getCenter(new THREE.Vector3());
    rocketGroup.position.y = -center.y;

    let animationFrameId;
    const animate = () => {
      rocketGroup.rotation.y += 0.008;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 300;
      const h = container.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      scene.clear();
    };
  }, [stages]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: '300px' }} />;
}

export function OrbitCanvas({ position, velocity, telemetryHistory }) {
  const mountRef = useRef(null);
  const positionRef = useRef(position);
  const velocityRef = useRef(velocity);
  const telemetryHistoryRef = useRef(telemetryHistory);

  useEffect(() => {
    positionRef.current = position;
    velocityRef.current = velocity;
    telemetryHistoryRef.current = telemetryHistory;
  }, [position, velocity, telemetryHistory]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 350;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x313647);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const earthRadius = 4.0;
    const earthGeom = new THREE.SphereGeometry(earthRadius, 20, 20);
    const earthWireMat = new THREE.MeshBasicMaterial({ color: 0x1d4ed8, wireframe: true, transparent: true, opacity: 0.3 });
    const earthGroup = new THREE.Group();
    earthGroup.add(new THREE.Mesh(earthGeom, earthWireMat));
    scene.add(earthGroup);

    const craftGeom = new THREE.ConeGeometry(0.15, 0.4, 8);
    craftGeom.rotateX(Math.PI / 2);
    const spacecraft = new THREE.Mesh(craftGeom, new THREE.MeshBasicMaterial({ color: 0xA3B087 }));
    scene.add(spacecraft);

    const maxPoints = 500;
    const trajGeometry = new THREE.BufferGeometry();
    trajGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
    const trajectoryLine = new THREE.Line(trajGeometry, new THREE.LineBasicMaterial({ color: 0xA3B087, transparent: true, opacity: 0.7 }));
    scene.add(trajectoryLine);

    let animationFrameId;
    const animate = () => {
      earthGroup.rotation.y += 0.0005;
      const pos = positionRef.current;
      const vel = velocityRef.current;
      const hist = telemetryHistoryRef.current;
      const scale = earthRadius / 6371000;
      
      spacecraft.position.set(pos.x * scale, 0, -pos.y * scale);
      if (Math.abs(vel.vx) > 0.1 || Math.abs(vel.vy) > 0.1) {
        spacecraft.rotation.y = Math.atan2(vel.vy, vel.vx);
      }

      if (hist && hist.length > 0) {
        const positions = trajectoryLine.geometry.attributes.position.array;
        let idx = 0;
        const count = Math.min(hist.length, maxPoints);
        for (let i = 0; i < count; i++) {
          const pt = hist[i];
          const r_pt = (6371000 + pt.altitude) * scale;
          const orbAngle = pt.time * 0.02;
          positions[idx++] = Math.cos(orbAngle) * r_pt;
          positions[idx++] = 0;
          positions[idx++] = -Math.sin(orbAngle) * r_pt;
        }
        trajectoryLine.geometry.setDrawRange(0, count);
        trajectoryLine.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 350;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      scene.clear();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: '350px' }} />;
}

export function SolarSystemCanvas({ activePlanet, onSelectPlanet }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x313647);

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 400;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 18, 25);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1.8, 24, 24), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    scene.add(sunMesh);

    const specs = [
      { id: 'earth', name: 'Earth', size: 0.6, distance: 7.0, color: 0x2b82c9, speed: 0.015 },
      { id: 'mars', name: 'Mars', size: 0.45, distance: 10.0, color: 0xc1440e, speed: 0.01 },
      { id: 'jupiter', name: 'Jupiter', size: 1.2, distance: 14.0, color: 0xb07f35, speed: 0.005 }
    ];

    const meshes = specs.map(spec => {
      const ringGeom = new THREE.RingGeometry(spec.distance - 0.02, spec.distance + 0.02, 64);
      ringGeom.rotateX(Math.PI / 2);
      const orbitRing = new THREE.Mesh(ringGeom, new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide, transparent: true, opacity: 0.3 }));
      scene.add(orbitRing);

      const mesh = new THREE.Mesh(new THREE.SphereGeometry(spec.size, 16, 16), new THREE.MeshStandardMaterial({ color: spec.color }));
      scene.add(mesh);
      return { mesh, spec, orbitRing, angle: Math.random() * Math.PI * 2 };
    });

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children);
      const found = meshes.find(m => intersects.some(i => i.object === m.mesh));
      if (found) onSelectPlanet(found.spec.id);
    };
    container.addEventListener('click', onClick);

    let animationFrameId;
    const animate = () => {
      meshes.forEach(p => {
        p.angle += p.spec.speed * 0.4;
        p.mesh.position.set(Math.cos(p.angle) * p.spec.distance, 0, Math.sin(p.angle) * p.spec.distance);
        p.orbitRing.material.color.setHex(p.spec.id === activePlanet ? 0xA3B087 : 0x1e293b);
      });
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 500;
      const h = container.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', onClick);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      scene.clear();
    };
  }, [activePlanet, onSelectPlanet]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />;
}

// ==========================================
// MISSION CONTROL STATE CONTEXT
// ==========================================

const MissionContext = createContext();

const DEFAULT_ROCKET = [
  { command: true, payload: 'satellite', solar: true, battery: true, antenna: true, fuelTank: null, engine: null, boosters: 0 },
  { interstage: true, fuelTank: 'medium', engine: 'vac', boosters: 0 },
  { interstage: true, fuelTank: 'large', engine: 'merlin', boosters: 2, boosterType: 'solid' }
];

const INITIAL_WEATHER = { temp: '22°C', windSpeed: '12 km/h', windDir: 'NE', humidity: '45%', visibility: '10 km', status: 'GO' };

const INITIAL_CHECKLIST = [
  { id: 'fueling', name: 'Propellant Loading (LOX/RP-1)', status: 'PENDING' },
  { id: 'avionics', name: 'Guidance & Navigation Systems Test', status: 'PENDING' },
  { id: 'telemetry', name: 'DSN Communication Link Lock', status: 'PENDING' }
];

export function MissionProvider({ children }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rocketStages, setRocketStages] = useState(DEFAULT_ROCKET);
  const [activeMissions, setActiveMissions] = useState([
    { id: 'gps-12', name: 'GPS Sentinel-12', orbit: 'MEO', fuel: 82, status: 'OPERATIONAL' },
    { id: 'mars-express', name: 'Ares Pathfinder', orbit: 'Heliocentric', fuel: 45, status: 'CRUISING' }
  ]);
  const [logs, setLogs] = useState([
    { id: 'launch-01', name: 'Sentinel Deploy-01', date: '2026-06-15', status: 'SUCCESS', duration: '520s', score: 92, notes: 'Circular orbit established.' }
  ]);

  const [weather, setWeather] = useState(INITIAL_WEATHER);
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
  const [flightState, setFlightState] = useState('prelaunch');
  const [countdown, setCountdown] = useState(10);
  const [timeWarp, setTimeWarp] = useState(1);
  const [flightTime, setFlightTime] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: EARTH.RADIUS });
  const [velocity, setVelocity] = useState({ vx: 0, vy: 0 });
  const [pitch, setPitch] = useState(0);
  const [throttle, setThrottle] = useState(0);
  const [activeStage, setActiveStage] = useState(2);
  const [stageFuels, setStageFuels] = useState([]);
  const [solarDeployed, setSolarDeployed] = useState(false);
  const [fairingSeparated, setFairingSeparated] = useState(false);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [flightTimeline, setFlightTimeline] = useState([]);
  const [maxQ, setMaxQ] = useState(0);
  const [maxQTime, setMaxQTime] = useState(0);
  const [solarActivity] = useState({ windSpeed: 420, density: 4.2, status: 'STABLE' });
  const [dsnStatus] = useState('NOMINAL');
  const [settings, setSettings] = useState({ sound: true, realism: 'medium' });

  const simulationRef = useRef(null);
  const flightStateRef = useRef(flightState);
  flightStateRef.current = flightState;
  const rocketStats = calculateRocketStats(rocketStages);

  const rollWeather = () => {
    const isGo = Math.random() > 0.15;
    setWeather({
      temp: `${Math.floor(15 + Math.random() * 15)}°C`,
      windSpeed: `${Math.floor(5 + Math.random() * 25)} km/h`,
      windDir: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
      humidity: `${Math.floor(30 + Math.random() * 50)}%`,
      visibility: isGo ? '10 km' : `${Math.floor(2 + Math.random() * 4)} km`,
      status: isGo ? 'GO' : 'NO-GO'
    });
  };

  const resetLaunch = () => {
    setFlightState('prelaunch');
    setCountdown(10);
    setFlightTime(0);
    setPosition({ x: 0, y: EARTH.RADIUS });
    setVelocity({ vx: 0, vy: 0 });
    setPitch(0);
    setThrottle(0);
    setSolarDeployed(false);
    setFairingSeparated(false);
    setTelemetryHistory([]);
    setFlightTimeline([]);
    setMaxQ(0);
    setMaxQTime(0);
    setChecklist(INITIAL_CHECKLIST.map(item => ({ ...item, status: 'PENDING' })));
    setStageFuels(rocketStats.stageSpecs.map(s => s.fuelMass));
    setActiveStage(rocketStages.length - 1);
  };

  const performStageSeparation = () => {
    if (activeStage <= 0) return;
    const oldStage = activeStage;
    const nextStage = activeStage - 1;
    setActiveStage(nextStage);
    addTimelineEvent(`T+${flightTime.toFixed(1)}s: Stage ${rocketStages.length - 1 - oldStage} Separated`);
  };

  const deploySolarPanels = () => {
    if (!solarDeployed) {
      setSolarDeployed(true);
      addTimelineEvent(`T+${flightTime.toFixed(1)}s: Solar Panels deployed`);
    }
  };

  const separateFairing = () => {
    if (!fairingSeparated) {
      setFairingSeparated(true);
      addTimelineEvent(`T+${flightTime.toFixed(1)}s: Payload Fairing jettisoned`);
    }
  };

  const addTimelineEvent = (text) => {
    setFlightTimeline(prev => [...prev, text]);
  };

  const runChecklistTest = (id) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, status: 'NOMINAL' } : item));
  };

  const runAllChecklists = () => {
    setChecklist(prev => prev.map(item => ({ ...item, status: 'NOMINAL' })));
  };

  const startLaunchSequence = () => {
    if (weather.status === 'NO-GO' || checklist.some(item => item.status !== 'NOMINAL')) return;
    setFlightState('countdown');
    addTimelineEvent('T-10.0s: Terminal Countdown started');
  };

  useEffect(() => {
    let timer;
    if (flightState === 'countdown') {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setFlightState('ignited');
            setThrottle(100);
            addTimelineEvent('T-0.0s: Engine Ignition');
            setTimeout(() => {
              setFlightState('flight');
              addTimelineEvent('T+0.0s: Liftoff! Go Mission Control!');
            }, 1000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [flightState]);

  useEffect(() => {
    if (flightState !== 'flight') {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
      }
      return;
    }

    if (!simulationRef.current) {
      const dt = 0.1;
      const intervalMs = 100;
      
      simulationRef.current = setInterval(() => {
        const simDt = dt * timeWarp;

        setFlightTime(prevTime => {
          const nextTime = prevTime + simDt;
          setStageFuels(prevFuels => {
            setPosition(prevPos => {
              setVelocity(prevVel => {
                setThrottle(prevThrottle => {
                  setPitch(prevPitch => {
                    const specs = rocketStats.stageSpecs;
                    const activeSpec = specs[activeStage];
                    let activeFuel = prevFuels[activeStage] || 0;
                    let thrust = 0;
                    let burnDurationRate = 0;
                    
                    if (activeFuel > 0 && prevThrottle > 0 && activeSpec && activeSpec.thrust > 0) {
                      thrust = activeSpec.thrust * (prevThrottle / 100);
                      burnDurationRate = thrust / (activeSpec.ispVac * 9.80665);
                    }

                    const nextFuels = [...prevFuels];
                    if (burnDurationRate > 0) {
                      nextFuels[activeStage] = Math.max(0, activeFuel - burnDurationRate * simDt);
                    }

                    let currentMass = rocketStats.dryMass;
                    nextFuels.forEach(f => { currentMass += f; });

                    const sim = stepPhysics(prevPos, prevVel, currentMass, thrust, prevPitch, simDt);

                    if (sim.crashed) {
                      setFlightState('crashed');
                      addTimelineEvent(`T+${nextTime.toFixed(1)}s: CRITICAL ANOMALY: IMPACT DETECTED.`);
                      setLogs(prev => [{
                        id: `launch-${Date.now()}`,
                        name: `Mission ${logs.length + 1}`,
                        date: new Date().toISOString().split('T')[0],
                        status: 'FAILED',
                        duration: `${nextTime.toFixed(0)}s`,
                        score: 5,
                        notes: `Telemetry terminated at altitude: ${(sim.altitude / 1000).toFixed(2)}km.`
                      }, ...prev]);
                      clearInterval(simulationRef.current);
                      return prevVel;
                    }

                    if (sim.q > maxQ) setMaxQ(sim.q);

                    if (sim.orbitAchieved && flightStateRef.current !== 'orbit') {
                      setFlightState('orbit');
                      addTimelineEvent(`T+${nextTime.toFixed(1)}s: Stable orbit achieved!`);
                      setLogs(prev => [{
                        id: `launch-${Date.now()}`,
                        name: `Mission ${logs.length + 1}`,
                        date: new Date().toISOString().split('T')[0],
                        status: 'SUCCESS',
                        duration: `${nextTime.toFixed(0)}s`,
                        score: 95,
                        notes: `Stable orbit inserted.`
                      }, ...prev]);
                    }

                    setTelemetryHistory(hist => {
                      const sample = { time: nextTime, altitude: sim.altitude, speed: sim.speed, q: sim.q, vx: sim.vel.vx, vy: sim.vel.vy };
                      return hist.length > 150 ? [...hist.slice(1), sample] : [...hist, sample];
                    });

                    return sim.vel;
                  });
                  return prevThrottle;
                });
                return prevVel;
              });
              return prevPos;
            });
            return nextFuels;
          });
          return nextTime;
        });
      }, intervalMs);
    }

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
      }
    };
  }, [flightState, activeStage, timeWarp, rocketStats]);

  const deployPayloadToOrbit = () => {
    if (flightState !== 'orbit') return;
    const name = COMPONENT_TEMPLATES.payload[rocketStages[0].payload]?.name || 'Satellite';
    setActiveMissions(prev => [{
      id: `sat-${Date.now()}`,
      name: `${name} Mark ${activeMissions.length + 1}`,
      orbit: 'LEO',
      fuel: 100,
      status: 'OPERATIONAL'
    }, ...prev]);
    addTimelineEvent(`T+${flightTime.toFixed(1)}s: Payload successfully deployed.`);
  };

  return (
    <MissionContext.Provider value={{
      activeTab, setActiveTab, rocketStages, setRocketStages, rocketStats, activeMissions, setActiveMissions, logs, setLogs,
      weather, rollWeather, checklist, runChecklistTest, runAllChecklists, flightState, setFlightState, countdown, timeWarp, setTimeWarp,
      flightTime, position, setPosition, velocity, setVelocity, pitch, setPitch, throttle, setThrottle, activeStage, stageFuels, setStageFuels,
      solarDeployed, deploySolarPanels, fairingSeparated, separateFairing, telemetryHistory, flightTimeline, maxQ, maxQTime,
      performStageSeparation, resetLaunch, startLaunchSequence, deployPayloadToOrbit, solarActivity, dsnStatus, settings, setSettings
    }}>
      {children}
    </MissionContext.Provider>
  );
}

export const useMission = () => useContext(MissionContext);

// ==========================================
// UI COMPONENTS & WORKSPACE VIEWS
// ==========================================

function DashboardView() {
  const { activeMissions, logs, solarActivity, dsnStatus, setActiveTab } = useMission();
  const successRate = Math.round((logs.filter(l => l.status === 'SUCCESS').length / (logs.length || 1)) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="hud-panel cyan-panel">
          <div className="hud-header" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Constellation</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '12px 0' }}>
            <span className="hud-value" style={{ fontSize: '2.5rem', fontWeight: 800 }}>{activeMissions.length}</span>
            <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>● Tracking</span>
          </div>
        </div>
        <div className="hud-panel">
          <div className="hud-header" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Success Rate</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '12px 0' }}>
            <span className="hud-value" style={{ fontSize: '2.5rem', color: 'var(--success)', fontWeight: 800 }}>{successRate}%</span>
          </div>
        </div>
        <div className="hud-panel warning-panel">
          <div className="hud-header" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Solar Wind</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '12px 0' }}>
            <span className="hud-value" style={{ fontSize: '1.8rem', color: 'var(--warning)', fontWeight: 800 }}>{solarActivity.windSpeed} km/s</span>
          </div>
        </div>
        <div className="hud-panel purple-panel">
          <div className="hud-header" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DSN Status</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '12px 0' }}>
            <span className="hud-value" style={{ fontSize: '1.8rem', color: 'var(--purple)', fontWeight: 800 }}>{dsnStatus}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="hud-panel cyan-panel">
          <h3 className="hud-header">Active Spacecraft</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {activeMissions.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '3px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Orbit: {m.orbit}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="hud-value" style={{ color: 'var(--primary)' }}>Fuel: {m.fuel}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hud-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="hud-header">Launchpad Status</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>Systems aligned. Weather is GO.</p>
          </div>
          <button className="hud-button cyan-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveTab('planner')}>
            Design Mission <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MissionPlannerView() {
  const { rocketStats, setActiveTab } = useMission();
  const [destination, setDestination] = useState('moon');
  const [targetAlt, setTargetAlt] = useState(250);

  const getRequiredDeltaV = () => {
    let dv = 9300;
    if (destination === 'moon') dv += 3100;
    else if (destination === 'mars') dv += 3900;
    return dv;
  };

  const required = getRequiredDeltaV();
  const current = rocketStats.deltaV;
  const passed = current >= required;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
      <div className="hud-panel cyan-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 className="hud-header">Configure Flight Plan</h3>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Destination</label>
          <select value={destination} onChange={(e) => setDestination(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-deep)', color: '#fff', border: '1px solid var(--border)' }}>
            <option value="leo">Low Earth Orbit (LEO)</option>
            <option value="moon">Lunar Orbit</option>
            <option value="mars">Mars Mission</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Orbit Altitude: <span className="hud-value">{targetAlt} km</span></label>
          <input type="range" min="100" max="1000" step="50" value={targetAlt} onChange={(e) => setTargetAlt(Number(e.target.value))} className="slider-control" />
        </div>
      </div>

      <div className="hud-panel">
        <h3 className="hud-header">Delta-v Budget</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Required Delta-V:</span>
            <span className="hud-value">{required.toLocaleString()} m/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Vehicle Capability:</span>
            <span className="hud-value" style={{ color: passed ? 'var(--success)' : 'var(--danger)' }}>{Math.round(current).toLocaleString()} m/s</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', border: `1px solid ${passed ? 'var(--success)' : 'var(--danger)'}`, padding: '10px', borderRadius: '3px', fontSize: '0.85rem' }}>
          {passed ? <span className="text-green-400">Liftoff authorization granted.</span> : <span className="text-red-400">Warning: Insufficient propellant levels.</span>}
        </div>
      </div>
    </div>
  );
}

function RocketDesignerView() {
  const { rocketStages, setRocketStages, rocketStats } = useMission();
  const [selectedStageIdx, setSelectedStageIdx] = useState(0);

  const updateStage = (idx, val) => {
    setRocketStages(rocketStages.map((s, i) => i === idx ? { ...s, ...val } : s));
  };

  const addStage = () => {
    setRocketStages([...rocketStages, { interstage: true, fuelTank: 'medium', engine: 'merlin', boosters: 0 }]);
  };

  const removeStage = (idx) => {
    if (rocketStages.length <= 1) return;
    setRocketStages(rocketStages.filter((_, i) => i !== idx));
    setSelectedStageIdx(0);
  };

  const active = rocketStages[selectedStageIdx];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
        <div className="hud-panel cyan-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 className="hud-header">Stages Stack</h3>
            <button className="hud-button cyan-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={addStage}>
              <Plus size={12} /> Add Stage
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rocketStages.map((s, idx) => (
              <div key={idx} onClick={() => setSelectedStageIdx(idx)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: selectedStageIdx === idx ? 'rgba(163, 176, 135, 0.1)' : 'rgba(255,255,255,0.01)', border: `1px solid ${selectedStageIdx === idx ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer' }}>
                <span>Stage {rocketStages.length - 1 - idx} {idx === 0 ? '(Payload)' : ''}</span>
                {idx > 0 && <Trash2 size={14} onClick={(e) => { e.stopPropagation(); removeStage(idx); }} className="text-red-400" />}
              </div>
            ))}
          </div>
        </div>

        {active && (
          <div className="hud-panel">
            <h3 className="hud-header">Configure Stage Parameters</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              {selectedStageIdx === 0 ? (
                <>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="checkbox" checked={!!active.solar} id="solar" onChange={(e) => updateStage(0, { solar: e.target.checked })} />
                    <label htmlFor="solar">Include Solar Arrays</label>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Payload Objective</label>
                    <select value={active.payload || ''} onChange={(e) => updateStage(0, { payload: e.target.value || null })} style={{ width: '100%', padding: '8px', background: 'var(--bg-deep)', color: '#fff', border: '1px solid var(--border)' }}>
                      <option value="satellite">Communications Satellite</option>
                      <option value="rover">Robotic Rover</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Engine Model</label>
                    <select value={active.engine || ''} onChange={(e) => updateStage(selectedStageIdx, { engine: e.target.value || null })} style={{ width: '100%', padding: '8px', background: 'var(--bg-deep)', color: '#fff', border: '1px solid var(--border)' }}>
                      <option value="merlin">Merlin-1D (Ascent Booster)</option>
                      <option value="vac">Terrier Vacuum Thruster</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fuel Tank Capacity</label>
                    <select value={active.fuelTank || ''} onChange={(e) => updateStage(selectedStageIdx, { fuelTank: e.target.value || null })} style={{ width: '100%', padding: '8px', background: 'var(--bg-deep)', color: '#fff', border: '1px solid var(--border)' }}>
                      <option value="small">Small Tank</option>
                      <option value="medium">Medium Tank</option>
                      <option value="large">Large Tank</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="hud-panel" style={{ flex: 1, padding: 0 }}>
          <RocketCanvas stages={rocketStages} />
        </div>
        <div className="hud-panel purple-panel" style={{ fontSize: '0.85rem' }}>
          <h3 className="hud-header">Performance Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <div>Total Weight: <span className="hud-value">{rocketStats.totalMass.toLocaleString()} kg</span></div>
            <div>Delta-V: <span className="hud-value">{Math.round(rocketStats.deltaV).toLocaleString()} m/s</span></div>
            <div>Liftoff TWR: <span className="hud-value" style={{ color: rocketStats.initialTwr > 1 ? 'var(--success)' : 'var(--danger)' }}>{rocketStats.initialTwr.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LaunchControlView() {
  const { weather, rollWeather, checklist, runChecklistTest, runAllChecklists, flightState, countdown, startLaunchSequence, resetLaunch } = useMission();
  const ready = weather.status === 'GO' && checklist.every(item => item.status === 'NOMINAL');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="hud-panel cyan-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 className="hud-header">Readiness Checks</h3>
            <button className="hud-button cyan-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={runAllChecklists}>Verify All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {checklist.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', border: '1px solid var(--border)' }}>
                <span>{c.name}</span>
                {c.status !== 'NOMINAL' ? <button onClick={() => runChecklistTest(c.id)} className="hud-button" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>Verify</button> : <span style={{ color: 'var(--success)' }}>NOMINAL</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="hud-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 className="hud-header">Weather Status</h3>
            <button className="hud-button" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={rollWeather}><RefreshCw size={12} /> Reroll</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>Temp: {weather.temp}</div>
            <div>Wind: {weather.windSpeed}</div>
          </div>
        </div>
      </div>

      <div className="hud-panel purple-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
        <h3 className="hud-header">Command Center Terminal</h3>
        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '4px', width: '80%', padding: '20px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: flightState === 'countdown' ? 'var(--warning)' : 'var(--primary)' }}>
            {flightState === 'prelaunch' ? 'T-10s' : `T-${countdown}s`}
          </div>
        </div>
        {flightState === 'prelaunch' ? (
          <button className="hud-button cyan-btn" disabled={!ready} style={{ width: '80%', padding: '12px', justifyContent: 'center' }} onClick={startLaunchSequence}>
            Initiate Launch
          </button>
        ) : (
          <button className="hud-button danger-btn" style={{ width: '80%', padding: '12px', justifyContent: 'center' }} onClick={resetLaunch}>
            Abort / Reset
          </button>
        )}
      </div>
    </div>
  );
}

function FlightSimulatorView() {
  const { flightState, flightTime, position, velocity, pitch, setPitch, throttle, setThrottle, activeStage, solarDeployed, deploySolarPanels, telemetryHistory, flightTimeline, performStageSeparation, resetLaunch, deployPayloadToOrbit } = useMission();
  const rVal = Math.sqrt(position.x * position.x + position.y * position.y);
  const altitude = rVal - 6371000;
  const speed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);

  const drawSVG = (key, title, stroke) => {
    if (telemetryHistory.length < 2) return <div style={{ fontSize: '0.8rem', padding: '10px' }}>Waiting...</div>;
    const w = 260, h = 80;
    const pts = telemetryHistory.map((pt, i) => {
      const x = (i / (telemetryHistory.length - 1)) * w;
      const y = h - (pt[key] / (key === 'altitude' ? 300000 : 8000)) * h;
      return `${x},${y}`;
    });
    return (
      <div style={{ background: 'rgba(0,0,0,0.1)', padding: '6px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>{title}</span>
          <span style={{ color: stroke, fontFamily: 'var(--font-mono)' }}>{key === 'altitude' ? `${(altitude/1000).toFixed(1)} km` : `${speed.toFixed(0)} m/s`}</span>
        </div>
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', marginTop: '4px' }}>
          <path d={`M ${pts.join(' L ')}`} fill="none" stroke={stroke} strokeWidth="1.5" />
        </svg>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 280px', gap: '20px', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="hud-panel cyan-panel">
          <h3 className="hud-header">Guidance HUD</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <div>Clock: <span className="hud-value">T+{flightTime.toFixed(1)}s</span></div>
            <div>Phase: <span className="hud-value" style={{ color: 'var(--primary)' }}>{flightState.toUpperCase()}</span></div>
          </div>
        </div>

        <div className="hud-panel">
          <h3 className="hud-header">Controls</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div>
              <label style={{ fontSize: '0.75rem' }}>Throttle: {throttle}%</label>
              <input type="range" min="0" max="100" value={throttle} onChange={(e) => setThrottle(Number(e.target.value))} className="slider-control" />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem' }}>Pitch Angle: {pitch}°</label>
              <input type="range" min="0" max="90" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="slider-control" />
            </div>
            <button className="hud-button danger-btn" style={{ justifyContent: 'center' }} onClick={performStageSeparation} disabled={activeStage <= 0}>Stage Separation</button>
            <button className="hud-button" style={{ justifyContent: 'center' }} onClick={deploySolarPanels} disabled={solarDeployed}>Deploy Solar Arrays</button>
            {flightState === 'orbit' && <button className="hud-button cyan-btn" style={{ justifyContent: 'center' }} onClick={deployPayloadToOrbit}>Deploy Satellite</button>}
            {flightState === 'crashed' && <button className="hud-button cyan-btn" style={{ justifyContent: 'center' }} onClick={resetLaunch}>Resetpad</button>}
          </div>
        </div>
      </div>

      <div className="hud-panel" style={{ padding: 0 }}>
        <OrbitCanvas flightState={flightState} position={position} velocity={velocity} telemetryHistory={telemetryHistory} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="hud-panel">
          <h3 className="hud-header">Telemetry</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {drawSVG('altitude', 'Altitude', '#A3B087')}
            {drawSVG('speed', 'Speed', '#22c55e')}
          </div>
        </div>

        <div className="hud-panel purple-panel" style={{ flex: 1, overflowY: 'auto' }}>
          <h3 className="hud-header">Events log</h3>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            {flightTimeline.map((t, i) => <div key={i}>&gt; {t}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SpacecraftManagerView() {
  const { activeMissions } = useMission();
  const [selectedPlanet, setSelectedPlanet] = useState('earth');
  const info = PLANETS[selectedPlanet] || PLANETS.earth;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="hud-panel cyan-panel" style={{ padding: 0 }}>
          <SolarSystemCanvas activePlanet={selectedPlanet} onSelectPlanet={setSelectedPlanet} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="hud-panel">
          <h3 className="hud-header" style={{ color: info.color }}>{info.name} Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', fontSize: '0.85rem' }}>
            <div>Radius: <span className="hud-value">{(info.radius / 1000).toLocaleString()} km</span></div>
            <div>Gravity: <span className="hud-value">{info.gravity} m/s²</span></div>
            <div>Surface Temp: <span className="hud-value">{info.temp}</span></div>
            <div>Rotation: <span className="hud-value">{info.rotPeriod}</span></div>
            <div>Orbital: <span className="hud-value">{info.orbPeriod}</span></div>
          </div>
        </div>

        <div className="hud-panel purple-panel">
          <h3 className="hud-header">Active Satellites</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '0.8rem' }}>
            {activeMissions.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                <span>{m.name}</span>
                <span className="hud-value">{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrainingAcademyView() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const lessons = [
    { title: 'Launch TWR', text: 'TWR must exceed 1.0 to ascend. Standard operational range is 1.2 to 1.5.', q: 'What is a nominal launch TWR?', opts: ['0.8', '1.3', '4.5'], ans: 1 },
    { title: 'Orbit Physics', text: 'Circular orbit at 200km altitude requires a horizontal velocity of roughly 7,800 m/s.', q: 'To establish orbit you need...', opts: ['Vertical velocity', 'Horizontal velocity', 'High gravity'], ans: 1 }
  ];

  const current = lessons[activeIdx];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px' }}>
      <div className="hud-panel cyan-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 className="hud-header">Lessons</h3>
        {lessons.map((l, i) => (
          <div key={i} onClick={() => { setActiveIdx(i); setSelectedOpt(null); setSubmitted(false); }} style={{ padding: '8px', border: `1px solid ${activeIdx === i ? 'var(--primary)' : 'var(--border)'}`, background: activeIdx === i ? 'rgba(163, 176, 135, 0.1)' : 'rgba(255,255,255,0.01)', cursor: 'pointer', fontSize: '0.85rem' }}>
            {l.title}
          </div>
        ))}
      </div>

      <div className="hud-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <h2 className="hud-header" style={{ color: 'var(--primary)' }}>{current.title}</h2>
          <p style={{ marginTop: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{current.text}</p>
        </div>
        <hr style={{ borderColor: 'var(--border)' }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>{current.q}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {current.opts.map((opt, idx) => (
              <button key={idx} onClick={() => !submitted && setSelectedOpt(idx)} style={{ padding: '8px', background: selectedOpt === idx ? 'rgba(163, 176, 135, 0.1)' : 'rgba(255,255,255,0.01)', border: `1px solid ${selectedOpt === idx ? 'var(--primary)' : 'var(--border)'}`, color: submitted && idx === current.ans ? 'var(--success)' : '#fff', cursor: 'pointer', textAlign: 'left', borderRadius: '3px' }}>
                {opt}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '12px' }}>
            {!submitted ? (
              <button onClick={() => selectedOpt !== null && setSubmitted(true)} className="hud-button cyan-btn" disabled={selectedOpt === null}>Verify</button>
            ) : (
              <button onClick={() => { setSelectedOpt(null); setSubmitted(false); setActiveIdx((activeIdx + 1) % lessons.length); }} className="hud-button">Continue</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MissionLogbookView() {
  const { logs } = useMission();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const log = logs[selectedIdx];

  const exportJSON = () => {
    if (!log) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(log, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `log_${log.id}.json`);
    dl.click();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px' }}>
      <div className="hud-panel cyan-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 className="hud-header">Telemetry Logs</h3>
        {logs.map((l, i) => (
          <div key={l.id} onClick={() => setSelectedIdx(i)} style={{ padding: '8px', cursor: 'pointer', border: `1px solid ${selectedIdx === i ? 'var(--primary)' : 'var(--border)'}`, background: selectedIdx === i ? 'rgba(163, 176, 135, 0.1)' : 'rgba(255,255,255,0.01)', fontSize: '0.85rem' }}>
            {l.name}
          </div>
        ))}
      </div>

      <div className="hud-panel">
        {log ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 className="hud-header">{log.name} Details</h3>
              <button className="hud-button cyan-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={exportJSON}>Export JSON</button>
            </div>
            <div>Status: <span className="hud-value" style={{ color: log.status === 'SUCCESS' ? 'var(--success)' : 'var(--danger)' }}>{log.status}</span></div>
            <div style={{ marginTop: '8px' }}>Notes: {log.notes}</div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)' }}>Launch missions to generate logs.</div>
        )}
      </div>
    </div>
  );
}

function AIAssistant() {
  const { rocketStats, logs } = useMission();
  const [chats, setChats] = useState([{ sender: 'bot', text: 'Awaiting instructions, Director.' }]);
  const [input, setInput] = useState('');

  const send = (txt) => {
    if (!txt.trim()) return;
    setChats(prev => [...prev, { sender: 'user', text: txt }]);
    setInput('');

    setTimeout(() => {
      let reply = "Processing trajectory metrics...";
      const query = txt.toLowerCase();
      if (query.includes('rocket') || query.includes('check')) {
        reply = `Design analysis:\n- TWR: ${rocketStats.initialTwr.toFixed(2)} (${rocketStats.initialTwr >= 1 ? 'Go' : 'No-Go'})\n- Delta-v: ${Math.round(rocketStats.deltaV)} m/s (LEO requires 9,300 m/s).`;
      } else if (query.includes('crash') || query.includes('last')) {
        const last = logs[0];
        reply = last ? `Last launch (${last.name}) status: ${last.status}. Notes: ${last.notes}` : "No recorded telemetry logs found.";
      }
      setChats(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 600);
  };

  return (
    <div className="hud-panel cyan-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px' }}>
      <div className="hud-header" style={{ fontSize: '0.85rem', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>AI Flight assistant</div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0', fontSize: '0.8rem' }}>
        {chats.map((c, i) => (
          <div key={i} style={{ alignSelf: c.sender === 'user' ? 'flex-end' : 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            {c.text}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button onClick={() => send('Check rocket')} className="hud-button" style={{ fontSize: '0.65rem', padding: '4px' }}>Check design</button>
        <button onClick={() => send('Analyze crash')} className="hud-button" style={{ fontSize: '0.65rem', padding: '4px' }}>Analyze last</button>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(input)} style={{ flex: 1, background: 'var(--bg-deep)', border: '1px solid var(--border)', color: '#fff', padding: '6px', borderRadius: '3px', fontSize: '0.8rem' }} />
        <button onClick={() => send(input)} className="hud-button cyan-btn" style={{ padding: '6px' }}><Send size={12} /></button>
      </div>
    </div>
  );
}

// ==========================================
// MAIN ROUTER & APP ENTRY POINT
// ==========================================

function App() {
  const [aiOpen, setAiOpen] = useState(false);
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const t = setInterval(() => setTimeStr(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <MissionProvider>
      <LayoutWrapper aiOpen={aiOpen} setAiOpen={setAiOpen} timeStr={timeStr} />
      <div className="scanlines" />
    </MissionProvider>
  );
}

function LayoutWrapper({ aiOpen, setAiOpen, timeStr }) {
  const { activeTab, setActiveTab, flightState } = useMission();

  const navs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
    { id: 'planner', label: 'Planner', icon: <Compass size={14} /> },
    { id: 'designer', label: 'Designer', icon: <Wrench size={14} /> },
    { id: 'launch', label: 'Launchpad', icon: <Rocket size={14} /> },
    { id: 'simulator', label: 'Telemetry', icon: <Gauge size={14} /> },
    { id: 'spacecraft', label: 'Orbits', icon: <Globe size={14} /> },
    { id: 'academy', label: 'Academy', icon: <GraduationCap size={14} /> },
    { id: 'logbook', label: 'Logbook', icon: <BookOpen size={14} /> }
  ];

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'planner': return <MissionPlannerView />;
      case 'designer': return <RocketDesignerView />;
      case 'launch': return <LaunchControlView />;
      case 'simulator': return <FlightSimulatorView />;
      case 'spacecraft': return <SpacecraftManagerView />;
      case 'academy': return <TrainingAcademyView />;
      case 'logbook': return <MissionLogbookView />;
      default: return <DashboardView />;
    }
  };

  return (
    <>
      <div className="header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="led-indicator green" />
            <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-hud)' }}>OPERATIONS LNK ACTIVE</span>
          </div>
          {flightState === 'crashed' && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>! FLIGHT ANOMALY DETECTED</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{timeStr}</span>
          <button className="hud-button cyan-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setAiOpen(!aiOpen)}>
            <Bot size={12} /> Assistant
          </button>
        </div>
      </div>

      <div className="sidebar-bar">
        <div className="sidebar-nav">
          <div style={{ padding: '0 24px 15px', borderBottom: '1px solid var(--border)', marginBottom: '15px' }}>
            <div className="agency-badge">APEX <span>AERO</span></div>
          </div>
          {navs.map(n => (
            <div key={n.id} onClick={() => setActiveTab(n.id)} className={`nav-item ${activeTab === n.id ? 'active' : ''}`}>
              {n.icon}
              <span>{n.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="main-view" style={{ display: 'grid', gridTemplateColumns: aiOpen ? '1fr 340px' : '1fr', gap: '20px', height: '100%' }}>
        <div style={{ overflowY: 'auto', paddingRight: '5px' }}>{renderView()}</div>
        {aiOpen && <div style={{ height: 'calc(100vh - 120px)' }}><AIAssistant /></div>}
      </div>
    </>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

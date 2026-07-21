export const EARTH = {
  GM: 3.986004418e14, // Gravitational parameter (m^3/s^2)
  RADIUS: 6371000,    // Mean radius (meters)
  ATMOSPHERE_HEIGHT: 80000, // Atmospheric limit (meters)
  SCALE_HEIGHT: 8500, // Scale height for density calculation (meters)
  SEA_LEVEL_DENSITY: 1.225, // kg/m^3
};

export const COMPONENT_TEMPLATES = {
  command: { name: 'Command Module', mass: 1200, dragCoeff: 0.1, cost: 5000, hasBattery: true, batteryCapacity: 200 },
  payload: {
    satellite: { name: 'Comms Sat Payload', mass: 800, cost: 8000 },
    rover: { name: 'Rover Lander Payload', mass: 1500, cost: 15000 },
    telescope: { name: 'Space Telescope Payload', mass: 2000, cost: 25000 },
    supply: { name: 'Supply Capsule Payload', mass: 1200, cost: 6000 },
  },
  fuelTank: {
    small: { name: 'Small Fuel Tank', massDry: 200, massFuel: 1800, capacity: 2000, cost: 1000 },
    medium: { name: 'Medium Fuel Tank', massDry: 500, massFuel: 4500, capacity: 5000, cost: 2200 },
    large: { name: 'Large Fuel Tank', massDry: 1200, massFuel: 10800, capacity: 12000, cost: 5000 },
  },
  engine: {
    merlin: { name: 'Merlin-1D Engine', thrust: 845000, ispSea: 282, ispVac: 311, mass: 470, cost: 3000 },
    vac: { name: 'Vacuum Terrier Engine', thrust: 90000, ispSea: 85, ispVac: 348, mass: 150, cost: 1800 },
    ion: { name: 'Xenon Ion Thruster', thrust: 0.25, ispSea: 10, ispVac: 4300, mass: 50, cost: 8000 },
  },
  booster: {
    solid: { name: 'Solid Rocket Booster', massDry: 3000, massFuel: 12000, thrust: 1200000, isp: 265, cost: 4000 },
  },
  interstage: { standard: { name: 'Decoupler', mass: 150, cost: 500 } },
  solar: { deployable: { name: 'Deployable Solar Arrays', mass: 80, powerGen: 5.0, cost: 1500 } },
  battery: { pack: { name: 'Auxiliary Battery Pack', mass: 50, capacity: 500, cost: 800 } },
  antenna: { dish: { name: 'High-Gain Dish Antenna', mass: 40, range: 4e9, cost: 1200 } }
};

export function calculateRocketStats(stages) {
  if (!stages || stages.length === 0) {
    return { totalMass: 0, dryMass: 0, fuelMass: 0, deltaV: 0, initialTwr: 0, maxThrust: 0, burnTime: 0, estMaxAltitude: 0, stageSpecs: [] };
  }

  let totalMass = 0;
  const stageSpecs = [];
  let carryingMass = 0;
  
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    let dryMass = 0;
    let fuelMass = 0;
    let thrust = 0;
    let ispVac = 300;
    let ispSea = 250;
    
    if (stage.command) dryMass += COMPONENT_TEMPLATES.command.mass;
    if (stage.payload && COMPONENT_TEMPLATES.payload[stage.payload]) dryMass += COMPONENT_TEMPLATES.payload[stage.payload].mass;
    if (stage.fuelTank && COMPONENT_TEMPLATES.fuelTank[stage.fuelTank]) {
      const tank = COMPONENT_TEMPLATES.fuelTank[stage.fuelTank];
      dryMass += tank.massDry;
      fuelMass += tank.massFuel;
    }
    if (stage.engine && COMPONENT_TEMPLATES.engine[stage.engine]) {
      const eng = COMPONENT_TEMPLATES.engine[stage.engine];
      dryMass += eng.mass;
      thrust += eng.thrust;
      ispVac = eng.ispVac;
      ispSea = eng.ispSea;
    }
    if (stage.boosters && stage.boosterType && COMPONENT_TEMPLATES.booster[stage.boosterType]) {
      const boost = COMPONENT_TEMPLATES.booster[stage.boosterType];
      const count = stage.boosters;
      dryMass += boost.massDry * count;
      fuelMass += boost.massFuel * count;
      thrust += boost.thrust * count;
      ispVac = (ispVac * (thrust - boost.thrust * count) + boost.isp * boost.thrust * count) / (thrust || 1);
      ispSea = (ispSea * (thrust - boost.thrust * count) + boost.isp * boost.thrust * count) / (thrust || 1);
    }
    if (stage.interstage) dryMass += COMPONENT_TEMPLATES.interstage.standard.mass;
    if (stage.solar) dryMass += COMPONENT_TEMPLATES.solar.deployable.mass;
    if (stage.battery) dryMass += COMPONENT_TEMPLATES.battery.pack.mass;
    if (stage.antenna) dryMass += COMPONENT_TEMPLATES.antenna.dish.mass;

    const stageTotalMass = dryMass + fuelMass;
    const currentTotalMass = stageTotalMass + carryingMass;
    const currentDryMass = dryMass + carryingMass;
    
    const twr = thrust / (currentTotalMass * 9.80665 || 1);
    const avgIsp = 0.5 * (ispSea + ispVac);
    const deltaV = thrust > 0 && currentTotalMass > currentDryMass
      ? avgIsp * 9.80665 * Math.log(currentTotalMass / currentDryMass)
      : 0;

    const fuelRate = thrust > 0 ? thrust / (ispVac * 9.80665) : 0;
    const burnTime = fuelRate > 0 ? fuelMass / fuelRate : 0;

    stageSpecs.unshift({
      stageNum: stages.length - 1 - i,
      dryMass,
      fuelMass,
      totalMass: stageTotalMass,
      thrust,
      ispSea,
      ispVac,
      twr,
      deltaV,
      burnTime,
    });
    
    carryingMass += stageTotalMass;
  }
  
  totalMass = carryingMass;
  const totalDeltaV = stageSpecs.reduce((sum, s) => sum + s.deltaV, 0);
  const maxThrust = stageSpecs.length > 0 ? stageSpecs[0].thrust : 0;
  const initialTwr = stageSpecs.length > 0 ? stageSpecs[0].twr : 0;
  const estMaxAltitude = initialTwr > 1.0 ? Math.pow(totalDeltaV, 2) / (2 * 9.81 * (initialTwr - 1) || 1) : 0;

  return {
    totalMass,
    dryMass: totalMass - stageSpecs.reduce((sum, s) => sum + s.fuelMass, 0),
    fuelMass: stageSpecs.reduce((sum, s) => sum + s.fuelMass, 0),
    deltaV: totalDeltaV,
    initialTwr,
    maxThrust,
    burnTime: stageSpecs.reduce((sum, s) => sum + s.burnTime, 0),
    estMaxAltitude: Math.min(1000000, estMaxAltitude),
    stageSpecs,
  };
}

export function getAirDensity(alt) {
  if (alt >= EARTH.ATMOSPHERE_HEIGHT) return 0;
  return EARTH.SEA_LEVEL_DENSITY * Math.exp(-alt / EARTH.SCALE_HEIGHT);
}

export function stepPhysics(pos, vel, mass, thrustForce, pitch, dt) {
  const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
  const alt = r - EARTH.RADIUS;
  
  if (alt < 0) {
    return {
      pos: { x: pos.x * (EARTH.RADIUS / r), y: pos.y * (EARTH.RADIUS / r) },
      vel: { vx: 0, vy: 0 },
      acc: { ax: 0, ay: 0 },
      altitude: 0,
      speed: 0,
      drag: 0,
      q: 0,
      g: 9.80665,
      crashed: true,
      orbitAchieved: false
    };
  }

  const gMag = EARTH.GM / (r * r);
  const ux = pos.x / r;
  const uy = pos.y / r;
  const fgx = -gMag * mass * ux;
  const fgy = -gMag * mass * uy;

  const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
  const density = getAirDensity(alt);
  const dragCoeffArea = 0.15;
  const dragMag = 0.5 * density * speed * speed * dragCoeffArea;
  
  let fdx = 0;
  let fdy = 0;
  if (speed > 0) {
    fdx = -dragMag * (vel.vx / speed);
    fdy = -dragMag * (vel.vy / speed);
  }

  const pitchRad = (pitch * Math.PI) / 180;
  const tx = ux * Math.cos(pitchRad) - uy * Math.sin(pitchRad);
  const ty = uy * Math.cos(pitchRad) + ux * Math.sin(pitchRad);
  const ftx = thrustForce * tx;
  const fty = thrustForce * ty;

  const ax = (ftx + fgx + fdx) / mass;
  const ay = (fty + fgy + fdy) / mass;

  const nvx = vel.vx + ax * dt;
  const nvy = vel.vy + ay * dt;
  const nx = pos.x + nvx * dt;
  const ny = pos.y + nvy * dt;

  const vSq = nvx * nvx + nvy * nvy;
  const nr = Math.sqrt(nx * nx + ny * ny);
  const nalt = nr - EARTH.RADIUS;
  
  const epsilon = vSq / 2 - EARTH.GM / nr;
  const h = nx * nvy - ny * nvx;
  const eSq = 1 + (2 * epsilon * h * h) / (EARTH.GM * EARTH.GM);
  const ecc = eSq >= 0 ? Math.sqrt(eSq) : 0;
  const a = -EARTH.GM / (2 * epsilon);
  const rp = a * (1 - ecc);
  const periapsisAlt = rp - EARTH.RADIUS;
  const apoapsisAlt = a * (1 + ecc) - EARTH.RADIUS;
  
  const orbitAchieved = epsilon < 0 && periapsisAlt > 80000;
  const q = 0.5 * density * speed * speed;

  return {
    pos: { x: nx, y: ny },
    vel: { vx: nvx, vy: nvy },
    acc: { ax, ay },
    altitude: nalt,
    speed,
    drag: dragMag,
    q,
    g: gMag,
    crashed: nalt <= 0,
    orbitAchieved,
    orbitalElements: (epsilon < 0) ? { a, ecc, periapsisAlt, apoapsisAlt } : null
  };
}

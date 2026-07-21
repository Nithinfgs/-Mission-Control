export const PLANETS = {
  mercury: { name: 'Mercury', radius: 2439700, gravity: 3.7, temp: '167°C', escapeVel: 4250, rotPeriod: '58.6d', orbPeriod: '88d', color: '#888888', gm: 2.2032e13 },
  venus: { name: 'Venus', radius: 6051800, gravity: 8.87, temp: '464°C', escapeVel: 10360, rotPeriod: '-243d', orbPeriod: '224.7d', color: '#e3bb76', gm: 3.24859e14 },
  earth: { name: 'Earth', radius: 6371000, gravity: 9.807, temp: '15°C', escapeVel: 11186, rotPeriod: '24h', orbPeriod: '365.2d', color: '#2b82c9', gm: 3.986004418e14 },
  moon: { name: 'Moon', radius: 1737400, gravity: 1.62, temp: '-20°C', escapeVel: 2380, rotPeriod: '27.3d', orbPeriod: '27.3d', color: '#cccccc', gm: 4.9048695e12 },
  mars: { name: 'Mars', radius: 3389500, gravity: 3.71, temp: '-63°C', escapeVel: 5027, rotPeriod: '24.6h', orbPeriod: '687d', color: '#c1440e', gm: 4.282837e13 },
  jupiter: { name: 'Jupiter', radius: 69911000, gravity: 24.79, temp: '-108°C', escapeVel: 59500, rotPeriod: '9.9h', orbPeriod: '11.8y', color: '#b07f35', gm: 1.26686534e17 },
  saturn: { name: 'Saturn', radius: 58232000, gravity: 10.44, temp: '-139°C', escapeVel: 35500, rotPeriod: '10.7h', orbPeriod: '29.5y', color: '#e2bf7d', gm: 3.7931187e16 },
  uranus: { name: 'Uranus', radius: 25362000, gravity: 8.69, temp: '-197°C', escapeVel: 21300, rotPeriod: '-17.2h', orbPeriod: '84y', color: '#4b70dd', gm: 5.793939e15 },
  neptune: { name: 'Neptune', radius: 24622000, gravity: 11.15, temp: '-201°C', escapeVel: 23500, rotPeriod: '16.1h', orbPeriod: '164.8y', color: '#274687', gm: 6.836529e15 }
};

export function getCircularVelocity(gm, radius, alt) {
  return Math.sqrt(gm / (radius + alt));
}

export function calculateHohmannTransfer(r1, r2, gm = PLANETS.earth.gm) {
  const a_tx = (r1 + r2) / 2;
  const v1 = Math.sqrt(gm / r1);
  const v2 = Math.sqrt(gm / r2);
  const v_tx1 = Math.sqrt(gm * (2 / r1 - 1 / a_tx));
  const v_tx2 = Math.sqrt(gm * (2 / r2 - 1 / a_tx));
  const dv1 = Math.abs(v_tx1 - v1);
  const dv2 = Math.abs(v2 - v_tx2);
  const totalDv = dv1 + dv2;
  const timeOfFlight = Math.PI * Math.sqrt(Math.pow(a_tx, 3) / gm);
  
  return {
    vStart: v1,
    vTransferStart: v_tx1,
    vTransferEnd: v_tx2,
    vTarget: v2,
    dv1,
    dv2,
    totalDv,
    timeOfFlight,
    transferSemiMajorAxis: a_tx
  };
}

export function getOrbitPoints(a, e, pointsCount = 120) {
  const points = [];
  const b = a * Math.sqrt(1 - e * e);
  const c = a * e;
  for (let i = 0; i <= pointsCount; i++) {
    const theta = (i / pointsCount) * Math.PI * 2;
    const x = a * Math.cos(theta) - c;
    const y = b * Math.sin(theta);
    points.push({ x, y });
  }
  return points;
}

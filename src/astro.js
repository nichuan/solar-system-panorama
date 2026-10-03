// JPL Approximate Positions of the Planets (1800–2050), J2000 ecliptic frame.
// https://ssd.jpl.nasa.gov/planets/approx_pos.html
// The Earth entry is the Earth–Moon barycenter, not the geocenter.
export const bodies = [
  {
    id: 'sun', name: '太阳', english: 'SUN', type: '恒星', color: '#ffc571', glow: '#ef9850', texture: '2k_sun.jpg', renderRadius: 2.55,
    description: '太阳系的中心恒星，拥有整个太阳系超过 99% 的质量。它的引力维系着八大行星的运行。',
    stats: [['平均半径', '约 69.6 万 km'], ['到地球的光行时', '约 8 分 20 秒'], ['表面温度', '约 5,500°C'], ['系统年龄', '约 46 亿年']]
  },
  {
    id: 'mercury', name: '水星', english: 'MERCURY', type: '类地行星', color: '#b7b1a6', glow: '#a7a29b', texture: '2k_mercury.jpg', renderRadius: .36,
    radiusKm: 2439.4, rotationDays: 58.6462, orbitalYears: .2408467, obliquity: .034,
    el: [.38709927,.20563593,7.00497902,252.25032350,77.45779628,48.33076593],
    rate: [.00000037,.00001906,-.00594749,149472.67411175,.16047689,-.12534081],
    description: '离太阳最近的行星。遍布撞击坑的岩石表面记录了太阳系早期的历史。'
  },
  {
    id: 'venus', name: '金星', english: 'VENUS', type: '类地行星', color: '#dfc9a4', glow: '#d9b68a', texture: '2k_venus_atmosphere.jpg', renderRadius: .55,
    radiusKm: 6051.8, rotationDays: -243.018, orbitalYears: .61519726, obliquity: 177.4,
    el: [.72333566,.00677672,3.39467605,181.97909950,131.60246718,76.67984255],
    rate: [.00000390,-.00004107,-.00078890,58517.81538729,.00268329,-.27769418],
    description: '厚重的云层覆盖着金星。它的自转方向与多数行星相反，表面温度极高。'
  },
  {
    id: 'earth', name: '地球', english: 'EARTH', type: '类地行星', color: '#4ba5d9', glow: '#6ec5e9', texture: '2k_earth_daymap.jpg', renderRadius: .61,
    radiusKm: 6371.0084, rotationDays: .99726968, orbitalYears: 1.0000174, obliquity: 23.4,
    el: [1.00000261,.01671123,-.00001531,100.46457166,102.93768193,0],
    rate: [.00000562,-.00004392,-.01294668,35999.37244981,.32327364,0],
    description: '目前已知唯一孕育生命的行星。液态海洋、大气层与磁场共同塑造了蓝色家园。'
  },
  {
    id: 'mars', name: '火星', english: 'MARS', type: '类地行星', color: '#c77953', glow: '#dc805a', texture: '2k_mars.jpg', renderRadius: .46,
    radiusKm: 3389.5, rotationDays: 1.02595676, orbitalYears: 1.8808476, obliquity: 25.2,
    el: [1.52371034,.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],
    rate: [.00001847,.00007882,-.00813131,19140.30268499,.44441088,-.29257343],
    description: '铁氧化物使火星呈现红色。古老河谷、极地冰盖与巨型火山保留了气候变迁的痕迹。'
  },
  {
    id: 'jupiter', name: '木星', english: 'JUPITER', type: '气态巨行星', color: '#d6a981', glow: '#dbaf89', texture: '2k_jupiter.jpg', renderRadius: 2.2,
    radiusKm: 69911, rotationDays: .41354, orbitalYears: 11.862615, obliquity: 3.1,
    el: [5.20288700,.04838624,1.30439695,34.39644051,14.72847983,100.47390909],
    rate: [-.00011607,-.00013253,-.00183714,3034.74612775,.21252668,.20469106],
    description: '太阳系最大的行星。云带沿不同纬度流动，大红斑是一场持续数百年的风暴。'
  },
  {
    id: 'saturn', name: '土星', english: 'SATURN', type: '气态巨行星', color: '#ddc8a0', glow: '#dfc8a8', texture: '2k_saturn.jpg', renderRadius: 1.92,
    radiusKm: 58232, rotationDays: .44401, orbitalYears: 29.447498, obliquity: 26.7,
    el: [9.53667594,.05386179,2.48599187,49.95424423,92.59887831,113.66242448],
    rate: [-.00125060,-.00050991,.00193609,1222.49362201,-.41897216,-.28867794],
    description: '宏伟的环系由无数冰粒与岩屑组成。它本身是一颗密度低于水的气态巨行星。'
  },
  {
    id: 'uranus', name: '天王星', english: 'URANUS', type: '冰巨行星', color: '#9ad4d9', glow: '#a5e3e9', texture: '2k_uranus.jpg', renderRadius: 1.2,
    radiusKm: 25362, rotationDays: -.71833, orbitalYears: 84.016846, obliquity: 97.8,
    el: [19.18916464,.04725744,.77263783,313.23810451,170.95427630,74.01692503],
    rate: [-.00196176,-.00004397,-.00242939,428.48202785,.40805281,.04240589],
    description: '天王星几乎“躺着”绕太阳公转。甲烷吸收红光，使它呈现柔和的蓝绿色。'
  },
  {
    id: 'neptune', name: '海王星', english: 'NEPTUNE', type: '冰巨行星', color: '#5275c6', glow: '#6686df', texture: '2k_neptune.jpg', renderRadius: 1.17,
    radiusKm: 24622, rotationDays: .67125, orbitalYears: 164.79132, obliquity: 28.3,
    el: [30.06992276,.00859048,1.77004347,-55.12002969,44.96476227,131.78422574],
    rate: [.00026291,.00005105,.00035372,218.45945325,-.32241464,-.00508664],
    description: '八大行星中距太阳最远的一颗。深蓝色大气中，强风不断改写云层形态。'
  }
];

const DEG = Math.PI / 180;
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12);

export function clampDate(date) {
  const ms = Math.max(Date.UTC(1800, 0, 1), Math.min(Date.UTC(2050, 11, 31), date.getTime()));
  return new Date(ms);
}

export function centuriesFromJ2000(date) {
  return (date.getTime() - J2000_UNIX_MS) / 86400000 / 36525;
}

export function elementsAt(body, date) {
  const t = centuriesFromJ2000(date);
  return body.el.map((value, index) => value + body.rate[index] * t);
}

function normalizedRadians(degrees) {
  const radians = degrees * DEG;
  return ((radians + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
}

export function solveEccentricAnomaly(meanAnomaly, eccentricity) {
  let E = meanAnomaly + eccentricity * Math.sin(meanAnomaly);
  for (let i = 0; i < 12; i++) {
    const step = (E - eccentricity * Math.sin(E) - meanAnomaly) / (1 - eccentricity * Math.cos(E));
    E -= step;
    if (Math.abs(step) < 1e-12) break;
  }
  return E;
}

export function orbitPoint(body, date, eccentricAnomaly) {
  const [a, e, inclination, , perihelion, node] = elementsAt(body, date);
  const omega = (perihelion - node) * DEG;
  const ascendingNode = node * DEG;
  const i = inclination * DEG;
  const xPrime = a * (Math.cos(eccentricAnomaly) - e);
  const yPrime = a * Math.sqrt(1 - e * e) * Math.sin(eccentricAnomaly);
  const x1 = xPrime * Math.cos(omega) - yPrime * Math.sin(omega);
  const y1 = xPrime * Math.sin(omega) + yPrime * Math.cos(omega);
  const x2 = x1;
  const y2 = y1 * Math.cos(i);
  const z2 = y1 * Math.sin(i);
  const x = x2 * Math.cos(ascendingNode) - y2 * Math.sin(ascendingNode);
  const y = x2 * Math.sin(ascendingNode) + y2 * Math.cos(ascendingNode);
  return [x, z2, y]; // Three.js Y axis is the ecliptic north pole.
}

export function heliocentricPosition(body, date) {
  const [, e, , meanLongitude, perihelion] = elementsAt(body, date);
  const M = normalizedRadians(meanLongitude - perihelion);
  return orbitPoint(body, date, solveEccentricAnomaly(M, e));
}

export function displayPosition(position, mode = 'explore') {
  const r = Math.hypot(...position);
  if (r < 1e-9) return [0, 0, 0];
  const displayRadius = mode === 'distance' ? r * 5 : 4.4 + 9.1 * Math.sqrt(r);
  const scale = displayRadius / r;
  return position.map(value => value * scale);
}

export function formatDistance(au) {
  return `${au.toFixed(au < 2 ? 2 : 1)} AU`;
}

export function planetStats(body, date) {
  if (body.id === 'sun') return body.stats;
  const actual = heliocentricPosition(body, date);
  const distance = Math.hypot(...actual);
  return [
    ['距太阳', formatDistance(distance)],
    ['平均半径', `${Math.round(body.radiusKm).toLocaleString('zh-CN')} km`],
    ['公转周期', body.orbitalYears < 2 ? `${Math.round(body.orbitalYears * 365.25)} 天` : `${body.orbitalYears.toFixed(1)} 年`],
    ['自转周期', `${Math.abs(body.rotationDays).toFixed(body.rotationDays > 10 ? 1 : 2)} 天`]
  ];
}

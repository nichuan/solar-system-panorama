import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { bodies, clampDate, displayPosition, heliocentricPosition, orbitPoint, planetStats } from './astro.js';
import './style.css';

const $ = id => document.getElementById(id);
const base = import.meta.env.BASE_URL;
const textureUrl = filename => `${base}textures/${filename}`;
const sceneHost = $('scene');
const labelsHost = $('labels');
const details = $('detail-panel');
const loading = $('loading');
const bodyObjects = new Map();
const orbitObjects = new Map();
const clickableMeshes = [];
const labelNodes = new Map();
let renderer, scene, camera, controls, asteroidBelt, starDome;
const todayAtNoonUTC = () => { const now = new Date(); return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12)); };
let simDate = clampDate(todayAtNoonUTC());
let speed = 1 / 24;
let playing = true;
let selectedId = 'sun';
let focusedId = null;
let lastFocusPosition = null;
let cameraTween = null;
let scaleMode = 'explore';
let showOrbits = true;
let showLabels = true;
let showAsteroids = true;
let lastOrbitMonth = -1;
let lastUiDay = '';

function boot() {
  try {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(47, innerWidth / innerHeight, .05, 2500);
    camera.position.set(...(innerWidth / innerHeight < .8 ? [0, 135, 198] : [0, 91, 132]));
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    sceneHost.appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = .06;
    controls.minDistance = 3;
    controls.maxDistance = 1200;
    controls.maxPolarAngle = Math.PI - .08;
    controls.minPolarAngle = .08;
    controls.enablePan = true;
    controls.screenSpacePanning = true;

    scene.add(new THREE.AmbientLight(0x99b2d2, .12));
    const sunlight = new THREE.PointLight(0xffe6bd, 330, 0, 1.2);
    sunlight.position.set(0, 0, 0);
    scene.add(sunlight);

    createStarfield();
    createAsteroidBelt();
    createBodies();
    createNavigation();
    wireControls();
    selectBody('sun');
    if (window.matchMedia('(max-width: 760px)').matches) details.hidden = true;
    updateSimulation(true);
    onResize();
    requestAnimationFrame(animate);
    setTimeout(() => { loading.classList.add('hide'); setTimeout(() => loading.remove(), 800); }, 300);
  } catch (error) {
    console.error('Solar system initialization failed', error);
    loading.remove();
    $('error').hidden = false;
  }
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createStarfield() {
  const random = seededRandom(184596);
  const positions = [];
  const colors = [];
  const palette = [new THREE.Color('#f6f9ff'), new THREE.Color('#aac8f4'), new THREE.Color('#fee4bf')];
  for (let i = 0; i < 4800; i++) {
    const u = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const radius = 630 + random() * 50;
    const horizontal = Math.sqrt(1 - u * u);
    positions.push(radius * horizontal * Math.cos(theta), radius * u, radius * horizontal * Math.sin(theta));
    const color = palette[random() < .74 ? 0 : random() < .64 ? 1 : 2].clone();
    color.multiplyScalar(.24 + Math.pow(random(), 6) * .95);
    colors.push(color.r, color.g, color.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 1.15, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: .95, depthWrite: false }));
  scene.add(points);

  // A real photographic panorama is loaded behind the stars when available.
  const loader = new THREE.TextureLoader();
  loader.load(textureUrl('2k_stars_milky_way.jpg'), texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    starDome = new THREE.Mesh(new THREE.SphereGeometry(610, 48, 32), new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false, color: 0x526279, toneMapped: false }));
    starDome.rotation.y = .5;
    scene.add(starDome);
  }, undefined, () => {});
}

function createAsteroidBelt() {
  const random = seededRandom(40005);
  const auPositions = [];
  for (let i = 0; i < 1700; i++) {
    const r = 2.15 + random() * 1.12;
    const theta = random() * Math.PI * 2;
    auPositions.push([r * Math.cos(theta), (random() - .5) * .11, r * Math.sin(theta)]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.userData.auPositions = auPositions;
  const mapped = auPositions.flatMap(position => displayPosition(position, scaleMode));
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(mapped, 3));
  asteroidBelt = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x8e9eb1, size: 1, sizeAttenuation: false, transparent: true, opacity: .5, depthWrite: false }));
  scene.add(asteroidBelt);
}

function radialSprite(inner, outer, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, size * .05, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(.19, outer);
  gradient.addColorStop(1, 'rgba(255,131,43,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSunEffects(group) {
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialSprite('rgba(255,189,92,.9)', 'rgba(255,132,46,.21)'), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  glow.scale.set(16, 16, 1);
  group.add(glow);
  const corona = new THREE.Mesh(new THREE.SphereGeometry(2.75, 48, 32), new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color('#ffad56') } },
    vertexShader: 'varying vec3 vNormal; varying vec3 vEye; void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vEye=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'uniform vec3 color; varying vec3 vNormal; varying vec3 vEye; void main(){float f=pow(1.-abs(dot(normalize(vNormal),normalize(vEye))),2.3);gl_FragColor=vec4(color,f*.58);}',
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide
  }));
  group.add(corona);
}

function createAtmosphere(group, radius, color, strength = .65) {
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.11, 48, 32), new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(color) }, strength: { value: strength } },
    vertexShader: 'varying vec3 vNormal; varying vec3 vEye; void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vEye=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'uniform vec3 glowColor; uniform float strength; varying vec3 vNormal; varying vec3 vEye; void main(){float f=pow(1.-abs(dot(normalize(vNormal),normalize(vEye))),3.0);gl_FragColor=vec4(glowColor,f*strength);}',
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide
  }));
  group.add(atmosphere);
}

function createRings(group, radius, kind) {
  const outer = kind === 'saturn' ? radius * 2.35 : radius * 1.87;
  const inner = kind === 'saturn' ? radius * 1.25 : radius * 1.48;
  const geometry = new THREE.RingGeometry(inner, outer, 256, 4);
  const ringMaterial = new THREE.ShaderMaterial({
    uniforms: { innerRadius: { value: inner }, outerRadius: { value: outer }, isUranus: { value: kind === 'uranus' ? 1 : 0 }, ringMap: { value: null }, hasMap: { value: 0 } },
    vertexShader: 'varying float vRadius; varying vec3 vWorld; void main(){vRadius=length(position.xy);vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}',
    fragmentShader: 'uniform float innerRadius; uniform float outerRadius; uniform int isUranus; uniform sampler2D ringMap; uniform int hasMap; varying float vRadius; varying vec3 vWorld; void main(){float t=(vRadius-innerRadius)/(outerRadius-innerRadius);float bands=sin(t*115.)*.11+sin(t*299.)*.055+sin(t*29.)*.13;float gap=1.-.72*smoothstep(.37,.39,t)*(1.-smoothstep(.43,.45,t));float edge=smoothstep(0.,.055,t)*(1.-smoothstep(.93,1.,t));float alpha=(.36+bands)*gap*edge;vec3 base=mix(vec3(.64,.54,.42),vec3(.83,.76,.62),t*.8+bands);if(isUranus==1){base=vec3(.51,.69,.73);alpha*=.34;}if(hasMap==1){vec4 tex=texture2D(ringMap,vec2(t,.5));base=tex.rgb*1.65;alpha=tex.a*.87;}float lit=.58+.42*max(0.,dot(normalize(-vWorld),vec3(0.,1.,0.)));gl_FragColor=vec4(base*lit,alpha);}',
    transparent: true, depthWrite: false, side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(geometry, ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);
  if (kind === 'saturn') {
    new THREE.TextureLoader().load(textureUrl('2k_saturn_ring_alpha.png'), texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      ringMaterial.uniforms.ringMap.value = texture;
      ringMaterial.uniforms.hasMap.value = 1;
    }, undefined, () => {});
  }
}

function createEarthOverlays(group, radius) {
  const loader = new THREE.TextureLoader();
  loader.load(textureUrl('2k_earth_clouds.jpg'), texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.017, 64, 48), new THREE.ShaderMaterial({
      uniforms: { map: { value: texture } },
      vertexShader: 'varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld; void main(){vUv=uv;vNormal=normalize(mat3(modelMatrix)*normal);vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}',
      fragmentShader: 'uniform sampler2D map; varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld; void main(){vec3 c=texture2D(map,vUv).rgb;float cloud=smoothstep(.2,.72,dot(c,vec3(.333)));float sun=max(0.,dot(normalize(vNormal),normalize(-vWorld)));gl_FragColor=vec4(vec3(.84,.9,.96)*(.38+.62*sun),cloud*.57);}',
      transparent: true, depthWrite: false, side: THREE.FrontSide
    }));
    clouds.name = 'Earth clouds';
    group.add(clouds);
    bodyObjects.get('earth').clouds = clouds;
  }, undefined, () => {});
  loader.load(textureUrl('2k_earth_nightmap.jpg'), texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const lights = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.008, 64, 48), new THREE.ShaderMaterial({
      uniforms: { map: { value: texture } },
      vertexShader: 'varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld; void main(){vUv=uv;vNormal=normalize(mat3(modelMatrix)*normal);vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}',
      fragmentShader: 'uniform sampler2D map; varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld; void main(){vec3 c=texture2D(map,vUv).rgb;float night=1.-smoothstep(-.12,.24,dot(normalize(vNormal),normalize(-vWorld)));float intensity=max(max(c.r,c.g),c.b);gl_FragColor=vec4(c*1.65,night*smoothstep(.07,.42,intensity)*.85);}',
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide
    }));
    group.add(lights);
    bodyObjects.get('earth').nightLights = lights;
  }, undefined, () => {});
}

function createBodies() {
  const textureLoader = new THREE.TextureLoader();
  for (const body of bodies) {
    const anchor = new THREE.Group();
    anchor.name = body.name;
    scene.add(anchor);
    const tilt = new THREE.Group();
    tilt.rotation.z = THREE.MathUtils.degToRad(body.obliquity ?? 0);
    anchor.add(tilt);
    const geometry = new THREE.SphereGeometry(body.renderRadius, body.id === 'sun' ? 64 : 72, 48);
    const material = body.id === 'sun'
      ? new THREE.MeshBasicMaterial({ color: 0xffd398 })
      : new THREE.MeshStandardMaterial({ color: body.color, roughness: 1, metalness: 0 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.bodyId = body.id;
    mesh.rotation.y = Math.PI;
    tilt.add(mesh);
    clickableMeshes.push(mesh);
    bodyObjects.set(body.id, { body, anchor, tilt, mesh });
    if (body.id === 'sun') createSunEffects(anchor);
    if (['earth','venus','uranus','neptune'].includes(body.id)) createAtmosphere(tilt, body.renderRadius, body.glow, body.id === 'earth' ? .72 : .43);
    if (body.id === 'saturn' || body.id === 'uranus') createRings(tilt, body.renderRadius, body.id);
    if (body.id === 'earth') createEarthOverlays(tilt, body.renderRadius);
    textureLoader.load(textureUrl(body.texture), texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      material.map = texture;
      material.color.set(0xffffff);
      material.needsUpdate = true;
      if (body.id === selectedId) setDetailOrb(body);
    }, undefined, () => {});

    const label = document.createElement('div');
    label.className = 'planet-label';
    label.textContent = body.name;
    labelsHost.appendChild(label);
    labelNodes.set(body.id, label);
    if (body.id !== 'sun') {
      const orbit = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x6e91ae, transparent: true, opacity: .22, depthWrite: false }));
      orbitObjects.set(body.id, orbit);
      scene.add(orbit);
    }
  }
}

function createNavigation() {
  const list = $('planet-list');
  for (const body of bodies) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `planet-button ${body.id}`;
    button.dataset.body = body.id;
    button.title = `观察${body.name}`;
    button.style.setProperty('--orb', body.color);
    button.style.setProperty('--glow', body.glow);
    button.innerHTML = '<span class="nav-orb" aria-hidden="true"></span><span></span>';
    button.lastElementChild.textContent = body.name;
    button.addEventListener('click', () => selectBody(body.id, { focus: true }));
    list.appendChild(button);
  }
}

function setDetailOrb(body) {
  const orb = $('detail-orb');
  orb.style.backgroundImage = `url("${textureUrl(body.texture)}")`;
  orb.style.backgroundSize = 'cover';
  orb.style.backgroundPosition = '50% 50%';
  orb.style.backgroundColor = body.color;
  orb.style.boxShadow = `inset -19px -5px 25px #000b, 0 0 24px ${body.glow}66`;
}

function selectBody(id, options = {}) {
  const object = bodyObjects.get(id);
  if (!object) return;
  selectedId = id;
  details.hidden = false;
  const body = object.body;
  $('detail-index').textContent = `${String(bodies.indexOf(body) + 1).padStart(2, '0')} / 09`;
  $('detail-kind').textContent = `${body.type} · ${body.english}`;
  $('detail-name').textContent = body.name;
  $('detail-description').textContent = body.description;
  $('detail-stats').replaceChildren(...planetStats(body, simDate).map(([label, value]) => {
    const item = document.createElement('div');
    item.className = 'stat';
    const key = document.createElement('span');
    key.textContent = label;
    const content = document.createElement('strong');
    content.textContent = value;
    item.append(key, content);
    return item;
  }));
  setDetailOrb(body);
  document.querySelectorAll('.planet-button').forEach(button => {
    button.classList.toggle('active', button.dataset.body === id);
    button.setAttribute('aria-pressed', String(button.dataset.body === id));
  });
  labelNodes.forEach((label, key) => label.classList.toggle('selected', key === id));
  orbitObjects.forEach((orbit, key) => {
    orbit.material.opacity = key === id ? .55 : .22;
    orbit.material.color.set(key === id ? 0x9ad8ee : 0x6e91ae);
  });
  $('focus-btn').textContent = id === 'sun' ? '靠近太阳' : `靠近${body.name}`;
  if (options.focus) focusOn(id);
}

function focusOn(id) {
  const object = bodyObjects.get(id);
  if (!object) return;
  const target = object.anchor.position.clone();
  const direction = camera.position.clone().sub(controls.target).normalize();
  const distance = id === 'sun' ? 12 : Math.max(4.5, object.body.renderRadius * 5.2 + 2.2);
  cameraTween = { startCamera: camera.position.clone(), startTarget: controls.target.clone(), endCamera: target.clone().addScaledVector(direction, distance), endTarget: target, start: performance.now() };
  focusedId = id;
  lastFocusPosition = target.clone();
}

function overview() {
  focusedId = null;
  lastFocusPosition = null;
  const portrait = innerWidth / innerHeight < .8;
  const end = scaleMode === 'distance'
    ? new THREE.Vector3(0, portrait ? 455 : 235, portrait ? 670 : 340)
    : new THREE.Vector3(0, portrait ? 135 : 91, portrait ? 198 : 132);
  cameraTween = { startCamera: camera.position.clone(), startTarget: controls.target.clone(), endCamera: end, endTarget: new THREE.Vector3(), start: performance.now() };
}

function updateOrbits(force = false) {
  const monthKey = simDate.getUTCFullYear() * 12 + simDate.getUTCMonth();
  if (!force && monthKey === lastOrbitMonth) return;
  lastOrbitMonth = monthKey;
  for (const body of bodies.slice(1)) {
    const points = [];
    for (let i = 0; i < 256; i++) {
      const anomaly = (i / 256) * Math.PI * 2;
      points.push(new THREE.Vector3(...displayPosition(orbitPoint(body, simDate, anomaly), scaleMode)));
    }
    const orbit = orbitObjects.get(body.id);
    orbit.geometry.dispose();
    orbit.geometry = new THREE.BufferGeometry().setFromPoints(points);
    orbit.visible = showOrbits;
  }
}

function updateSimulation(forceOrbits = false) {
  for (const body of bodies.slice(1)) {
    const object = bodyObjects.get(body.id);
    const position = displayPosition(heliocentricPosition(body, simDate), scaleMode);
    object.anchor.position.set(...position);
    const daysSinceJ2000 = (simDate.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
    // Retrograde obliquity already reverses the apparent axis; avoid reversing it twice.
    const rotationDays = body.obliquity > 90 ? Math.abs(body.rotationDays) : body.rotationDays;
    object.mesh.rotation.y = Math.PI + ((daysSinceJ2000 / rotationDays) % 1) * Math.PI * 2;
    if (object.clouds) object.clouds.rotation.y = object.mesh.rotation.y + .12;
    if (object.nightLights) object.nightLights.rotation.y = object.mesh.rotation.y;
  }
  updateOrbits(forceOrbits);
  const uiDay = simDate.toISOString().slice(0, 10);
  const dateChanged = uiDay !== lastUiDay;
  if (dateChanged) {
    lastUiDay = uiDay;
    updateDateUI();
  }
  if (selectedId && (forceOrbits || dateChanged)) {
    const body = bodyObjects.get(selectedId).body;
    const stats = planetStats(body, simDate);
    $('detail-stats').querySelectorAll('.stat strong').forEach((node, i) => { node.textContent = stats[i][1]; });
  }
}

function updateDateUI() {
  const year = simDate.getUTCFullYear();
  const month = simDate.getUTCMonth() + 1;
  const day = simDate.getUTCDate();
  $('date-caption').textContent = `公元 ${year} 年 ${month} 月 ${day} 日`;
  const value = simDate.toISOString().slice(0, 10);
  if ($('date-input').value !== value) $('date-input').value = value;
}

function updateLabels() {
  labelsHost.style.display = showLabels ? 'block' : 'none';
  if (!showLabels) return;
  const width = sceneHost.clientWidth;
  const height = sceneHost.clientHeight;
  const projected = new THREE.Vector3();
  for (const [id, label] of labelNodes) {
    const object = bodyObjects.get(id);
    projected.copy(object.anchor.position).add(new THREE.Vector3(0, object.body.renderRadius * 1.2 + .16, 0)).project(camera);
    const onScreen = projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < 1.07 && Math.abs(projected.y) < 1.07;
    label.style.opacity = onScreen && focusedId !== id ? '1' : '0';
    label.style.left = `${(projected.x * .5 + .5) * width}px`;
    label.style.top = `${(-projected.y * .5 + .5) * height}px`;
  }
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;

function wireControls() {
  $('overview-btn').addEventListener('click', overview);
  $('focus-btn').addEventListener('click', () => focusOn(selectedId));
  $('detail-close').addEventListener('click', () => { details.hidden = true; });
  $('settings-btn').addEventListener('click', event => {
    event.stopPropagation();
    const panel = $('settings-panel');
    panel.hidden = !panel.hidden;
    $('settings-btn').setAttribute('aria-expanded', String(!panel.hidden));
  });
  document.addEventListener('click', event => {
    if (!$('settings-panel').contains(event.target) && event.target !== $('settings-btn')) {
      $('settings-panel').hidden = true;
      $('settings-btn').setAttribute('aria-expanded', 'false');
    }
  });
  $('orbits-toggle').addEventListener('change', event => {
    showOrbits = event.target.checked;
    orbitObjects.forEach(orbit => orbit.visible = showOrbits);
  });
  $('labels-toggle').addEventListener('change', event => { showLabels = event.target.checked; });
  $('asteroids-toggle').addEventListener('change', event => { showAsteroids = event.target.checked; asteroidBelt.visible = showAsteroids; });
  $('scale-select').addEventListener('change', event => {
    scaleMode = event.target.value;
    const positions = asteroidBelt.geometry.userData.auPositions.flatMap(position => displayPosition(position, scaleMode));
    asteroidBelt.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    updateSimulation(true);
    overview();
  });
  $('play-btn').addEventListener('click', () => setPlaying(!playing));
  $('speed-select').addEventListener('change', event => {
    speed = Number(event.target.value);
    setPlaying(speed > 0);
  });
  $('date-input').addEventListener('change', event => {
    const newDate = new Date(`${event.target.value}T12:00:00Z`);
    if (Number.isFinite(newDate.getTime())) {
      simDate = clampDate(newDate);
      updateSimulation(true);
    }
  });
  $('today-btn').addEventListener('click', () => { simDate = clampDate(todayAtNoonUTC()); updateSimulation(true); });
  renderer.domElement.addEventListener('pointerdown', event => { pointerDown = { x: event.clientX, y: event.clientY }; });
  renderer.domElement.addEventListener('pointerup', event => {
    if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(clickableMeshes, false);
    if (hits.length) selectBody(hits[0].object.userData.bodyId, { focus: true });
  });
  document.addEventListener('keydown', event => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    if (event.code === 'Space') { event.preventDefault(); setPlaying(!playing); }
    if (event.key === 'Escape') { overview(); $('settings-panel').hidden = true; }
  });
  window.addEventListener('resize', onResize);
}

function setPlaying(value) {
  playing = value && speed > 0;
  $('play-icon').textContent = playing ? 'Ⅱ' : '▶';
  $('play-btn').setAttribute('aria-label', playing ? '暂停模拟' : '继续模拟');
  $('play-btn').title = playing ? '暂停' : '播放';
  $('sim-status').textContent = playing ? '模拟运行中' : '时间已暂停';
}

function onResize() {
  const width = sceneHost.clientWidth;
  const height = sceneHost.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

let lastFrame = performance.now();
let uiAccumulated = 0;
function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min((now - lastFrame) / 1000, .1);
  lastFrame = now;
  if (playing && speed) {
    const next = simDate.getTime() + delta * speed * 86400000;
    if (next > Date.UTC(2050, 11, 31)) setPlaying(false);
    else { simDate = new Date(next); updateSimulation(); }
  }
  const sun = bodyObjects.get('sun');
  sun.mesh.rotation.y += delta * .035;
  if (cameraTween) {
    const t = Math.min((now - cameraTween.start) / 1100, 1);
    const eased = t * t * (3 - 2 * t);
    camera.position.copy(cameraTween.startCamera).lerp(cameraTween.endCamera, eased);
    controls.target.copy(cameraTween.startTarget).lerp(cameraTween.endTarget, eased);
    if (t >= 1) cameraTween = null;
  } else if (focusedId) {
    const current = bodyObjects.get(focusedId).anchor.position;
    const displacement = current.clone().sub(lastFocusPosition);
    camera.position.add(displacement);
    controls.target.add(displacement);
    lastFocusPosition.copy(current);
  }
  controls.update();
  renderer.render(scene, camera);
  uiAccumulated += delta;
  if (uiAccumulated > .04) { updateLabels(); uiAccumulated = 0; }
}

boot();

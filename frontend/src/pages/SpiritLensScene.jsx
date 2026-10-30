
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Orbit,
  RotateCcw,
  Rocket,
  Satellite,
  SkipForward,
  Sparkles,
} from "lucide-react";
import * as THREE from "three";

const TEXTURE_PATH = "/textures/planets/";

const PLANETS = [
  {
    id: "earth",
    name: "Earth",
    label: "THE BLUE MARBLE",
    texture: "earth-day.jpg",
    description:
      "Our homeworld. The expedition begins above the blue horizon.",
    desktop: [-8.1, -1.12, -1.0],
    mobile: [-2.12, -1.22, -0.8],
    scale: 0.82,
    mobileScale: 0.43,
    speed: 0.035,
    color: 0x4c9fe0,
    role: "ORIGIN",
  },
  {
    id: "moon",
    name: "The Moon",
    label: "LUNAR FRONTIER",
    texture: "moon.jpg",
    description:
      "A cratered satellite, rendered with a real lunar surface map.",
    desktop: [-4.55, 1.55, -0.3],
    mobile: [-1.18, 1.55, -0.3],
    scale: 0.3,
    mobileScale: 0.17,
    speed: 0.012,
    color: 0xb7c3d5,
    role: "SATELLITE",
  },
  {
    id: "mars",
    name: "Mars",
    label: "THE RED PLANET",
    texture: "mars.jpg",
    description:
      "A rusty world of impact craters and ancient geological terrain.",
    desktop: [-1.0, -1.55, -0.2],
    mobile: [-0.03, -1.65, -0.25],
    scale: 0.48,
    mobileScale: 0.28,
    speed: 0.027,
    color: 0xd76e53,
    role: "FRONTIER 01",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    label: "THE GAS GIANT",
    texture: "jupiter.jpg",
    description:
      "Atmospheric bands and enormous storms mark this colossal world.",
    desktop: [3.35, 1.05, -1.1],
    mobile: [1.1, 1.4, -0.8],
    scale: 1.02,
    mobileScale: 0.49,
    speed: 0.016,
    color: 0xd6b18a,
    role: "FRONTIER 02",
  },
  {
    id: "saturn",
    name: "Saturn",
    label: "THE RINGED WORLD",
    texture: "saturn.jpg",
    desktop: [8.0, -0.68, -1.2],
    mobile: [2.12, -0.68, -0.9],
    description:
      "A luminous ring system brings our first cinematic route to its final stop.",
    scale: 0.83,
    mobileScale: 0.43,
    speed: 0.019,
    color: 0xe1c79f,
    role: "FRONTIER 03",
  },
];

const clamp01 = (value) => Math.max(0, Math.min(1, value));

function smoothstep(value, start, end) {
  const amount = clamp01((value - start) / (end - start));
  return amount * amount * (3 - 2 * amount);
}

function loadTexture(loader, filename, renderer) {
  const texture = loader.load(
    `${TEXTURE_PATH}${filename}`,
    undefined,
    undefined,
    () => {
      console.warn(
        `Could not load planet texture: ${filename}. Check public/textures/planets.`,
      );
    },
  );

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(
    8,
    renderer.capabilities.getMaxAnisotropy(),
  );

  return texture;
}

function createAtmosphere(color, strength = 0.7, radius = 1.055) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: {
        value: new THREE.Color(color),
      },
      glowStrength: {
        value: strength,
      },
    },

    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec4 viewPosition =
          modelViewMatrix * vec4(position, 1.0);

        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -viewPosition.xyz;

        gl_Position =
          projectionMatrix * viewPosition;
      }
    `,

    fragmentShader: `
      uniform vec3 glowColor;
      uniform float glowStrength;

      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        float fresnel = pow(
          1.0 - max(
            dot(
              normalize(vNormal),
              normalize(vViewPosition)
            ),
            0.0
          ),
          2.8
        );

        gl_FragColor = vec4(
          glowColor,
          fresnel * glowStrength
        );
      }
    `,

    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  });

  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 64),
    material,
  );
}

function makePlanet(planet, loader, renderer) {
  const group = new THREE.Group();
  group.name = planet.name;

  const surfaceMap = loadTexture(
    loader,
    planet.texture,
    renderer,
  );

  const material = new THREE.MeshStandardMaterial({
    map: surfaceMap,
    color: 0xffffff,
    roughness: planet.id === "earth" ? 0.88 : 0.94,
    metalness: 0.015,
  });

  if (planet.id === "earth") {
    const nightMap = loadTexture(
      loader,
      "earth-night.jpg",
      renderer,
    );

    material.emissive = new THREE.Color(0xf7be69);
    material.emissiveMap = nightMap;
    material.emissiveIntensity = 0.58;
  }

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 96, 72),
    material,
  );

  group.add(sphere);
  group.userData.surface = sphere;

  if (planet.id === "earth") {
    const cloudsMap = loadTexture(
      loader,
      "earth-clouds.jpg",
      renderer,
    );

    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.012, 80, 64),
      new THREE.MeshStandardMaterial({
        map: cloudsMap,
        alphaMap: cloudsMap,
        color: 0xffffff,
        transparent: true,
        opacity: 0.24,
        roughness: 1,
        depthWrite: false,
      }),
    );

    clouds.renderOrder = 2;
    group.add(clouds);
    group.userData.clouds = clouds;

    group.add(createAtmosphere(0x5ba8ff, 0.95, 1.075));
  }

  if (planet.id === "mars") {
    group.add(createAtmosphere(0xd96b48, 0.17, 1.07));
  }

  if (planet.id === "saturn") {
    const ringMap = loadTexture(
      loader,
      "saturn-ring.png",
      renderer,
    );

    const ringMaterial = new THREE.MeshStandardMaterial({
      map: ringMap,
      color: 0xe6d4b5,
      roughness: 0.88,
      metalness: 0.06,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.84,
      depthWrite: false,
    });

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 2.05, 180),
      ringMaterial,
    );

    ring.rotation.x = 1.12;
    ring.rotation.y = 0.06;
    ring.renderOrder = 3;

    group.add(ring);
    group.userData.rings = ring;
  }

  group.scale.setScalar(0.0001);

  return group;
}

function createRocket() {
  const rocket = new THREE.Group();
  rocket.name = "Spirit Lens expedition craft";

  const hull = new THREE.MeshStandardMaterial({
    color: 0xe8e5dc,
    metalness: 0.58,
    roughness: 0.28,
  });

  const gold = new THREE.MeshStandardMaterial({
    color: 0xe9b15d,
    metalness: 0.78,
    roughness: 0.23,
  });

  const red = new THREE.MeshStandardMaterial({
    color: 0xb94336,
    metalness: 0.35,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });

  const engineMetal = new THREE.MeshStandardMaterial({
    color: 0x616a77,
    metalness: 0.84,
    roughness: 0.3,
  });

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x9bd9ff,
    metalness: 0.2,
    roughness: 0.13,
    emissive: 0x245a80,
    emissiveIntensity: 0.65,
    clearcoat: 1,
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.16, 0.74, 28),
    hull,
  );

  body.position.y = -0.03;
  rocket.add(body);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.42, 28),
    hull,
  );

  nose.position.y = 0.55;
  rocket.add(nose);

  const noseTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 14, 12),
    gold,
  );

  noseTip.position.y = 0.76;
  rocket.add(noseTip);

  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.19, 0.17, 24),
    engineMetal,
  );

  engine.position.y = -0.47;
  rocket.add(engine);

  // Metallic body bands.
  [0.19, -0.22].forEach((y) => {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.145, 0.014, 8, 32),
      gold,
    );

    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    rocket.add(band);
  });

  // Viewing window.
  const windowFrame = new THREE.Mesh(
    new THREE.TorusGeometry(0.076, 0.018, 12, 32),
    gold,
  );

  windowFrame.position.set(0, 0.12, 0.132);
  rocket.add(windowFrame);

  const windowGlass = new THREE.Mesh(
    new THREE.SphereGeometry(0.064, 24, 18),
    glass,
  );

  windowGlass.position.set(0, 0.12, 0.135);
  rocket.add(windowGlass);

  // Aerodynamic fins built from 3D extruded shapes.
  const finShape = new THREE.Shape();

  finShape.moveTo(0.105, -0.22);
  finShape.lineTo(0.33, -0.43);
  finShape.lineTo(0.12, -0.39);
  finShape.closePath();

  const finGeometry = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.012,
    bevelThickness: 0.012,
  });

  const leftFin = new THREE.Mesh(finGeometry, red);
  leftFin.position.z = -0.025;
  rocket.add(leftFin);

  const rightFin = new THREE.Mesh(finGeometry, red);
  rightFin.scale.x = -1;
  rightFin.position.z = -0.025;
  rocket.add(rightFin);

  const sideFinA = new THREE.Mesh(finGeometry, red);
  sideFinA.rotation.y = Math.PI / 2;
  sideFinA.position.z = 0.02;
  rocket.add(sideFinA);

  const sideFinB = new THREE.Mesh(finGeometry, red);
  sideFinB.rotation.y = -Math.PI / 2;
  sideFinB.position.z = 0.02;
  rocket.add(sideFinB);

  // Two layered engine plumes with additive glow.
  const outerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.19, 0.91, 20),
    new THREE.MeshBasicMaterial({
      color: 0xff762c,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );

  outerFlame.position.y = -0.89;
  rocket.add(outerFlame);

  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.105, 0.64, 18),
    new THREE.MeshBasicMaterial({
      color: 0xffedbd,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );

  innerFlame.position.y = -0.78;
  rocket.add(innerFlame);

  rocket.userData.outerFlame = outerFlame;
  rocket.userData.innerFlame = innerFlame;

  rocket.scale.setScalar(0.72);

  return rocket;
}

function createStarfield() {
  const count = 3000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 105;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 72;
    positions[i * 3 + 2] = -12 - Math.random() * 58;

    const warm = Math.random() > 0.78;
    const color = new THREE.Color(
      warm ? 0xffd9a0 : 0xb9d7ff,
    );

    const brightness = 0.35 + Math.random() * 0.65;

    colors[i * 3] = color.r * brightness;
    colors[i * 3 + 1] = color.g * brightness;
    colors[i * 3 + 2] = color.b * brightness;
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );

  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(colors, 3),
  );

  geometry.boundingSphere = new THREE.Sphere(
    new THREE.Vector3(0, 0, -25),
    90,
  );

  const material = new THREE.PointsMaterial({
    size: 0.048,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    depthWrite: false,
  });

  return new THREE.Points(geometry, material);
}

function makeNebulaTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(
    128, 128, 2,
    128, 128, 128,
  );

  gradient.addColorStop(0, "rgba(108, 126, 209, 0.3)");
  gradient.addColorStop(0.32, "rgba(79, 85, 166, 0.14)");
  gradient.addColorStop(0.7, "rgba(62, 60, 121, 0.035)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

function addNebula(scene, texture, x, y, z, width, height, tint) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      color: tint,
      transparent: true,
      opacity: 0.66,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );

  sprite.position.set(x, y, z);
  sprite.scale.set(width, height, 1);
  scene.add(sprite);

  return sprite;
}

export default function SpiritLensScene() {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const startTimeRef = useRef(0);
  const phaseRef = useRef("launch");

  const [phase, setPhase] = useState("launch");
  const [runKey, setRunKey] = useState(0);
  const [selectedPlanetId, setSelectedPlanetId] = useState("earth");
  const [graphicsError, setGraphicsError] = useState(false);

  const selectedPlanet =
    PLANETS.find((planet) => planet.id === selectedPlanetId) ??
    PLANETS[0];

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;

    if (!host || !canvas) return undefined;

    let renderer;
    let animationFrame = 0;
    let resizeObserver;
    let disposed = false;

    setGraphicsError(false);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    phaseRef.current = reducedMotion ? "orbit" : "launch";
    setPhase(phaseRef.current);

    startTimeRef.current =
      performance.now() - (reducedMotion ? 7300 : 0);

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch (error) {
      console.error("Three.js could not initialize WebGL:", error);
      setGraphicsError(true);
      return undefined;
    }

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.75),
    );

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0x050914, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050914, 0.003);

    const camera = new THREE.PerspectiveCamera(
      38,
      1,
      0.1,
      180,
    );

    camera.position.set(0, 0.12, 12.8);
    camera.lookAt(0, 0, 0);

    // Atmospheric fill and cinematic key lights.
    scene.add(
      new THREE.HemisphereLight(
        0x9fc6ff,
        0x211b23,
        1.25,
      ),
    );

    const keyLight = new THREE.DirectionalLight(
      0xffe2c1,
      3.5,
    );

    keyLight.position.set(-7, 6, 11);
    scene.add(keyLight);

    const coolRim = new THREE.DirectionalLight(
      0x6597ff,
      2.7,
    );

    coolRim.position.set(5, 2, -8);
    scene.add(coolRim);

    const goldFill = new THREE.PointLight(
      0xffac5a,
      14,
      22,
    );

    goldFill.position.set(1, -3, 3);
    scene.add(goldFill);

    // Background stars and low-opacity nebulae.
    const stars = createStarfield();
    scene.add(stars);

    const nebulaTexture = makeNebulaTexture();

    const nebulaA = addNebula(
      scene, nebulaTexture,
      -7, 4, -22, 15, 9, 0x7086dc,
    );

    const nebulaB = addNebula(
      scene, nebulaTexture,
      7, -3, -25, 17, 11, 0x9b667f,
    );

    const nebulaC = addNebula(
      scene, nebulaTexture,
      1, 7, -32, 20, 10, 0x6079bb,
    );

    const loader = new THREE.TextureLoader();

    const planetInstances = PLANETS.map((planet) => {
      const group = makePlanet(planet, loader, renderer);
      scene.add(group);

      return {
        ...planet,
        group,
        targetPosition: new THREE.Vector3(),
      };
    });

    const earth = planetInstances.find(
      (planet) => planet.id === "earth",
    );

    const rocket = createRocket();
    scene.add(rocket);

    // Engine trail points are updated continuously from the
    // recent rocket positions to create a coherent exhaust wake.
    const TRAIL_COUNT = 180;
    const trailPositions = new Float32Array(TRAIL_COUNT * 3);
    const trailColors = new Float32Array(TRAIL_COUNT * 3);

    const trailGeometry = new THREE.BufferGeometry();

    trailGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(trailPositions, 3),
    );

    trailGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(trailColors, 3),
    );

    trailGeometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      100,
    );

    for (let i = 0; i < TRAIL_COUNT; i += 1) {
      const age = i / (TRAIL_COUNT - 1);
      const color = new THREE.Color().setHSL(
        0.115 - age * 0.085,
        0.92,
        0.66 - age * 0.30,
      );

      trailColors[i * 3] = color.r;
      trailColors[i * 3 + 1] = color.g;
      trailColors[i * 3 + 2] = color.b;
    }

    const trailPoints = new THREE.Points(
      trailGeometry,
      new THREE.PointsMaterial({
        size: 0.072,
        vertexColors: true,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );

    scene.add(trailPoints);

    const trailHistory = [];

    let routeCurve;
    let routeLine;
    let routeGlow;
    let compact = false;

    const earthStartPosition = new THREE.Vector3(
      0, -4.25, -1.0,
    );

    function rebuildRoute() {
      if (routeLine) {
        scene.remove(routeLine);
        routeLine.geometry.dispose();
        routeLine.material.dispose();
      }

      if (routeGlow) {
        scene.remove(routeGlow);
        routeGlow.geometry.dispose();
        routeGlow.material.dispose();
      }

      const points = planetInstances.map((planet) => {
        return planet.targetPosition
          .clone()
          .setZ(planet.targetPosition.z - 0.35);
      });

      routeCurve = new THREE.CatmullRomCurve3(
        points,
        false,
        "catmullrom",
        0.35,
      );

      // Fine core line.
      routeLine = new THREE.Mesh(
        new THREE.TubeGeometry(
          routeCurve, 200, 0.013, 6, false,
        ),
        new THREE.MeshBasicMaterial({
          color: 0xe6bb7c,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );

      // Diffuse outer light around the route.
      routeGlow = new THREE.Mesh(
        new THREE.TubeGeometry(
          routeCurve, 200, 0.052, 6, false,
        ),
        new THREE.MeshBasicMaterial({
          color: 0xc58a54,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );

      scene.add(routeGlow);
      scene.add(routeLine);
    }

    function resizeScene() {
      if (disposed) return;

      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);

      compact = width < 640;

      renderer.setSize(width, height, false);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      for (const planet of planetInstances) {
        const destination = compact
          ? planet.mobile
          : planet.desktop;

        planet.targetPosition.set(
          destination[0],
          destination[1],
          destination[2],
        );

        planet.group.position.copy(
          planet.targetPosition,
        );
      }

      rebuildRoute();
    }

    resizeScene();

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(resizeScene);
      resizeObserver.observe(host);
    } else {
      window.addEventListener("resize", resizeScene);
    }

    const rocketPosition = new THREE.Vector3();
    const p0 = new THREE.Vector3();
    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    const temp = new THREE.Vector3();
    const tangent = new THREE.Vector3();

    let previousFrame = performance.now();

    function animate(now) {
      if (disposed) return;

      animationFrame = window.requestAnimationFrame(animate);

      const delta = Math.min(
        (now - previousFrame) / 1000,
        0.05,
      );

      previousFrame = now;

      const elapsed = Math.max(
        0,
        (now - startTimeRef.current) / 1000,
      );

      const earthTransition = smoothstep(
        elapsed, 3.15, 6.75,
      );

      const planetReveal = smoothstep(
        elapsed, 4.0, 6.75,
      );

      // Camera pulls back only after the initial ascent.
      const initialCameraZ = compact ? 12.8 : 12.8;
      const finalCameraZ = compact ? 13.1 : 20.0;

      camera.position.z = THREE.MathUtils.lerp(
        initialCameraZ,
        finalCameraZ,
        earthTransition,
      );

      camera.lookAt(0, 0, 0);

      // The large Earth transitions into its final orbit position.
      if (earth) {
        const targetScale = compact
          ? earth.mobileScale
          : earth.scale;

        earth.group.scale.setScalar(
          THREE.MathUtils.lerp(
            compact ? 3.7 : 4.15,
            targetScale,
            earthTransition,
          ),
        );

        earth.group.position.lerpVectors(
          earthStartPosition,
          earth.targetPosition,
          earthTransition,
        );

        earth.group.rotation.y += delta * earth.speed;

        if (earth.group.userData.clouds) {
          earth.group.userData.clouds.rotation.y +=
            delta * 0.012;
        }
      }

      // Reveal the planetary destinations in sequence.
      for (const planet of planetInstances) {
        if (planet.id === "earth") continue;

        const scale = compact
          ? planet.mobileScale
          : planet.scale;

        const individualDelay = {
          moon: 0,
          mars: 0.18,
          jupiter: 0.38,
          saturn: 0.54,
        }[planet.id] ?? 0;

        const reveal = smoothstep(
          elapsed,
          4.0 + individualDelay,
          6.75 + individualDelay,
        );

        planet.group.scale.setScalar(
          Math.max(0.0001, scale * reveal),
        );

        planet.group.rotation.y += delta * planet.speed;

        if (planet.id === "saturn" && planet.group.userData.rings) {
          planet.group.userData.rings.rotation.z =
            0.06 + Math.sin(elapsed * 0.08) * 0.014;
        }
      }

      // Rocket launch, curved transition, then interplanetary flight.
      if (elapsed < 3.15) {
        const lift = smoothstep(
          elapsed, 0.05, 3.15,
        );

        rocket.position.set(
          Math.sin(elapsed * 1.8) * 0.055,
          THREE.MathUtils.lerp(-0.35, 4.48, lift),
          0.65,
        );

        rocket.rotation.z =
          Math.sin(elapsed * 1.5) * 0.018;

        rocket.scale.setScalar(0.72);
      } else if (elapsed < 6.75) {
        const transition = smoothstep(
          elapsed, 3.15, 6.75,
        );

        p0.set(0, 4.45, 0.65);
        p1.set(-1.4, 3.35, 0.55);

        p2.copy(earth.targetPosition);
        p2.add(new THREE.Vector3(0.46, 0.28, 0.55));

        const inverse = 1 - transition;

        temp.set(0, 0, 0);
        temp.addScaledVector(p0, inverse * inverse);
        temp.addScaledVector(p1, 2 * inverse * transition);
        temp.addScaledVector(p2, transition * transition);

        rocket.position.copy(temp);

        const dx =
          2 * inverse * (p1.x - p0.x) +
          2 * transition * (p2.x - p1.x);

        const dy =
          2 * inverse * (p1.y - p0.y) +
          2 * transition * (p2.y - p1.y);

        rocket.rotation.z = Math.atan2(-dx, dy);

        rocket.scale.setScalar(
          THREE.MathUtils.lerp(0.72, 0.20, transition),
        );
      } else if (routeCurve) {
        const progress = reducedMotion
          ? 0.07
          : ((elapsed - 6.75) * 0.055) % 1;

        rocket.position.copy(
          routeCurve.getPointAt(progress),
        );

        // Keep the rocket slightly in front of the route line.
        rocket.position.z += 0.48;

        tangent.copy(
          routeCurve.getTangentAt(progress),
        );

        rocket.rotation.z = Math.atan2(
          -tangent.x,
          tangent.y,
        );

        rocket.scale.setScalar(
          compact ? 0.16 : 0.19,
        );
      }

      // Animated engine flame.
      const flicker = reducedMotion
        ? 1
        : 1 + Math.sin(now * 0.027) * 0.15;

      rocket.userData.outerFlame.scale.y = flicker;
      rocket.userData.innerFlame.scale.y =
        0.84 + Math.sin(now * 0.034 + 1.7) * 0.14;

      // Build a continuous warm particle wake from recent positions.
      rocket.getWorldPosition(rocketPosition);

      trailHistory.unshift(rocketPosition.clone());

      if (trailHistory.length > TRAIL_COUNT) {
        trailHistory.pop();
      }

      const positionAttribute =
        trailGeometry.attributes.position;

      for (let i = 0; i < TRAIL_COUNT; i += 1) {
        const normalizedAge = i / (TRAIL_COUNT - 1);

        const historyIndex = Math.min(
          trailHistory.length - 1,
          Math.floor(
            normalizedAge * (trailHistory.length - 1),
          ),
        );

        const point =
          trailHistory[historyIndex] ?? rocketPosition;

        const spread = normalizedAge * 0.12;

        positionAttribute.setXYZ(
          i,
          point.x +
            Math.sin(i * 0.73 + elapsed * 2.2) * spread,
          point.y -
            normalizedAge * 0.08 +
            Math.cos(i * 0.51 + elapsed * 1.7) * spread,
          point.z +
            Math.sin(i * 0.37 + elapsed) * spread,
        );
      }

      positionAttribute.needsUpdate = true;

      // Slow background drift creates cinematic depth.
      if (!reducedMotion) {
        stars.rotation.y += delta * 0.0017;
        stars.rotation.x += delta * 0.00018;

        nebulaA.material.rotation += delta * 0.002;
        nebulaB.material.rotation -= delta * 0.0015;
        nebulaC.material.rotation += delta * 0.001;
      }

      routeLine.material.opacity = 0.76 * planetReveal;
      routeGlow.material.opacity = 0.16 * planetReveal;

      if (
        elapsed >= 6.9 &&
        phaseRef.current !== "orbit"
      ) {
        phaseRef.current = "orbit";
        setPhase("orbit");
      }

      renderer.render(scene, camera);
    }

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;

      window.cancelAnimationFrame(animationFrame);

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", resizeScene);
      }

      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach((material) => {
            Object.values(material).forEach((value) => {
              if (value && value.isTexture) {
                value.dispose();
              }
            });

            material.dispose();
          });
        }
      });

      renderer.dispose();
    };
  }, [runKey]);

  function skipLaunch() {
    startTimeRef.current = performance.now() - 7300;
    phaseRef.current = "orbit";
    setPhase("orbit");
  }

  function replayLaunch() {
    phaseRef.current = "launch";
    setPhase("launch");
    startTimeRef.current = performance.now();
    setRunKey((key) => key + 1);
  }

  function continueToImageRestoration() {
    document
      .getElementById("spirit-lens-upload")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  return (
    <section
      className="spirit-cinematic"
      data-phase={phase}
      aria-label="Spirit Lens cosmic expedition"
    >
      <div className="spirit-cinema-frame" ref={hostRef}>
        <canvas
          ref={canvasRef}
          className="spirit-cinema-canvas"
          aria-label="Animated 3D rocket launch and planetary journey"
        />

        <div className="spirit-cinema-vignette" />

        <header className="spirit-cinema-hud">
          <div className="spirit-cinema-brand">
            <span className="spirit-cinema-brand-icon">
              <Orbit size={19} />
            </span>

            <div>
              <strong>SPIRIT LENS</strong>
              <span>CELESTIAL EXPEDITION</span>
            </div>
          </div>

          <div className="spirit-cinema-status">
            <span className="spirit-cinema-status-dot" />
            {phase === "launch"
              ? "MISSION INITIATED"
              : "DEEP SPACE"}
          </div>
        </header>

        <div className="spirit-cinema-launch-copy">
          <p className="spirit-cinema-eyebrow">
            <Sparkles size={12} />
            MISSION 001 · DEPARTURE
          </p>

          <h2>
            Beyond the
            <br />
            <em>known sky.</em>
          </h2>

          <p>
            Leaving Earth behind.
            <br />
            Beginning the search for the extraordinary.
          </p>

          <div className="spirit-cinema-telemetry">
            <span>ORIGIN</span>
            <strong>EARTH</strong>
            <span className="spirit-cinema-telemetry-separator" />
            <span>STATUS</span>
            <strong>ASCENDING</strong>
          </div>
        </div>

        <div className="spirit-cinema-orbit-copy">
          <p className="spirit-cinema-eyebrow">
            <Satellite size={12} />
            EXPEDITION MAP · SOLAR SYSTEM
          </p>

          <h2>
            Worlds beyond
            <br />
            <em>our own.</em>
          </h2>

          <p>
            Five celestial stops.
            <br />
            One journey into the unknown.
          </p>
        </div>

        {phase === "launch" ? (
          <button
            type="button"
            className="spirit-cinema-control"
            onClick={skipLaunch}
          >
            Skip launch
            <SkipForward size={14} />
          </button>
        ) : (
          <button
            type="button"
            className="spirit-cinema-control"
            onClick={replayLaunch}
          >
            <RotateCcw size={14} />
            Replay sequence
          </button>
        )}

        <div className="spirit-cinema-launch-status">
          <span className="spirit-cinema-status-dot" />
          <span>
            {phase === "launch"
              ? "ENGINE IGNITION · ASCENT · ORBIT"
              : "ORBIT ESTABLISHED · ROUTE ACTIVE"}
          </span>
          <div className="spirit-cinema-progress">
            <span />
          </div>
        </div>

        {graphicsError && (
          <div className="spirit-cinema-fallback" role="status">
            <Rocket size={30} />
            <strong>3D preview unavailable</strong>
            <span>
              Check browser WebGL support and reload the page.
            </span>
          </div>
        )}
      </div>

      <div className="spirit-cinema-destinations">
        <div className="spirit-cinema-destination-heading">
          <div>
            <p>CHOOSE A CELESTIAL BODY</p>
            <span>Explore the destinations in this cinematic route.</span>
          </div>

          <span className="spirit-cinema-scale-note">
            CINEMATIC SCALE · NOT TO SCALE
          </span>
        </div>

        <nav
          className="spirit-cinema-planet-nav"
          aria-label="Planetary destinations"
        >
          {PLANETS.map((planet, index) => (
            <button
              type="button"
              key={planet.id}
              className={
                selectedPlanetId === planet.id
                  ? "spirit-cinema-planet-button is-active"
                  : "spirit-cinema-planet-button"
              }
              onClick={() => setSelectedPlanetId(planet.id)}
              aria-pressed={selectedPlanetId === planet.id}
            >
              <span className="spirit-cinema-planet-number">
                0{index + 1}
              </span>

              <span className="spirit-cinema-planet-name">
                {planet.name}
              </span>

              <span className="spirit-cinema-planet-role">
                {planet.role}
              </span>
            </button>
          ))}
        </nav>

        <div className="spirit-cinema-selected-world">
          <div>
            <p>{selectedPlanet.label}</p>
            <h3>{selectedPlanet.name}</h3>
            <span>{selectedPlanet.description}</span>
          </div>

          <button
            type="button"
            className="spirit-cinema-continue"
            onClick={continueToImageRestoration}
          >
            Enter Spirit Lens
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <p className="spirit-cinema-attribution">
        Planet texture maps:{" "}
        <a
          href="https://www.solarsystemscope.com/textures/"
          target="_blank"
          rel="noreferrer"
        >
          Solar System Scope
        </a>
        {" "}· CC BY 4.0 · Cinematic positions are illustrative.
      </p>
    </section>
  );
}

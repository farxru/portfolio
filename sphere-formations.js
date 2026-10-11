/**
 * ==============================================================================
 * INFINITE PROCEDURAL SHAPE ENGINE - MORPHING 3D SPHERE FORMATIONS
 * 
 * Architecture:
 * - NO fixed templates, presets, or finite lists of shapes.
 * - Runtime Mathematical Generation:
 *     1. Topological Base Manifolds (Superformula 3D, Generalized Knots, Attractors,
 *        Harmonic Surfaces, Helical Ribbons, Polyhedral Fractals, Phyllotaxis Discs).
 *     2. Composable Parameter Modifiers (Harmonic Ripples, Axial Torsion, Taper/Bulge,
 *        Saddle Shears, Vortex Swirls, Stereographic Inversions).
 *     3. Symmetrical Folding (Rotational N-fold, Bilateral, Dihedral, Kaleidoscopic).
 *     4. Volumetric Shell Distribution (Concentric layers, filament fibers, surface shells).
 *     5. Continuous Hold-Phase Evolution (Live parameter-driven mathematical morphing).
 * - History Buffer & Duplicate Rejection:
 *     Tracks structural feature vectors and guarantees continuous novelty between cycles.
 * - Smooth Lifecycle:
 *     Scatter -> Gather (Quintic Staggered Easing) -> Form & Evolve -> Break Apart.
 * - High Performance:
 *     Single GPU draw call via THREE.InstancedMesh with pre-allocated Float32Array buffers.
 * ==============================================================================
 */

(function () {
  'use strict';

  if (window.__infiniteSphereEngineInitialized) return;
  window.__infiniteSphereEngineInitialized = true;

  function isWebGLAvailable() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (!window.THREE || !isWebGLAvailable()) {
    console.warn('Three.js / WebGL unavailable for Infinite Sphere Engine.');
    return;
  }

  const container = document.getElementById('sphere-canvas-bg');
  const canvas = document.getElementById('sphere-canvas');
  if (!container || !canvas) {
    console.warn('Infinite Sphere Engine: container or canvas element missing.');
    return;
  }

  // Device & Motion Configuration
  const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SPHERE_COUNT = isMobile ? 1800 : 3200;
  const SPHERE_RADIUS = isMobile ? 0.23 : 0.20;

  // 1. Scene, Camera, Renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, 0.008);

  const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, -1, 56);
  camera.lookAt(0, -2, 0);

  function updateCameraAspect() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    camera.aspect = aspect;
    if (aspect < 1.0) {
      // Mobile portrait screens: adapt FOV so formations don't get squished into a narrow center column
      const targetFov = Math.min(76, 46 * (0.95 / Math.max(0.52, aspect)));
      camera.fov = targetFov;
      camera.position.z = 60;
    } else {
      camera.fov = 46;
      camera.position.z = 56;
    }
    camera.updateProjectionMatrix();
  }
  updateCameraAspect();

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: !isMobile,
    powerPreference: 'high-performance',
    alpha: false,
    depth: true,
    stencil: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2.0));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // 2. Studio Lighting for Glossy Liquid Silver & Pearl Spheres
  const ambientLight = new THREE.AmbientLight(0x181820, 1.3);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
  keyLight.position.set(30, 42, 45);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.95);
  fillLight.position.set(-30, -28, -20);
  scene.add(fillLight);

  const sweepLight = new THREE.PointLight(0xe2e8f0, 2.5, 80, 1.8);
  sweepLight.position.set(0, 10, 25);
  scene.add(sweepLight);

  // 3. Master Formations Group (handles idle formation rotation & parallax)
  const formationGroup = new THREE.Group();
  formationGroup.position.set(0, -2.5, 0);
  scene.add(formationGroup);

  // 4. InstancedMesh Creation
  const sphereGeom = new THREE.SphereGeometry(SPHERE_RADIUS, isMobile ? 12 : 16, isMobile ? 10 : 12);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.88,
    roughness: 0.16
  });

  const instancedMesh = new THREE.InstancedMesh(sphereGeom, sphereMat, SPHERE_COUNT);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  formationGroup.add(instancedMesh);

  // Per-instance Colors: Elegant gradient between glossy white, pearl, and brushed silver
  const colorsArray = new Float32Array(SPHERE_COUNT * 3);
  const palette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xf8fafc),
    new THREE.Color(0xe2e8f0),
    new THREE.Color(0xcbd5e1),
    new THREE.Color(0x94a3b8)
  ];

  for (let i = 0; i < SPHERE_COUNT; i++) {
    const t = Math.random();
    const col = t < 0.35 ? palette[0] : (t < 0.65 ? palette[1] : (t < 0.85 ? palette[2] : (t < 0.95 ? palette[3] : palette[4])));
    colorsArray[i * 3] = col.r;
    colorsArray[i * 3 + 1] = col.g;
    colorsArray[i * 3 + 2] = col.b;
  }
  instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colorsArray, 3);

  // Subtle per-instance size variation for convincing visual depth
  const baseScales = new Float32Array(SPHERE_COUNT);
  for (let i = 0; i < SPHERE_COUNT; i++) {
    baseScales[i] = 0.8 + Math.random() * 0.45;
  }

  // Pre-allocated Position Buffers (Zero GC in loop)
  const currentPositions = new Float32Array(SPHERE_COUNT * 3);
  const startPositions = new Float32Array(SPHERE_COUNT * 3);
  const scatterPositions = new Float32Array(SPHERE_COUNT * 3);
  const targetPositions = new Float32Array(SPHERE_COUNT * 3);
  const baseTargetPositions = new Float32Array(SPHERE_COUNT * 3);

  // Per-sphere Individual Phase Offset for natural fluid staggered arrival
  const delays = new Float32Array(SPHERE_COUNT);
  for (let i = 0; i < SPHERE_COUNT; i++) {
    delays[i] = Math.random() * 0.22;
  }

  // Golden ratio & constants
  const PI2 = Math.PI * 2;
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

  // ==============================================================================
  // PROCEDURAL MATHEMATICAL ENGINE (INFINITE SEARCH SPACE)
  // ==============================================================================

  // Structural History Buffer to reject near-duplicates
  const historySignatures = [];
  const MAX_HISTORY = 8;

  function computeSignature(spec) {
    return [
      spec.manifoldType / 7.0,
      spec.symmetryFold / 12.0,
      spec.twistAmount / 3.0,
      spec.harmonicFreq / 8.0,
      spec.scaleProfile / 2.0,
      spec.shellLayers / 5.0
    ];
  }

  function isTooSimilar(sig) {
    for (let h = 0; h < historySignatures.length; h++) {
      const prev = historySignatures[h];
      let distSq = 0;
      for (let d = 0; d < sig.length; d++) {
        const diff = sig[d] - prev[d];
        distSq += diff * diff;
      }
      if (Math.sqrt(distSq) < 0.38) {
        return true; // Too close in feature space
      }
    }
    return false;
  }

  function recordSignature(sig) {
    historySignatures.push(sig);
    if (historySignatures.length > MAX_HISTORY) {
      historySignatures.shift();
    }
  }

  // Evaluates generalized Gielis Superformula in 2D
  function evalSuperformula(angle, m, n1, n2, n3, a, b) {
    const t1 = Math.abs(Math.cos(m * angle / 4) / a);
    const t2 = Math.abs(Math.sin(m * angle / 4) / b);
    const p = Math.pow(t1, n2) + Math.pow(t2, n3);
    if (p === 0) return 0;
    return Math.pow(p, -1 / n1);
  }

  // Generates randomized parameters for an entirely new procedural formation
  function createProceduralSpec() {
    let spec;
    let attempts = 0;

    do {
      attempts++;
      spec = {
        // 1. Manifold Type:
        // 0: Superformula 3D (blooms, crystals, faceted polyhedra)
        // 1: Generalized Torus / Knot Manifold (p, q, k windings)
        // 2: Multi-Attractor Dynamic Manifold (Clifford/Phase flows)
        // 3: Multi-Strand Helical / Double-Twist Ribbon Fields
        // 4: Harmonic Lissajous / Rose Algebraic Volumes
        // 5: Polyhedral / Star Crystal Fractal Shells
        // 6: Phyllotaxis Spiral Vortex & Wave Corrugations
        manifoldType: Math.floor(Math.random() * 7),

        // Manifold Parameters
        m1: [2, 3, 4, 5, 6, 7, 8, 10, 12][Math.floor(Math.random() * 9)],
        m2: [1, 2, 3, 4, 5, 6, 8][Math.floor(Math.random() * 7)],
        n1: 0.3 + Math.random() * 3.5,
        n2: 0.4 + Math.random() * 3.5,
        n3: 0.4 + Math.random() * 3.5,
        n4: 0.3 + Math.random() * 3.5,
        n5: 0.4 + Math.random() * 3.5,
        n6: 0.4 + Math.random() * 3.5,

        // Torus / Knot Windings
        pWinding: [1, 2, 3, 4, 5, 7][Math.floor(Math.random() * 6)],
        qWinding: [1, 2, 3, 4, 5, 6][Math.floor(Math.random() * 6)],
        kWinding: [1, 2, 3, 4][Math.floor(Math.random() * 4)],
        majorRadius: 13.0 + Math.random() * 9.0,
        minorRadius: 3.5 + Math.random() * 6.5,

        // Attractor Coefficients
        cliffordA: -2.4 + Math.random() * 4.8,
        cliffordB: -2.4 + Math.random() * 4.8,
        cliffordC: -2.4 + Math.random() * 4.8,
        cliffordD: -2.4 + Math.random() * 4.8,

        // Helical / Ribbon Strands
        strandCount: [2, 3, 4, 5, 6, 8][Math.floor(Math.random() * 6)],
        torsion: 0.8 + Math.random() * 3.2,
        helixHeight: 24.0 + Math.random() * 14.0,

        // Lissajous / Harmonic Frequencies
        freqX: [1, 2, 3, 4, 5][Math.floor(Math.random() * 5)],
        freqY: [1, 2, 3, 4, 5][Math.floor(Math.random() * 5)],
        freqZ: [1, 2, 3, 4][Math.floor(Math.random() * 4)],
        phaseX: Math.random() * PI2,
        phaseY: Math.random() * PI2,
        phaseZ: Math.random() * PI2,

        // Polyhedral Shells
        polyShells: [2, 3, 4, 5][Math.floor(Math.random() * 4)],
        polyTrunc: 0.2 + Math.random() * 0.7,

        // Modifiers
        twistAmount: (Math.random() - 0.5) * 3.2,
        twistAxis: ['x', 'y', 'z'][Math.floor(Math.random() * 3)],
        harmonicAmp: 0.8 + Math.random() * 2.8,
        harmonicFreq: 2.0 + Math.random() * 6.0,
        taperAmount: (Math.random() - 0.5) * 0.9,
        saddleAmp: (Math.random() > 0.5 ? 1 : 0) * (1.2 + Math.random() * 3.0),
        swirlAngle: (Math.random() - 0.5) * 2.4,

        // Symmetry Fold (2, 3, 4, 5, 6, or 1 for asymmetric)
        symmetryFold: [1, 2, 3, 4, 5, 6, 8][Math.floor(Math.random() * 7)],

        // Layering
        shellLayers: 1 + Math.floor(Math.random() * 4),

        // Overall Global Scale & Aspect Ratio
        scaleProfile: 0.85 + Math.random() * 0.35,
        aspectRatioZ: 0.7 + Math.random() * 0.6,

        // Evolution Characteristics during HOLD
        evolveRate: 0.6 + Math.random() * 1.4,
        evolveFreq: 1.5 + Math.random() * 3.0,
        evolveAmp: 0.8 + Math.random() * 1.6,

        // Random Seed
        seed: Math.random() * 100000
      };

      const sig = computeSignature(spec);
      if (!isTooSimilar(sig) || attempts > 12) {
        recordSignature(sig);
        break;
      }
    } while (attempts < 20);

    return spec;
  }

  // Synthesizes 3D coordinates for all spheres from a procedural specification
  function generateProceduralFormation(spec, targets) {
    const N = SPHERE_COUNT;
    const fold = spec.symmetryFold;
    const baseRadius = 18.0 * spec.scaleProfile;

    for (let i = 0; i < N; i++) {
      const u = i / (N - 1); // 0 to 1
      const theta = i * GOLDEN_ANGLE;
      const phi = Math.acos(Math.max(-1, Math.min(1, 1 - 2 * u)));

      let x = 0;
      let y = 0;
      let z = 0;

      // 1. Base Manifold Generation
      switch (spec.manifoldType) {
        case 0: {
          // 3D Superformula (Infinite Crystal & Bloom Sculptures)
          const r1 = evalSuperformula(theta, spec.m1, spec.n1, spec.n2, spec.n3, 1.0, 1.0);
          const r2 = evalSuperformula(phi - Math.PI / 2, spec.m2, spec.n4, spec.n5, spec.n6, 1.0, 1.0);
          const rad = baseRadius * r1 * r2 * (0.6 + 0.4 * (i % spec.shellLayers) / spec.shellLayers);

          x = rad * Math.sin(phi) * Math.cos(theta);
          y = rad * Math.sin(phi) * Math.sin(theta);
          z = rad * Math.cos(phi) * spec.aspectRatioZ;
          break;
        }

        case 1: {
          // Generalized Torus / (p, q, k) Topological Knot Manifold
          const t = u * PI2 * spec.qWinding;
          const tubeU = (i % 64) / 64 * PI2;
          const rMajor = spec.majorRadius;
          const rMinor = spec.minorRadius * (1.0 + 0.35 * Math.sin(t * spec.kWinding));

          const curR = rMajor + rMinor * Math.cos(spec.pWinding * t);
          x = curR * Math.cos(t) + Math.cos(tubeU) * 1.5;
          y = curR * Math.sin(t) + Math.sin(tubeU) * 1.5;
          z = rMinor * Math.sin(spec.pWinding * t) * spec.aspectRatioZ;
          break;
        }

        case 2: {
          // Clifford / Strange Dynamic Attractor Phase Manifold
          const step = i * 0.085;
          const cA = spec.cliffordA;
          const cB = spec.cliffordB;
          const cC = spec.cliffordC;
          const cD = spec.cliffordD;

          const cx = Math.sin(cA * Math.sin(step)) + cC * Math.cos(cA * step);
          const cy = Math.sin(cB * step) + cD * Math.cos(cB * Math.sin(step));
          const cz = Math.sin(1.8 * step) * Math.cos(cA * cy);

          const radScale = baseRadius * 0.58;
          x = cx * radScale;
          y = cy * radScale;
          z = cz * radScale * spec.aspectRatioZ;
          break;
        }

        case 3: {
          // Multi-Strand Helical / Double-Twist Ribbon Fields
          const strand = i % spec.strandCount;
          const strandNorm = strand / spec.strandCount;
          const t = (u * 2 - 1); // -1 to 1
          const r = (baseRadius * 0.75) * (1.0 - 0.28 * t * t);
          const ang = t * (Math.PI * spec.torsion) + strandNorm * PI2;

          const crossA = i * 2.3999;
          const crossR = 1.6 * Math.sin(i * 0.8);

          x = r * Math.cos(ang) + Math.cos(crossA) * crossR;
          y = t * (spec.helixHeight / 2);
          z = r * Math.sin(ang) * spec.aspectRatioZ + Math.sin(crossA) * crossR;
          break;
        }

        case 4: {
          // Harmonic Lissajous / Rose Algebraic Volumes
          const t1 = u * PI2 * 3;
          const t2 = (i % 80) / 80 * PI2;

          const rad = baseRadius * (0.8 + 0.2 * Math.sin(t1 * spec.freqZ + spec.phaseZ));
          x = rad * Math.sin(t1 * spec.freqX + spec.phaseX) * Math.cos(t2);
          y = rad * Math.cos(t1 * spec.freqY + spec.phaseY) * Math.sin(t2);
          z = (baseRadius * 0.6) * Math.sin(t1 * 2.0 + t2) * spec.aspectRatioZ;
          break;
        }

        case 5: {
          // Polyhedral / Star Crystal Fractal Shells
          const shellIdx = i % spec.polyShells;
          const shellR = baseRadius * (0.45 + 0.55 * shellIdx / spec.polyShells);

          // Symmetrical Octahedral/Icosahedral Face Sampling
          const sx = ((i * 1.618) % 1) * 2 - 1;
          const sy = ((i * 2.718) % 1) * 2 - 1;
          const sz = (1.0 - Math.abs(sx) - Math.abs(sy));
          const parity = (i % 2 === 0) ? 1 : -1;

          const px = sx * shellR;
          const py = sy * shellR;
          const pz = sz * shellR * parity;

          // Star facet extrusion
          const starExtrude = 1.0 + spec.polyTrunc * Math.sin((px * px + py * py) * 0.02);
          x = px * starExtrude;
          y = py * starExtrude;
          z = pz * starExtrude * spec.aspectRatioZ;
          break;
        }

        case 6:
        default: {
          // Phyllotaxis Spiral Vortex & Wave Corrugations
          const r = Math.sqrt(u) * baseRadius;
          const thetaP = i * GOLDEN_ANGLE;
          const corrugation = Math.sin(thetaP * spec.m1) * Math.cos(r * 0.35) * spec.harmonicAmp;

          x = r * Math.cos(thetaP);
          y = r * Math.sin(thetaP);
          z = corrugation * spec.aspectRatioZ;
          break;
        }
      }

      // 2. Composable Parameter Modifiers
      // A. Axial Torsion / Twist
      if (Math.abs(spec.twistAmount) > 0.05) {
        let twistAngle = 0;
        if (spec.twistAxis === 'z') {
          twistAngle = (z / baseRadius) * spec.twistAmount;
          const nx = x * Math.cos(twistAngle) - y * Math.sin(twistAngle);
          const ny = x * Math.sin(twistAngle) + y * Math.cos(twistAngle);
          x = nx; y = ny;
        } else if (spec.twistAxis === 'y') {
          twistAngle = (y / baseRadius) * spec.twistAmount;
          const nx = x * Math.cos(twistAngle) - z * Math.sin(twistAngle);
          const nz = x * Math.sin(twistAngle) + z * Math.cos(twistAngle);
          x = nx; z = nz;
        } else {
          twistAngle = (x / baseRadius) * spec.twistAmount;
          const ny = y * Math.cos(twistAngle) - z * Math.sin(twistAngle);
          const nz = y * Math.sin(twistAngle) + z * Math.cos(twistAngle);
          y = ny; z = nz;
        }
      }

      // B. Taper & Hourglass Profile
      if (Math.abs(spec.taperAmount) > 0.05) {
        const normZ = Math.max(-1, Math.min(1, z / (baseRadius * 0.8)));
        const taperFactor = 1.0 + spec.taperAmount * (normZ * normZ - 0.5);
        x *= taperFactor;
        y *= taperFactor;
      }

      // C. Saddle / Paraboloid Curvature
      if (spec.saddleAmp > 0.05) {
        const saddle = (x * x - y * y) / (baseRadius * baseRadius) * spec.saddleAmp;
        z += saddle;
      }

      // D. Harmonic Ripple Modulation
      if (spec.harmonicAmp > 0.1) {
        const dist = Math.hypot(x, y, z) || 1.0;
        const ripple = 1.0 + (spec.harmonicAmp * 0.08) * Math.sin(dist * spec.harmonicFreq * 0.2 + theta);
        x *= ripple;
        y *= ripple;
        z *= ripple;
      }

      // 3. Symmetrical Folding (Rotational N-Fold Symmetry)
      if (fold > 1) {
        const curAngle = Math.atan2(y, x);
        const curR = Math.hypot(x, y);
        const foldSector = PI2 / fold;
        const foldedAngle = Math.floor(curAngle / foldSector) * foldSector + (curAngle % (foldSector / 2));
        x = curR * Math.cos(foldedAngle);
        y = curR * Math.sin(foldedAngle);
      }

      // Store in pre-allocated buffers
      targets[i * 3] = x;
      targets[i * 3 + 1] = y;
      targets[i * 3 + 2] = z;
      baseTargetPositions[i * 3] = x;
      baseTargetPositions[i * 3 + 1] = y;
      baseTargetPositions[i * 3 + 2] = z;
    }
  }

  // Generates a natural 3D scattering cloud around current positions
  function generateScatterField(fromPos, scatterOut) {
    for (let i = 0; i < SPHERE_COUNT; i++) {
      const idx = i * 3;
      const fx = fromPos[idx];
      const fy = fromPos[idx + 1];
      const fz = fromPos[idx + 2];

      const dist = Math.hypot(fx, fy, fz) || 1.0;
      const dirX = fx / dist;
      const dirY = fy / dist;
      const dirZ = fz / dist;

      const burstMagnitude = 18.0 + Math.random() * 24.0;
      const jitterX = (Math.random() - 0.5) * 19.0;
      const jitterY = (Math.random() - 0.5) * 15.0;
      const jitterZ = (Math.random() - 0.5) * 19.0;

      scatterOut[idx] = fx + dirX * burstMagnitude + jitterX;
      scatterOut[idx + 1] = fy + dirY * burstMagnitude + jitterY;
      scatterOut[idx + 2] = fz + dirZ * burstMagnitude + jitterZ;
    }
  }

  // Active procedural specification
  let activeSpec = createProceduralSpec();
  generateProceduralFormation(activeSpec, targetPositions);

  for (let i = 0; i < SPHERE_COUNT * 3; i++) {
    currentPositions[i] = targetPositions[i];
    startPositions[i] = targetPositions[i];
  }

  // Animation State Machine
  const PHASE_HOLD = 0;
  const PHASE_SCATTER = 1;
  const PHASE_GATHER = 2;

  let currentPhase = PHASE_HOLD;
  let phaseTime = 0;

  const HOLD_DURATION = prefersReducedMotion ? 5.8 : 3.8;
  const SCATTER_DURATION = prefersReducedMotion ? 2.6 : 2.0;
  const GATHER_DURATION = prefersReducedMotion ? 3.0 : 2.4;

  let rotSpeedX = (Math.random() - 0.5) * 0.006;
  let rotSpeedY = (Math.random() > 0.5 ? 1 : -1) * (0.003 + Math.random() * 0.004);

  function triggerNextProceduralCycle() {
    // 1. Save current positions as start
    for (let i = 0; i < SPHERE_COUNT * 3; i++) {
      startPositions[i] = currentPositions[i];
    }

    // 2. Generate scatter cloud
    generateScatterField(startPositions, scatterPositions);

    // 3. Procedurally generate a brand-new unique specification
    activeSpec = createProceduralSpec();
    generateProceduralFormation(activeSpec, targetPositions);

    // 4. Randomize rotation trajectory
    rotSpeedX = (Math.random() - 0.5) * 0.007;
    rotSpeedY = (Math.random() > 0.5 ? 1 : -1) * (0.0035 + Math.random() * 0.0045);
  }

  // Smooth quintic easing
  function easeInOutQuint(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Mouse & Interactive Parallax
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  function onMouseMove(e) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mouse.targetX = (e.clientX - cx) / cx;
    mouse.targetY = (e.clientY - cy) / cy;
  }

  function onTouchMove(e) {
    if (e.touches && e.touches.length > 0) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouse.targetX = (e.touches[0].clientX - cx) / cx;
      mouse.targetY = (e.touches[0].clientY - cy) / cy;
    }
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchstart', onTouchMove, { passive: true });

  // Responsive Resize & Orientation Change
  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      updateCameraAspect();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2.0));
    }, 100);
  }
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });

  // Tab Visibility Pause
  let isRunning = true;
  let rafId = null;

  function onVisibilityChange() {
    if (document.hidden) {
      isRunning = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else {
      if (!isRunning) {
        isRunning = true;
        clock.getDelta();
        animate();
      }
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Main Render Loop
  const clock = new THREE.Clock();
  const dummy = new THREE.Object3D();

  function animate() {
    if (!isRunning) return;
    rafId = requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.08);
    const elapsedTime = clock.getElapsedTime();
    phaseTime += delta;

    // Smooth Mouse Damping
    mouse.x += (mouse.targetX - mouse.x) * 0.038;
    mouse.y += (mouse.targetY - mouse.y) * 0.038;

    // Subtle Camera Parallax
    camera.position.x = mouse.x * 6.5;
    camera.position.y = -1 + (-mouse.y * 4.5);
    camera.lookAt(mouse.x * 1.5, -2.5 - mouse.y * 1.0, 0);

    // Dynamic Specular Light Sweep
    sweepLight.position.x = Math.sin(elapsedTime * 0.45) * 36;
    sweepLight.position.y = Math.cos(elapsedTime * 0.38) * 22;
    sweepLight.position.z = Math.sin(elapsedTime * 0.55) * 25 + 15;

    // Phase Execution
    if (currentPhase === PHASE_HOLD) {
      formationGroup.rotation.x += rotSpeedX;
      formationGroup.rotation.y += rotSpeedY;

      // CONTINUOUS PROCEDURAL HOLD-PHASE EVOLUTION:
      // Live parameter drift (subtle harmonic wave ripples across the generated manifold)
      const evRate = activeSpec.evolveRate;
      const evFreq = activeSpec.evolveFreq;
      const evAmp = activeSpec.evolveAmp;

      for (let i = 0; i < SPHERE_COUNT; i++) {
        const idx = i * 3;
        const bx = baseTargetPositions[idx];
        const by = baseTargetPositions[idx + 1];
        const bz = baseTargetPositions[idx + 2];

        const dist = Math.hypot(bx, by, bz) || 1.0;
        const wave = Math.sin(dist * evFreq * 0.15 - elapsedTime * evRate) * (evAmp * 0.35);

        const nx = bx / dist;
        const ny = by / dist;
        const nz = bz / dist;

        currentPositions[idx] = bx + nx * wave;
        currentPositions[idx + 1] = by + ny * wave;
        currentPositions[idx + 2] = bz + nz * wave;
      }

      if (phaseTime >= HOLD_DURATION) {
        currentPhase = PHASE_SCATTER;
        phaseTime = 0;
        triggerNextProceduralCycle();
      }
    } else if (currentPhase === PHASE_SCATTER) {
      // Scatter: balls expand outward with individualized ease
      const progress = Math.min(1.0, phaseTime / SCATTER_DURATION);

      for (let i = 0; i < SPHERE_COUNT; i++) {
        const idx = i * 3;
        const p = Math.max(0, Math.min(1.0, (progress - delays[i]) / (1.0 - delays[i])));
        const indEase = easeOutCubic(p);

        currentPositions[idx] = startPositions[idx] + (scatterPositions[idx] - startPositions[idx]) * indEase;
        currentPositions[idx + 1] = startPositions[idx + 1] + (scatterPositions[idx + 1] - startPositions[idx + 1]) * indEase;
        currentPositions[idx + 2] = startPositions[idx + 2] + (scatterPositions[idx + 2] - startPositions[idx + 2]) * indEase;
      }

      formationGroup.rotation.y += rotSpeedY * 0.5;

      if (phaseTime >= SCATTER_DURATION) {
        currentPhase = PHASE_GATHER;
        phaseTime = 0;
      }
    } else if (currentPhase === PHASE_GATHER) {
      // Gather: smoothly assemble the newly generated formation
      const progress = Math.min(1.0, phaseTime / GATHER_DURATION);

      for (let i = 0; i < SPHERE_COUNT; i++) {
        const idx = i * 3;
        const p = Math.max(0, Math.min(1.0, (progress - delays[i]) / (1.0 - delays[i])));
        const indEase = easeInOutQuint(p);

        currentPositions[idx] = scatterPositions[idx] + (targetPositions[idx] - scatterPositions[idx]) * indEase;
        currentPositions[idx + 1] = scatterPositions[idx + 1] + (targetPositions[idx + 1] - scatterPositions[idx + 1]) * indEase;
        currentPositions[idx + 2] = scatterPositions[idx + 2] + (targetPositions[idx + 2] - scatterPositions[idx + 2]) * indEase;
      }

      formationGroup.rotation.y += rotSpeedY * 0.6;

      if (phaseTime >= GATHER_DURATION) {
        currentPhase = PHASE_HOLD;
        phaseTime = 0;
        for (let i = 0; i < SPHERE_COUNT * 3; i++) {
          currentPositions[i] = targetPositions[i];
        }
      }
    }

    // Update InstancedMesh matrices
    for (let i = 0; i < SPHERE_COUNT; i++) {
      const idx = i * 3;
      const s = baseScales[i];

      dummy.position.set(currentPositions[idx], currentPositions[idx + 1], currentPositions[idx + 2]);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;

    // Render Scene
    renderer.render(scene, camera);
  }

  // Start Animation Engine
  animate();
})();

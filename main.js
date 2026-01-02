import * as THREE from "three";
import "./style.css";

// ==========================================
// GAME STATE
// ==========================================
const gameState = {
  isPlaying: false,
  isPaused: false,
  gazellesCaught: 0,
  gazellesTotalCaught: 0,
  cubsRaised: 0,
  lives: 3,
  level: 1,
  playerSpeed: 0.18,
  enemySpeed: 0.10,
};

// ==========================================
// SCENE SETUP
// ==========================================
const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xd4a574, 10, 60);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// ==========================================
// ARENA CONFIGURATION
// ==========================================
const ARENA_SIZE = 30;
const GAZELLE_COUNT = 10;

// ==========================================
// MATERIALS
// ==========================================
const playerMaterial = new THREE.MeshStandardMaterial({
  color: 0xffcc00,
  emissive: 0xff9900,
  emissiveIntensity: 0.4,
  metalness: 0.1,
  roughness: 0.6,
});

const playerSpotMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000,
  roughness: 0.8,
});

const gazelleMaterial = new THREE.MeshStandardMaterial({
  color: 0xd2b48c,
  emissive: 0xf4a460,
  emissiveIntensity: 0.3,
  roughness: 0.7,
});

const hyenaMaterial = new THREE.MeshStandardMaterial({
  color: 0x8b7355,
  emissive: 0x654321,
  emissiveIntensity: 0.2,
  roughness: 0.8,
});

const lionMaterial = new THREE.MeshStandardMaterial({
  color: 0xdaa520,
  emissive: 0xff8c00,
  emissiveIntensity: 0.3,
  roughness: 0.7,
});

const obstacleMaterial = new THREE.MeshStandardMaterial({
  color: 0x556b2f,
  roughness: 0.9,
});

const rockMaterial = new THREE.MeshStandardMaterial({
  color: 0x696969,
  roughness: 0.95,
});

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0xc2b280,
  roughness: 0.95,
});

const elephantMaterial = new THREE.MeshStandardMaterial({
  color: 0x808080,
  roughness: 0.85,
});

const rhinoMaterial = new THREE.MeshStandardMaterial({
  color: 0x696969,
  roughness: 0.9,
});

// ==========================================
// CREATE ARENA - SERENGETI STYLE
// ==========================================
const obstacles = [];

function createArena() {
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE);
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Add scattered acacia-style trees (tall thin trunks with flat tops)
  for (let i = 0; i < 15; i++) {
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.2, 2, 6);
    const trunk = new THREE.Mesh(trunkGeometry, new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9
    }));
    trunk.position.y = 1;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Flat canopy (acacia-style)
    const canopyGeometry = new THREE.CylinderGeometry(1.5, 0.3, 1, 8);
    const canopy = new THREE.Mesh(canopyGeometry, obstacleMaterial);
    canopy.position.y = 2.5;
    canopy.castShadow = true;
    treeGroup.add(canopy);

    // Random position
    const angle = Math.random() * Math.PI * 2;
    const distance = 5 + Math.random() * 10;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);

    obstacles.push({
      x,
      z,
      radius: 1.2,
      type: 'tree'
    });
  }

  // Add rocks/boulders
  for (let i = 0; i < 12; i++) {
    const size = 0.5 + Math.random() * 0.8;
    const rockGeometry = new THREE.DodecahedronGeometry(size, 0);
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);

    const angle = Math.random() * Math.PI * 2;
    const distance = 6 + Math.random() * 10;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    rock.position.set(x, size * 0.7, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);

    obstacles.push({
      x,
      z,
      radius: size * 1.2,
      type: 'rock'
    });
  }

  // Add bushes
  for (let i = 0; i < 20; i++) {
    const bushGeometry = new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 8, 6);
    const bush = new THREE.Mesh(bushGeometry, new THREE.MeshStandardMaterial({
      color: 0x6b8e23,
      roughness: 0.9
    }));

    const angle = Math.random() * Math.PI * 2;
    const distance = 3 + Math.random() * 12;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    bush.position.set(x, 0.3, z);
    bush.castShadow = true;
    scene.add(bush);

    obstacles.push({
      x,
      z,
      radius: 0.6,
      type: 'bush'
    });
  }

  // Add elephants (large, stationary)
  for (let i = 0; i < 3; i++) {
    const elephant = createElephant();

    const angle = Math.random() * Math.PI * 2;
    const distance = 8 + Math.random() * 8;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    elephant.position.set(x, 0, z);
    elephant.rotation.y = Math.random() * Math.PI * 2;
    scene.add(elephant);

    obstacles.push({
      x,
      z,
      radius: 1.5,
      type: 'elephant',
      mesh: elephant
    });
  }

  // Add rhinoceros (medium size, stationary)
  for (let i = 0; i < 2; i++) {
    const rhino = createRhino();

    const angle = Math.random() * Math.PI * 2;
    const distance = 7 + Math.random() * 9;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    rhino.position.set(x, 0, z);
    rhino.rotation.y = Math.random() * Math.PI * 2;
    scene.add(rhino);

    obstacles.push({
      x,
      z,
      radius: 1.2,
      type: 'rhino',
      mesh: rhino
    });
  }
}

// ==========================================
// ANIMAL MODELS
// ==========================================

function createCheetah() {
  const cheetah = new THREE.Group();

  // Body
  const bodyGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.4);
  const body = new THREE.Mesh(bodyGeometry, playerMaterial);
  body.position.y = 0.4;
  body.castShadow = true;
  cheetah.add(body);

  // Head
  const headGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const head = new THREE.Mesh(headGeometry, playerMaterial);
  head.position.set(0.5, 0.5, 0);
  head.castShadow = true;
  cheetah.add(head);

  // Spots on body
  for (let i = 0; i < 6; i++) {
    const spot = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 4, 4),
      playerSpotMaterial
    );
    spot.position.set(
      -0.2 + Math.random() * 0.4,
      0.4,
      -0.15 + Math.random() * 0.3
    );
    cheetah.add(spot);
  }

  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 4);
  const legPositions = [
    [0.3, 0.2, 0.15],
    [0.3, 0.2, -0.15],
    [-0.3, 0.2, 0.15],
    [-0.3, 0.2, -0.15]
  ];

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, playerMaterial);
    leg.position.set(...pos);
    leg.castShadow = true;
    cheetah.add(leg);
  });

  // Tail
  const tailGeometry = new THREE.CylinderGeometry(0.04, 0.06, 0.6, 4);
  const tail = new THREE.Mesh(tailGeometry, playerMaterial);
  tail.position.set(-0.6, 0.5, 0);
  tail.rotation.z = Math.PI / 4;
  tail.castShadow = true;
  cheetah.add(tail);

  return cheetah;
}

function createGazelle() {
  const gazelle = new THREE.Group();

  // Body
  const bodyGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.25);
  const body = new THREE.Mesh(bodyGeometry, gazelleMaterial);
  body.position.y = 0.3;
  body.castShadow = true;
  gazelle.add(body);

  // Head
  const headGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  const head = new THREE.Mesh(headGeometry, gazelleMaterial);
  head.position.set(0.25, 0.4, 0);
  head.castShadow = true;
  gazelle.add(head);

  // Horns
  const hornGeometry = new THREE.ConeGeometry(0.02, 0.15, 4);
  const hornMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const horn1 = new THREE.Mesh(hornGeometry, hornMaterial);
  horn1.position.set(0.3, 0.55, 0.05);
  gazelle.add(horn1);
  const horn2 = new THREE.Mesh(hornGeometry, hornMaterial);
  horn2.position.set(0.3, 0.55, -0.05);
  gazelle.add(horn2);

  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 4);
  const legPositions = [
    [0.15, 0.15, 0.1],
    [0.15, 0.15, -0.1],
    [-0.15, 0.15, 0.1],
    [-0.15, 0.15, -0.1]
  ];

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, gazelleMaterial);
    leg.position.set(...pos);
    leg.castShadow = true;
    gazelle.add(leg);
  });

  return gazelle;
}

function createHyena() {
  const hyena = new THREE.Group();

  // Body
  const bodyGeometry = new THREE.BoxGeometry(0.6, 0.35, 0.35);
  const body = new THREE.Mesh(bodyGeometry, hyenaMaterial);
  body.position.y = 0.35;
  body.castShadow = true;
  hyena.add(body);

  // Head (larger for hyena)
  const headGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.25);
  const head = new THREE.Mesh(headGeometry, hyenaMaterial);
  head.position.set(0.4, 0.4, 0);
  head.castShadow = true;
  hyena.add(head);

  // Ears
  const earGeometry = new THREE.ConeGeometry(0.08, 0.12, 4);
  const ear1 = new THREE.Mesh(earGeometry, hyenaMaterial);
  ear1.position.set(0.4, 0.6, 0.1);
  hyena.add(ear1);
  const ear2 = new THREE.Mesh(earGeometry, hyenaMaterial);
  ear2.position.set(0.4, 0.6, -0.1);
  hyena.add(ear2);

  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 4);
  const legPositions = [
    [0.2, 0.175, 0.15],
    [0.2, 0.175, -0.15],
    [-0.2, 0.175, 0.15],
    [-0.2, 0.175, -0.15]
  ];

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, hyenaMaterial);
    leg.position.set(...pos);
    leg.castShadow = true;
    hyena.add(leg);
  });

  return hyena;
}

function createLion() {
  const lion = new THREE.Group();

  // Body
  const bodyGeometry = new THREE.BoxGeometry(0.7, 0.4, 0.4);
  const body = new THREE.Mesh(bodyGeometry, lionMaterial);
  body.position.y = 0.4;
  body.castShadow = true;
  lion.add(body);

  // Head
  const headGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.35);
  const head = new THREE.Mesh(headGeometry, lionMaterial);
  head.position.set(0.45, 0.5, 0);
  head.castShadow = true;
  lion.add(head);

  // Mane
  const maneGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const maneMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.9
  });
  const mane = new THREE.Mesh(maneGeometry, maneMaterial);
  mane.position.set(0.35, 0.5, 0);
  mane.scale.set(1.2, 1, 1.2);
  mane.castShadow = true;
  lion.add(mane);

  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.4, 4);
  const legPositions = [
    [0.25, 0.2, 0.17],
    [0.25, 0.2, -0.17],
    [-0.25, 0.2, 0.17],
    [-0.25, 0.2, -0.17]
  ];

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, lionMaterial);
    leg.position.set(...pos);
    leg.castShadow = true;
    lion.add(leg);
  });

  // Tail
  const tailGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 4);
  const tail = new THREE.Mesh(tailGeometry, lionMaterial);
  tail.position.set(-0.55, 0.45, 0);
  tail.rotation.z = Math.PI / 6;
  tail.castShadow = true;
  lion.add(tail);

  return lion;
}

function createElephant() {
  const elephant = new THREE.Group();

  // Body (large and round)
  const bodyGeometry = new THREE.BoxGeometry(1.2, 1, 0.8);
  const body = new THREE.Mesh(bodyGeometry, elephantMaterial);
  body.position.y = 0.8;
  body.castShadow = true;
  elephant.add(body);

  // Head
  const headGeometry = new THREE.BoxGeometry(0.6, 0.7, 0.6);
  const head = new THREE.Mesh(headGeometry, elephantMaterial);
  head.position.set(0.7, 1, 0);
  head.castShadow = true;
  elephant.add(head);

  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.8, 6);
  const trunk = new THREE.Mesh(trunkGeometry, elephantMaterial);
  trunk.position.set(1, 0.5, 0);
  trunk.rotation.z = Math.PI / 3;
  trunk.castShadow = true;
  elephant.add(trunk);

  // Ears
  const earGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.5);
  const ear1 = new THREE.Mesh(earGeometry, elephantMaterial);
  ear1.position.set(0.7, 1, 0.5);
  ear1.castShadow = true;
  elephant.add(ear1);
  const ear2 = new THREE.Mesh(earGeometry, elephantMaterial);
  ear2.position.set(0.7, 1, -0.5);
  ear2.castShadow = true;
  elephant.add(ear2);

  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6);
  const legPositions = [
    [0.4, 0.4, 0.3],
    [0.4, 0.4, -0.3],
    [-0.4, 0.4, 0.3],
    [-0.4, 0.4, -0.3]
  ];

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, elephantMaterial);
    leg.position.set(...pos);
    leg.castShadow = true;
    elephant.add(leg);
  });

  // Tusks
  const tuskGeometry = new THREE.CylinderGeometry(0.04, 0.06, 0.4, 4);
  const tuskMaterial = new THREE.MeshStandardMaterial({ color: 0xfffff0 });
  const tusk1 = new THREE.Mesh(tuskGeometry, tuskMaterial);
  tusk1.position.set(0.9, 0.7, 0.15);
  tusk1.rotation.z = -Math.PI / 6;
  elephant.add(tusk1);
  const tusk2 = new THREE.Mesh(tuskGeometry, tuskMaterial);
  tusk2.position.set(0.9, 0.7, -0.15);
  tusk2.rotation.z = -Math.PI / 6;
  elephant.add(tusk2);

  return elephant;
}

function createRhino() {
  const rhino = new THREE.Group();

  // Body
  const bodyGeometry = new THREE.BoxGeometry(1, 0.8, 0.7);
  const body = new THREE.Mesh(bodyGeometry, rhinoMaterial);
  body.position.y = 0.7;
  body.castShadow = true;
  rhino.add(body);

  // Head
  const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const head = new THREE.Mesh(headGeometry, rhinoMaterial);
  head.position.set(0.65, 0.7, 0);
  head.castShadow = true;
  rhino.add(head);

  // Horn (main feature)
  const hornGeometry = new THREE.ConeGeometry(0.1, 0.4, 6);
  const horn = new THREE.Mesh(hornGeometry, rhinoMaterial);
  horn.position.set(1, 0.8, 0);
  horn.rotation.z = -Math.PI / 2;
  horn.castShadow = true;
  rhino.add(horn);

  // Ears
  const earGeometry = new THREE.ConeGeometry(0.1, 0.15, 4);
  const ear1 = new THREE.Mesh(earGeometry, rhinoMaterial);
  ear1.position.set(0.5, 0.95, 0.2);
  rhino.add(ear1);
  const ear2 = new THREE.Mesh(earGeometry, rhinoMaterial);
  ear2.position.set(0.5, 0.95, -0.2);
  rhino.add(ear2);

  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 6);
  const legPositions = [
    [0.35, 0.35, 0.3],
    [0.35, 0.35, -0.3],
    [-0.35, 0.35, 0.3],
    [-0.35, 0.35, -0.3]
  ];

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, rhinoMaterial);
    leg.position.set(...pos);
    leg.castShadow = true;
    rhino.add(leg);
  });

  return rhino;
}

// ==========================================
// PLAYER (CHEETAH)
// ==========================================
const player = {
  mesh: null,
  x: 0,
  z: 0,
  velocity: { x: 0, z: 0 },
};

function createPlayer() {
  player.mesh = createCheetah();
  player.x = 0;
  player.z = 0;
  player.mesh.position.set(player.x, 0, player.z);
  scene.add(player.mesh);
}

// ==========================================
// GAZELLES
// ==========================================
const gazelles = [];

function createGazelles() {
  for (let i = 0; i < GAZELLE_COUNT; i++) {
    const gazelle = createGazelle();

    // Find valid position
    let x, z, validPosition = false;
    let attempts = 0;

    while (!validPosition && attempts < 100) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 4 + Math.random() * 11;
      x = Math.cos(angle) * distance;
      z = Math.sin(angle) * distance;

      validPosition = !checkObstacleCollision(x, z, 0.5);
      attempts++;
    }

    gazelle.position.set(x, 0, z);
    gazelle.userData = { bobOffset: Math.random() * Math.PI * 2 };
    scene.add(gazelle);
    gazelles.push({ mesh: gazelle, active: true, x, z });
  }
}

// ==========================================
// ENEMIES
// ==========================================
const enemies = [];

function createEnemies() {
  const level = gameState.level;
  const hyenaCount = Math.min(2 + level, 5);
  const lionCount = Math.min(1 + Math.floor(level / 2), 4);

  // Create hyenas
  for (let i = 0; i < hyenaCount; i++) {
    const hyena = createHyena();

    let x, z, validPosition = false;
    let attempts = 0;

    while (!validPosition && attempts < 100) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 6 + Math.random() * 9;
      x = Math.cos(angle) * distance;
      z = Math.sin(angle) * distance;

      validPosition = !checkObstacleCollision(x, z, 0.7);
      attempts++;
    }

    hyena.position.set(x, 0, z);
    scene.add(hyena);

    enemies.push({
      mesh: hyena,
      x,
      z,
      type: 'hyena',
      updateCounter: 0,
    });
  }

  // Create lions
  for (let i = 0; i < lionCount; i++) {
    const lion = createLion();

    let x, z, validPosition = false;
    let attempts = 0;

    while (!validPosition && attempts < 100) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 7 + Math.random() * 8;
      x = Math.cos(angle) * distance;
      z = Math.sin(angle) * distance;

      validPosition = !checkObstacleCollision(x, z, 0.8);
      attempts++;
    }

    lion.position.set(x, 0, z);
    scene.add(lion);

    enemies.push({
      mesh: lion,
      x,
      z,
      type: 'lion',
      updateCounter: 0,
    });
  }
}

// ==========================================
// COLLISION DETECTION - IMPROVED
// ==========================================
function checkObstacleCollision(x, z, objectRadius) {
  for (const obstacle of obstacles) {
    const dx = x - obstacle.x;
    const dz = z - obstacle.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const minDistance = obstacle.radius + objectRadius;

    if (distance < minDistance) {
      return true;
    }
  }

  // Check arena boundaries
  const boundary = ARENA_SIZE / 2 - 1;
  if (Math.abs(x) > boundary || Math.abs(z) > boundary) {
    return true;
  }

  return false;
}

function checkGazelleCollision() {
  for (const gazelle of gazelles) {
    if (!gazelle.active) continue;

    const dx = player.x - gazelle.x;
    const dz = player.z - gazelle.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 0.6) {
      gazelle.active = false;
      scene.remove(gazelle.mesh);
      gameState.gazellesCaught++;
      gameState.gazellesTotalCaught++;
      updateHUD();

      // Check level complete
      if (gameState.gazellesCaught >= GAZELLE_COUNT) {
        levelComplete();
      }
    }
  }
}

function checkEnemyCollision() {
  for (const enemy of enemies) {
    const dx = player.x - enemy.x;
    const dz = player.z - enemy.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 0.7) {
      loseLife();
      return;
    }
  }
}

// ==========================================
// ENEMY AI
// ==========================================
function updateEnemies(deltaTime) {
  for (const enemy of enemies) {
    enemy.updateCounter++;

    // Update more frequently for smoother movement
    if (enemy.updateCounter % 2 === 0) {
      const dx = player.x - enemy.x;
      const dz = player.z - enemy.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0) {
        const dirX = dx / dist;
        const dirZ = dz / dist;

        const speed = gameState.enemySpeed * (enemy.type === 'lion' ? 1.3 : 1);
        const newX = enemy.x + dirX * speed;
        const newZ = enemy.z + dirZ * speed;

        // Check if new position is valid
        if (!checkObstacleCollision(newX, newZ, 0.5)) {
          enemy.x = newX;
          enemy.z = newZ;
          enemy.mesh.position.set(enemy.x, 0, enemy.z);

          // Rotate to face movement direction
          enemy.mesh.rotation.y = Math.atan2(dirX, dirZ);
        } else {
          // If blocked, try to go around
          const perpDirX = -dirZ;
          const perpDirZ = dirX;
          const altX = enemy.x + perpDirX * speed;
          const altZ = enemy.z + perpDirZ * speed;

          if (!checkObstacleCollision(altX, altZ, 0.5)) {
            enemy.x = altX;
            enemy.z = altZ;
            enemy.mesh.position.set(enemy.x, 0, enemy.z);
            enemy.mesh.rotation.y = Math.atan2(perpDirX, perpDirZ);
          }
        }
      }
    }
  }
}

// ==========================================
// INPUT HANDLING
// ==========================================
const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
};

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (!gameState.isPlaying) return;

  switch(e.key.toLowerCase()) {
    case 'arrowup':
    case 'w':
      keys.up = true;
      break;
    case 'arrowdown':
    case 's':
      keys.down = true;
      break;
    case 'arrowleft':
    case 'a':
      keys.left = true;
      break;
    case 'arrowright':
    case 'd':
      keys.right = true;
      break;
  }
});

document.addEventListener('keyup', (e) => {
  switch(e.key.toLowerCase()) {
    case 'arrowup':
    case 'w':
      keys.up = false;
      break;
    case 'arrowdown':
    case 's':
      keys.down = false;
      break;
    case 'arrowleft':
    case 'a':
      keys.left = false;
      break;
    case 'arrowright':
    case 'd':
      keys.right = false;
      break;
  }
});

// ==========================================
// MOBILE TOUCH CONTROLS
// ==========================================
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (window.innerWidth <= 768);
}

function initMobileControls() {
  const mobileControls = document.getElementById('mobileControls');

  if (isMobileDevice()) {
    mobileControls.classList.add('visible');
  }

  // Touch control functions
  const setKeyState = (key, state) => {
    if (gameState.isPlaying) {
      keys[key] = state;
    }
  };

  // Up button
  const btnUp = document.getElementById('btnUp');
  btnUp.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setKeyState('up', true);
  });
  btnUp.addEventListener('touchend', (e) => {
    e.preventDefault();
    setKeyState('up', false);
  });
  btnUp.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    setKeyState('up', false);
  });

  // Down button
  const btnDown = document.getElementById('btnDown');
  btnDown.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setKeyState('down', true);
  });
  btnDown.addEventListener('touchend', (e) => {
    e.preventDefault();
    setKeyState('down', false);
  });
  btnDown.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    setKeyState('down', false);
  });

  // Left button
  const btnLeft = document.getElementById('btnLeft');
  btnLeft.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setKeyState('left', true);
  });
  btnLeft.addEventListener('touchend', (e) => {
    e.preventDefault();
    setKeyState('left', false);
  });
  btnLeft.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    setKeyState('left', false);
  });

  // Right button
  const btnRight = document.getElementById('btnRight');
  btnRight.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setKeyState('right', true);
  });
  btnRight.addEventListener('touchend', (e) => {
    e.preventDefault();
    setKeyState('right', false);
  });
  btnRight.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    setKeyState('right', false);
  });

  // Also support mouse events for testing on desktop
  const buttons = [
    { element: btnUp, key: 'up' },
    { element: btnDown, key: 'down' },
    { element: btnLeft, key: 'left' },
    { element: btnRight, key: 'right' }
  ];

  buttons.forEach(({ element, key }) => {
    element.addEventListener('mousedown', (e) => {
      e.preventDefault();
      setKeyState(key, true);
    });
    element.addEventListener('mouseup', (e) => {
      e.preventDefault();
      setKeyState(key, false);
    });
    element.addEventListener('mouseleave', (e) => {
      setKeyState(key, false);
    });
  });
}

// Show mobile controls on window resize if needed
window.addEventListener('resize', () => {
  const mobileControls = document.getElementById('mobileControls');
  if (isMobileDevice()) {
    mobileControls.classList.add('visible');
  } else {
    mobileControls.classList.remove('visible');
  }
});

// ==========================================
// PLAYER MOVEMENT - IMPROVED
// ==========================================
function updatePlayer() {
  if (!gameState.isPlaying) return;

  let dirX = 0;
  let dirZ = 0;

  if (keys.up) dirZ -= 1;
  if (keys.down) dirZ += 1;
  if (keys.left) dirX -= 1;
  if (keys.right) dirX += 1;

  // Normalize diagonal movement
  if (dirX !== 0 || dirZ !== 0) {
    const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
    dirX /= length;
    dirZ /= length;
  }

  // Calculate new position
  const speed = gameState.playerSpeed;
  let newX = player.x + dirX * speed;
  let newZ = player.z + dirZ * speed;

  // Improved collision - slide along obstacles instead of stopping
  // Using smaller collision radius (0.35) for better maneuverability
  if (checkObstacleCollision(newX, newZ, 0.35)) {
    // Try moving only in X direction
    if (!checkObstacleCollision(newX, player.z, 0.35)) {
      newZ = player.z;
    }
    // Try moving only in Z direction
    else if (!checkObstacleCollision(player.x, newZ, 0.35)) {
      newX = player.x;
    }
    // Can't move, stay in place
    else {
      newX = player.x;
      newZ = player.z;
    }
  }

  player.x = newX;
  player.z = newZ;
  player.mesh.position.set(player.x, 0, player.z);

  // Rotate player to face movement direction
  if (dirX !== 0 || dirZ !== 0) {
    player.mesh.rotation.y = Math.atan2(dirX, dirZ);
  }
}

// ==========================================
// GAME FLOW
// ==========================================
function resetLevel() {
  // Clear existing objects
  gazelles.forEach(g => scene.remove(g.mesh));
  gazelles.length = 0;

  enemies.forEach(e => scene.remove(e.mesh));
  enemies.length = 0;

  // Reset player position
  player.x = 0;
  player.z = 0;
  player.mesh.position.set(player.x, 0, player.z);

  // Reset level stats
  gameState.gazellesCaught = 0;
  gameState.lives = 3;

  // Increase difficulty
  gameState.enemySpeed = 0.10 + (gameState.level - 1) * 0.015;

  // Create new objects
  createGazelles();
  createEnemies();

  updateHUD();
}

function levelComplete() {
  gameState.isPlaying = false;
  gameState.cubsRaised++;
  gameState.level++;

  updateHUD();

  if (gameState.cubsRaised >= 3) {
    showVictoryScreen();
  } else {
    showLevelCompleteScreen();
  }
}

function loseLife() {
  gameState.lives--;
  updateHUD();

  if (gameState.lives <= 0) {
    gameOver();
  } else {
    // Reset player position
    player.x = 0;
    player.z = 0;
    player.mesh.position.set(player.x, 0, player.z);
  }
}

function gameOver() {
  gameState.isPlaying = false;
  showGameOverScreen();
}

function restartGame() {
  gameState.cubsRaised = 0;
  gameState.level = 1;
  gameState.gazellesTotalCaught = 0;
  gameState.playerSpeed = 0.18;
  gameState.enemySpeed = 0.10;
  resetLevel();
  hideAllScreens();
  gameState.isPlaying = true;
}

// ==========================================
// UI MANAGEMENT
// ==========================================
function updateHUD() {
  document.getElementById('gazelles').textContent = `${gameState.gazellesCaught} / ${GAZELLE_COUNT}`;
  document.getElementById('cubs').textContent = `${gameState.cubsRaised} / 3`;
  document.getElementById('lives').textContent = gameState.lives;
}

function hideAllScreens() {
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('victoryScreen').classList.add('hidden');
  document.getElementById('levelCompleteScreen').classList.add('hidden');
}

function showGameOverScreen() {
  document.getElementById('finalCubs').textContent = gameState.cubsRaised;
  document.getElementById('finalGazelles').textContent = gameState.gazellesTotalCaught;
  document.getElementById('gameOverScreen').classList.remove('hidden');
}

function showVictoryScreen() {
  document.getElementById('victoryGazelles').textContent = gameState.gazellesTotalCaught;
  document.getElementById('victoryScreen').classList.remove('hidden');
}

function showLevelCompleteScreen() {
  document.getElementById('cubsProgress').textContent = `Cubs: ${gameState.cubsRaised} / 3`;
  document.getElementById('levelCompleteScreen').classList.remove('hidden');
}

// ==========================================
// BUTTON HANDLERS
// ==========================================
document.getElementById('btnStart').addEventListener('click', () => {
  hideAllScreens();
  gameState.isPlaying = true;
});

document.getElementById('btnRestart').addEventListener('click', () => {
  restartGame();
});

document.getElementById('btnPlayAgain').addEventListener('click', () => {
  restartGame();
});

document.getElementById('btnNextLevel').addEventListener('click', () => {
  resetLevel();
  hideAllScreens();
  gameState.isPlaying = true;
});

// ==========================================
// LIGHTING
// ==========================================
const ambientLight = new THREE.AmbientLight(0xfff8dc, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffd700, 1.2);
directionalLight.position.set(15, 25, 15);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
scene.add(directionalLight);

// ==========================================
// CAMERA
// ==========================================
const camera = new THREE.PerspectiveCamera(
  65,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 22, 16);
camera.lookAt(0, 0, 0);

// ==========================================
// RENDERER
// ==========================================
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xd4a574);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ==========================================
// RESIZE HANDLER
// ==========================================
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ==========================================
// INITIALIZE GAME
// ==========================================
createArena();
createPlayer();
createGazelles();
createEnemies();
updateHUD();
initMobileControls();

// ==========================================
// ANIMATION LOOP
// ==========================================
const clock = new THREE.Clock();
let previousTime = 0;

function animate() {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  if (gameState.isPlaying) {
    updatePlayer();
    updateEnemies(deltaTime);
    checkGazelleCollision();
    checkEnemyCollision();

    // Animate gazelles (bobbing and gentle movement)
    gazelles.forEach(gazelle => {
      if (gazelle.active) {
        gazelle.mesh.position.y = Math.sin(elapsedTime * 2 + gazelle.mesh.userData.bobOffset) * 0.08;
        gazelle.mesh.rotation.y = Math.sin(elapsedTime + gazelle.mesh.userData.bobOffset) * 0.3;
      }
    });

    // Animate elephants (slight ear flap)
    obstacles.forEach(obstacle => {
      if (obstacle.type === 'elephant' && obstacle.mesh) {
        obstacle.mesh.children.forEach((child, idx) => {
          if (idx === 3 || idx === 4) {
            child.rotation.y = Math.sin(elapsedTime * 0.5) * 0.1;
          }
        });
      }
    });

    // Smooth camera follow
    const targetCameraX = player.x;
    const targetCameraZ = player.z + 16;
    camera.position.x += (targetCameraX - camera.position.x) * 0.08;
    camera.position.z += (targetCameraZ - camera.position.z) * 0.08;
    camera.lookAt(player.x, 0, player.z);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

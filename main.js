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
  playerSpeed: 0.12,
  enemySpeed: 0.06,
};

// ==========================================
// SCENE SETUP
// ==========================================
const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87ceeb, 1, 50);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// ==========================================
// ARENA CONFIGURATION
// ==========================================
const ARENA_SIZE = 20;
const CELL_SIZE = 1;
const WALL_HEIGHT = 1;
const GAZELLE_COUNT = 20;

// Simple maze pattern (1 = wall, 0 = path)
const mazePattern = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,0,0,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,0,0,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,0,1,1,0,0,1,1,0,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// ==========================================
// MATERIALS
// ==========================================
const playerMaterial = new THREE.MeshStandardMaterial({
  color: 0xffa500,
  emissive: 0xff6600,
  emissiveIntensity: 0.3,
});

const gazelleMaterial = new THREE.MeshStandardMaterial({
  color: 0xf4a460,
  emissive: 0xf4a460,
  emissiveIntensity: 0.5,
});

const hyenaMaterial = new THREE.MeshStandardMaterial({
  color: 0x8b4513,
  emissive: 0x8b4513,
  emissiveIntensity: 0.3,
});

const lionMaterial = new THREE.MeshStandardMaterial({
  color: 0xff8c00,
  emissive: 0xff8c00,
  emissiveIntensity: 0.3,
});

const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0x228b22,
  roughness: 0.8,
});

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0xdaa520,
  roughness: 0.9,
});

// ==========================================
// CREATE ARENA
// ==========================================
const walls = [];
const pathCells = [];

function createArena() {
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE);
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Walls based on maze pattern
  const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);

  for (let row = 0; row < mazePattern.length; row++) {
    for (let col = 0; col < mazePattern[row].length; col++) {
      const x = col - ARENA_SIZE / 2 + 0.5;
      const z = row - ARENA_SIZE / 2 + 0.5;

      if (mazePattern[row][col] === 1) {
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(x, WALL_HEIGHT / 2, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
        walls.push({ x, z, mesh: wall });
      } else {
        pathCells.push({ x, z, row, col });
      }
    }
  }
}

// ==========================================
// PLAYER (CHEETAH)
// ==========================================
const player = {
  mesh: null,
  x: 0,
  z: 0,
  targetX: 0,
  targetZ: 0,
  velocity: { x: 0, z: 0 },
};

function createPlayer() {
  const geometry = new THREE.ConeGeometry(0.3, 0.6, 4);
  player.mesh = new THREE.Mesh(geometry, playerMaterial);
  player.mesh.rotation.x = Math.PI / 2;
  player.mesh.castShadow = true;

  // Start in a clear path
  const startCell = pathCells.find(cell =>
    Math.abs(cell.row - 10) < 2 && Math.abs(cell.col - 10) < 2
  ) || pathCells[0];

  player.x = startCell.x;
  player.z = startCell.z;
  player.mesh.position.set(player.x, 0.3, player.z);
  scene.add(player.mesh);
}

// ==========================================
// GAZELLES
// ==========================================
const gazelles = [];

function createGazelles() {
  const geometry = new THREE.SphereGeometry(0.2, 8, 8);

  // Shuffle path cells and pick random positions
  const shuffled = [...pathCells].sort(() => Math.random() - 0.5);

  for (let i = 0; i < GAZELLE_COUNT; i++) {
    if (i >= shuffled.length) break;

    const cell = shuffled[i];
    const gazelle = new THREE.Mesh(geometry, gazelleMaterial);
    gazelle.position.set(cell.x, 0.2, cell.z);
    gazelle.userData = { bobOffset: Math.random() * Math.PI * 2 };
    scene.add(gazelle);
    gazelles.push({ mesh: gazelle, active: true, x: cell.x, z: cell.z });
  }
}

// ==========================================
// ENEMIES
// ==========================================
const enemies = [];

function createEnemies() {
  const level = gameState.level;
  const hyenaCount = Math.min(2 + level, 4);
  const lionCount = Math.min(1 + Math.floor(level / 2), 3);

  const hyenaGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.6);
  const lionGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.7);

  // Create hyenas
  for (let i = 0; i < hyenaCount; i++) {
    const cell = pathCells[Math.floor(Math.random() * pathCells.length)];
    const enemy = new THREE.Mesh(hyenaGeometry, hyenaMaterial);
    enemy.position.set(cell.x, 0.3, cell.z);
    enemy.castShadow = true;
    scene.add(enemy);

    enemies.push({
      mesh: enemy,
      x: cell.x,
      z: cell.z,
      type: 'hyena',
      targetCell: null,
      updateCounter: 0,
    });
  }

  // Create lions
  for (let i = 0; i < lionCount; i++) {
    const cell = pathCells[Math.floor(Math.random() * pathCells.length)];
    const enemy = new THREE.Mesh(lionGeometry, lionMaterial);
    enemy.position.set(cell.x, 0.3, cell.z);
    enemy.castShadow = true;
    scene.add(enemy);

    enemies.push({
      mesh: enemy,
      x: cell.x,
      z: cell.z,
      type: 'lion',
      targetCell: null,
      updateCounter: 0,
    });
  }
}

// ==========================================
// COLLISION DETECTION
// ==========================================
function checkWallCollision(x, z) {
  for (const wall of walls) {
    const dx = x - wall.x;
    const dz = z - wall.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    if (distance < 0.5) {
      return true;
    }
  }
  return false;
}

function checkGazelleCollision() {
  for (const gazelle of gazelles) {
    if (!gazelle.active) continue;

    const dx = player.x - gazelle.x;
    const dz = player.z - gazelle.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 0.4) {
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

    if (distance < 0.5) {
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

    // Update path less frequently for performance
    if (enemy.updateCounter % 30 === 0) {
      // Simple chase AI - move toward player
      const dx = player.x - enemy.x;
      const dz = player.z - enemy.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0) {
        const dirX = dx / dist;
        const dirZ = dz / dist;

        // Try to move toward player
        const speed = gameState.enemySpeed * (enemy.type === 'lion' ? 1.2 : 1);
        const newX = enemy.x + dirX * speed;
        const newZ = enemy.z + dirZ * speed;

        // Check if new position is valid (not a wall)
        if (!checkWallCollision(newX, newZ)) {
          enemy.x = newX;
          enemy.z = newZ;
          enemy.mesh.position.set(enemy.x, 0.3, enemy.z);

          // Rotate to face movement direction
          enemy.mesh.rotation.y = Math.atan2(dirX, dirZ);
        } else {
          // If blocked, try random direction
          const randomAngle = Math.random() * Math.PI * 2;
          const randomX = enemy.x + Math.cos(randomAngle) * speed;
          const randomZ = enemy.z + Math.sin(randomAngle) * speed;

          if (!checkWallCollision(randomX, randomZ)) {
            enemy.x = randomX;
            enemy.z = randomZ;
            enemy.mesh.position.set(enemy.x, 0.3, enemy.z);
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
// PLAYER MOVEMENT
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

  // Update velocity with smoothing
  player.velocity.x = dirX * gameState.playerSpeed;
  player.velocity.z = dirZ * gameState.playerSpeed;

  // Calculate new position
  const newX = player.x + player.velocity.x;
  const newZ = player.z + player.velocity.z;

  // Check for wall collision
  if (!checkWallCollision(newX, player.z)) {
    player.x = newX;
  }
  if (!checkWallCollision(player.x, newZ)) {
    player.z = newZ;
  }

  // Update mesh position
  player.mesh.position.set(player.x, 0.3, player.z);

  // Rotate player to face movement direction
  if (dirX !== 0 || dirZ !== 0) {
    player.mesh.rotation.z = Math.atan2(dirX, dirZ);
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
  const startCell = pathCells.find(cell =>
    Math.abs(cell.row - 10) < 2 && Math.abs(cell.col - 10) < 2
  ) || pathCells[0];

  player.x = startCell.x;
  player.z = startCell.z;
  player.mesh.position.set(player.x, 0.3, player.z);

  // Reset level stats
  gameState.gazellesCaught = 0;
  gameState.lives = 3;

  // Increase difficulty
  gameState.enemySpeed = 0.06 + (gameState.level - 1) * 0.01;

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
    const startCell = pathCells.find(cell =>
      Math.abs(cell.row - 10) < 2 && Math.abs(cell.col - 10) < 2
    ) || pathCells[0];

    player.x = startCell.x;
    player.z = startCell.z;
    player.mesh.position.set(player.x, 0.3, player.z);
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
  gameState.playerSpeed = 0.12;
  gameState.enemySpeed = 0.06;
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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.top = 15;
directionalLight.shadow.camera.bottom = -15;
scene.add(directionalLight);

// ==========================================
// CAMERA
// ==========================================
const camera = new THREE.PerspectiveCamera(
  60,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 18, 12);
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
renderer.setClearColor(0x87ceeb);
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

    // Animate gazelles (bobbing effect)
    gazelles.forEach(gazelle => {
      if (gazelle.active) {
        gazelle.mesh.position.y = 0.2 + Math.sin(elapsedTime * 3 + gazelle.mesh.userData.bobOffset) * 0.1;
        gazelle.mesh.rotation.y += 0.02;
      }
    });

    // Smooth camera follow
    const targetCameraX = player.x;
    const targetCameraZ = player.z + 12;
    camera.position.x += (targetCameraX - camera.position.x) * 0.05;
    camera.position.z += (targetCameraZ - camera.position.z) * 0.05;
    camera.lookAt(player.x, 0, player.z);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

import * as THREE from 'https://cdn.skypack.dev/three@0.152.2';
import { GLTFLoader } from 'https://cdn.skypack.dev/three/examples/jsm/loaders/GLTFLoader';

let scene, camera, renderer, mixer;
let player, road, clock;
let obstacles = [], coins = [];
let score = 0, gameOver = false;
let moveLeft = false, moveRight = false;
let jump = false, isJumping = false;
let selectedCharacter = 'player1.glb';
let selectedTheme = 'jungle.jpg';
let obstacleInterval, coinInterval;

const canvas = document.getElementById("gameCanvas");
const bgMusic = document.getElementById("bgMusic");

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('darkToggle').addEventListener('change', () => {
  document.body.classList.toggle('dark');
});

function startGame() {
  selectedCharacter = document.getElementById('characterSelect').value;
  selectedTheme = document.getElementById('themeSelect').value;
  document.getElementById('start-screen').classList.remove('active');
  bgMusic.play();
  init();
}

function init() {
  scene = new THREE.Scene();
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(`assets/${selectedTheme}`, function (texture) {
    scene.background = texture;
  });

  const loader = new GLTFLoader();
  loader.load(`assets/${selectedCharacter}`, function (gltf) {
    player = gltf.scene;
    player.position.set(0, 0, 0);
    scene.add(player);

    mixer = new THREE.AnimationMixer(player);
    if (gltf.animations.length > 0) {
      mixer.clipAction(gltf.animations[0]).play();
    }

    loader.load('assets/road.glb', function (gltf) {
      road = gltf.scene;
      road.position.set(0, -1, 0);
      scene.add(road);

      // Start the game loop and spawns AFTER all assets are loaded
      animate();
      spawnObstacles();
      spawnCoins();
      setupControls();
    });
  });
}

function animate() {
  requestAnimationFrame(animate);
  let delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  if (player && !gameOver) {
    player.position.z -= 0.1;

    if (moveLeft && player.position.x > -1.5) player.position.x -= 0.1;
    if (moveRight && player.position.x < 1.5) player.position.x += 0.1;

    if (jump && !isJumping) {
      isJumping = true;
      let jumpHeight = 0;
      let up = true;
      let jumpInterval = setInterval(() => {
        if (up) {
          player.position.y += 0.1;
          jumpHeight += 0.1;
          if (jumpHeight >= 1.2) up = false;
        } else {
          player.position.y -= 0.1;
          if (player.position.y <= 0) {
            player.position.y = 0;
            isJumping = false;
            clearInterval(jumpInterval);
          }
        }
      }, 16);
    }

    obstacles.forEach(obs => {
      obs.position.z += 0.1;
      if (obs.position.distanceTo(player.position) < 0.5) {
        endGame();
      }
    });

    coins.forEach((coin, index) => {
      coin.rotation.y += 0.1;
      coin.position.z += 0.1;
      if (coin.position.distanceTo(player.position) < 0.5) {
        score += 10;
        scene.remove(coin);
        coins.splice(index, 1);
      }
    });
  }

  renderer.render(scene, camera);
}

function spawnObstacles() {
  const loader = new GLTFLoader();
  obstacleInterval = setInterval(() => {
    if (gameOver || !player) return;
    loader.load('assets/obstacle.glb', function (gltf) {
      let obs = gltf.scene;
      let x = [-1.5, 0, 1.5][Math.floor(Math.random() * 3)];
      obs.position.set(x, 0, player.position.z - 20);
      scene.add(obs);
      obstacles.push(obs);
    });
  }, 2000);
}

function spawnCoins() {
  const loader = new GLTFLoader();
  coinInterval = setInterval(() => {
    if (gameOver || !player) return;
    loader.load('assets/coin.glb', function (gltf) {
      let coin = gltf.scene;
      let x = [-1.5, 0, 1.5][Math.floor(Math.random() * 3)];
      coin.position.set(x, 0.5, player.position.z - 20);
      scene.add(coin);
      coins.push(coin);
    });
  }, 1500);
}

function setupControls() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') moveLeft = true;
    if (e.key === 'ArrowRight') moveRight = true;
    if (e.key === 'ArrowUp') jump = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') moveLeft = false;
    if (e.key === 'ArrowRight') moveRight = false;
    if (e.key === 'ArrowUp') jump = false;
  });

  let touchStartX = 0;
  let touchEndX = 0;

  window.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      jump = true;
    } else {
      touchStartX = e.changedTouches[0].screenX;
    }
  });

  window.addEventListener('touchend', e => {
    jump = false;
    if (e.changedTouches.length === 1) {
      touchEndX = e.changedTouches[0].screenX;
      let diff = touchEndX - touchStartX;
      if (diff > 50) moveRight = true;
      else if (diff < -50) moveLeft = true;

      setTimeout(() => { moveLeft = false; moveRight = false; }, 200);
    }
  });
}

function endGame() {
  gameOver = true;
  clearInterval(obstacleInterval);
  clearInterval(coinInterval);
  document.getElementById('finalScore').textContent = score;
  document.getElementById('game-over').classList.add('active');
  bgMusic.pause();
}


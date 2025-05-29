// ... (Keep all your existing const declarations for UI elements at the top) ...
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const levelCompleteScreen = document.getElementById('level-complete-screen');
const finalGameOverScreen = document.getElementById('final-game-over-screen');
const allLevelsCompleteScreen = document.getElementById('all-levels-complete-screen');
const triesDisplay = document.getElementById('tries-display');
const levelDisplay = document.getElementById('level-display');
const scoreDisplay = document.getElementById('score-display');
const levelCompleteTitle = document.getElementById('level-complete-title');
const genderRevealText = document.getElementById('gender-reveal');
const nextLevelButton = document.getElementById('next-level-button');
const finalScoreGameOverText = document.getElementById('final-score-gameover');
const trophiesCollectedGameOverText = document.getElementById('trophies-collected-gameover');
const restartGameButton = document.getElementById('restart-game-button');
const finalScoreWinText = document.getElementById('final-score-win');
const trophiesCollectedWinText = document.getElementById('trophies-collected-win');
const playAgainAllLevelsButton = document.getElementById('play-again-all-levels-button');

// Game Constants (Keep these as they were)
const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
const PINK_CEILING_FLOOR_COLOR = "#FFC0CB";
const CEILING_FLOOR_HEIGHT = 20;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 45;
const GRAVITY = 0.42;
const JUMP_STRENGTH = -8.5;
const PLAYER_START_X = 100;
const PLAYER_START_Y = GAME_HEIGHT / 2;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 50;
let OBSTACLE_SPEED = 3;
let OBSTACLE_SPAWN_INTERVAL = 1700;
const FIXED_OBSTACLES_PER_LEVEL = 20;
const EGG_WIDTH = 120;
const EGG_HEIGHT = 120;
const MAX_LEVELS = 10;
const MAX_TRIES = 5;
const TROPHY_SIZE = 28;
const TROPHY_MARGIN = 6;
const BOY_COLOR = 'deepskyblue';
const GIRL_COLOR = 'hotpink';

// Game State Variables
let player;
let obstacles = [];
let egg;
let backgroundSperms = [];
let currentLevel = 1;
let triesRemaining = MAX_TRIES;
let totalScore = 0;
let currentLevelScore = 0;
let trophies = [];
let gameRunning = false;
let gamePaused = false;
let lastObstacleSpawnTime = 0;
let obstaclesPassedThisLevel = 0;
let currentLevelTargetObstacles = FIXED_OBSTACLES_PER_LEVEL;

console.log("Initial state: gameRunning =", gameRunning, ", gamePaused =", gamePaused); // DEBUG

// Images
let playerImage = new Image(); playerImage.src = 'img/sperm_char.png';
let eggImage = new Image(); eggImage.src = 'img/egg.png';
let obstacleImage = new Image(); obstacleImage.src = 'img/obstacle_cell.png';

// --- Background Sperm Functions (Keep as they were) ---
const NUM_BACKGROUND_SPERMS = 7;
const BG_SPERM_MIN_SCALE = 0.4;
const BG_SPERM_MAX_SCALE = 0.7;
const BG_SPERM_MIN_OPACITY = 0.2;
const BG_SPERM_MAX_OPACITY = 0.5;
function initBackgroundSperms() {
    backgroundSperms = [];
    for (let i = 0; i < NUM_BACKGROUND_SPERMS; i++) {
        const scale = Math.random() * (BG_SPERM_MAX_SCALE - BG_SPERM_MIN_SCALE) + BG_SPERM_MIN_SCALE;
        const spermWidth = PLAYER_WIDTH * scale;
        const spermHeight = PLAYER_HEIGHT * scale;
        backgroundSperms.push({
            image: playerImage, x: Math.random() * GAME_WIDTH,
            y: Math.random() * (GAME_HEIGHT - spermHeight - CEILING_FLOOR_HEIGHT * 2) + CEILING_FLOOR_HEIGHT,
            speed: 0.1 + Math.random() * 0.4, scale: scale,
            opacity: Math.random() * (BG_SPERM_MAX_OPACITY - BG_SPERM_MIN_OPACITY) + BG_SPERM_MIN_OPACITY,
            width: spermWidth, height: spermHeight
        });
    }
    console.log("Background sperms initialized."); // DEBUG
}
function drawBackgroundSperms() {
    backgroundSperms.forEach(sperm => {
        if (sperm.image.complete && sperm.image.naturalWidth > 0) {
            ctx.save(); ctx.globalAlpha = sperm.opacity;
            ctx.drawImage(sperm.image, sperm.x, sperm.y, sperm.width, sperm.height);
            ctx.restore();
        }
        sperm.x -= sperm.speed;
        if (sperm.x + sperm.width < 0) {
            sperm.x = GAME_WIDTH;
            sperm.y = Math.random() * (GAME_HEIGHT - sperm.height - CEILING_FLOOR_HEIGHT * 2) + CEILING_FLOOR_HEIGHT;
        }
    });
    ctx.globalAlpha = 1.0;
}

// --- Game Object Classes (Keep as they were) ---
class Player {
    constructor(x, y, width, height, image) {
        this.x = x; this.y = y; this.width = width; this.height = height;
        this.image = image; this.velocityY = 0;
    }
    jump() { if (this.y > CEILING_FLOOR_HEIGHT) this.velocityY = JUMP_STRENGTH; }
    update() {
        this.velocityY += GRAVITY;
        this.y += this.velocityY;
        if (this.y + this.height > GAME_HEIGHT - CEILING_FLOOR_HEIGHT || this.y < CEILING_FLOOR_HEIGHT) {
            handleAttemptFailed();
        }
    }
    draw() {
        if (this.image.complete) ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        else { ctx.fillStyle = 'blue'; ctx.fillRect(this.x, this.y, this.width, this.height); }
    }
}
class Obstacle {
    constructor(x, y, width, height, image) {
        this.x = x; this.y = y; this.width = width; this.height = height;
        this.image = image; this.passed = false;
    }
    update() { this.x -= OBSTACLE_SPEED; }
    draw() {
        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'grey'; ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
class Egg {
    constructor(x, y, width, height, image) {
        this.x = x; this.y = y; this.width = width; this.height = height;
        this.image = image; this.active = false;
    }
    update() { if (this.active) this.x -= OBSTACLE_SPEED; }
    draw() {
        if (!this.active) return;
        if (this.image.complete) ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        else {
            ctx.fillStyle = 'orange'; ctx.beginPath();
            ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// --- Core Game Logic (Keep as they were, with DEBUG logs added) ---
function updateUI() {
    triesDisplay.textContent = `Tries: ${triesRemaining}`;
    levelDisplay.textContent = `Level: ${currentLevel}`;
    scoreDisplay.textContent = `Score: ${totalScore + currentLevelScore}`;
}
function getLevelConfig(level) {
    return {
        targetObstacles: FIXED_OBSTACLES_PER_LEVEL,
        obstacleSpeed: 3 + (level - 1) * 0.15,
        spawnInterval: Math.max(1000, OBSTACLE_SPAWN_INTERVAL - (level - 1) * 70)
    };
}
function resetPlayerForAttempt() {
    player = new Player(PLAYER_START_X, PLAYER_START_Y, PLAYER_WIDTH, PLAYER_HEIGHT, playerImage);
}
function setupNewLevel(level) {
    console.log("setupNewLevel called for level:", level); // DEBUG
    currentLevel = level;
    const config = getLevelConfig(level);
    currentLevelTargetObstacles = config.targetObstacles;
    OBSTACLE_SPEED = config.obstacleSpeed;
    OBSTACLE_SPAWN_INTERVAL = config.spawnInterval;
    resetPlayerForAttempt();
    obstacles = [];
    egg = new Egg(GAME_WIDTH + 200, (GAME_HEIGHT - EGG_HEIGHT) / 2, EGG_WIDTH, EGG_HEIGHT, eggImage);
    egg.active = false;
    currentLevelScore = 0;
    obstaclesPassedThisLevel = 0;
    lastObstacleSpawnTime = performance.now();
    updateUI();
    hideAllScreens();
    gameRunning = true;
    gamePaused = false;
    console.log("setupNewLevel complete: gameRunning =", gameRunning, ", gamePaused =", gamePaused); // DEBUG
    if (level === 1 && triesRemaining === MAX_TRIES) {
        initBackgroundSperms();
    }
}
function startGameFlow() {
    console.log("startGameFlow called."); // DEBUG
    triesRemaining = MAX_TRIES;
    currentLevel = 1;
    totalScore = 0;
    trophies = [];
    setupNewLevel(1);
    gameLoop();
}
function startNextLevelFlow() {
    console.log("startNextLevelFlow called."); // DEBUG
    totalScore += currentLevelScore;
    setupNewLevel(currentLevel);
    gameLoop();
}
function spawnObstacle() {
    if (egg.active || obstaclesPassedThisLevel >= currentLevelTargetObstacles) {
        if (!egg.active && obstaclesPassedThisLevel >= currentLevelTargetObstacles) {
            egg.active = true;
            egg.x = GAME_WIDTH + 100;
            egg.y = (GAME_HEIGHT - egg.height) / 2;
        }
        return;
    }
    const randomY = Math.random() * (GAME_HEIGHT - 2 * CEILING_FLOOR_HEIGHT - OBSTACLE_HEIGHT - 80) + CEILING_FLOOR_HEIGHT + 40;
    obstacles.push(new Obstacle(GAME_WIDTH, randomY, OBSTACLE_WIDTH, OBSTACLE_HEIGHT, obstacleImage));
    lastObstacleSpawnTime = performance.now();
}
function checkCollisions() {
    for (let obs of obstacles) {
        if (player.x < obs.x + obs.width && player.x + player.width > obs.x &&
            player.y < obs.y + obs.height && player.y + player.height > obs.y) {
            handleAttemptFailed(); return;
        }
    }
    if (egg.active && player.x < egg.x + egg.width && player.x + player.width > egg.x &&
        player.y < egg.y + egg.height && player.y + player.height > egg.y) {
        handleLevelComplete(); return;
    }
}
function handleAttemptFailed() {
    if (gamePaused) return;
    console.log("handleAttemptFailed called."); // DEBUG
    gameRunning = false; triesRemaining--; updateUI();
    if (triesRemaining <= 0) {
        showFinalGameOverScreen();
    } else {
        currentLevelScore = 0; obstaclesPassedThisLevel = 0;
        resetPlayerForAttempt(); obstacles = [];
        if(egg) egg.active = false;
        lastObstacleSpawnTime = performance.now();
        gameRunning = true; // Resume for next try
        console.log("Continuing current level after failed attempt. gameRunning =", gameRunning); // DEBUG
    }
}
function handleLevelComplete() {
    console.log("handleLevelComplete called."); // DEBUG
    gameRunning = false; gamePaused = true;
    const genderIsBoy = Math.random() < 0.5;
    trophies.push({ type: genderIsBoy ? 'boy' : 'girl' });
    levelCompleteTitle.textContent = `Level ${currentLevel} Complete!`;
    genderRevealText.textContent = `It's a ${genderIsBoy ? 'BOY' : 'GIRL'}!`;
    levelCompleteScreen.style.display = 'flex';
    currentLevel++;
    if (currentLevel > MAX_LEVELS) {
        nextLevelButton.textContent = "See Final Results!";
    } else {
        nextLevelButton.textContent = `Start Level ${currentLevel}`;
    }
}
function updateGame() {
    if (!gameRunning || gamePaused) return;
    player.update();
    if (!gameRunning) return; // Check if player.update() caused game over
    if (performance.now() - lastObstacleSpawnTime > OBSTACLE_SPAWN_INTERVAL) {
        spawnObstacle();
    }
    obstacles.forEach(obs => obs.update());
    obstacles = obstacles.filter(obs => obs.x + obs.width > 0);
    obstacles.forEach(obs => {
        if (!obs.passed && obs.x + obs.width < player.x) {
            obs.passed = true; obstaclesPassedThisLevel++;
            currentLevelScore += 10; updateUI();
        }
    });
    if (egg && egg.active) egg.update();
    checkCollisions();
}
function drawTrophies() {
    let startDrawX = GAME_WIDTH - TROPHY_MARGIN - (TROPHY_SIZE / 2);
    const trophyY = TROPHY_MARGIN + CEILING_FLOOR_HEIGHT + (TROPHY_SIZE / 2);
    for (let i = 0; i < trophies.length; i++) {
        const trophy = trophies[i]; const x = startDrawX - i * (TROPHY_SIZE + TROPHY_MARGIN);
        ctx.beginPath(); ctx.arc(x, trophyY, TROPHY_SIZE / 2, 0, Math.PI * 2);
        ctx.fillStyle = trophy.type === 'boy' ? BOY_COLOR : GIRL_COLOR; ctx.fill();
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = 'black'; ctx.beginPath();
        ctx.arc(x - TROPHY_SIZE * 0.18, trophyY - TROPHY_SIZE * 0.1, TROPHY_SIZE * 0.07, 0, Math.PI * 2);
        ctx.arc(x + TROPHY_SIZE * 0.18, trophyY - TROPHY_SIZE * 0.1, TROPHY_SIZE * 0.07, 0, Math.PI * 2);
        ctx.fill(); ctx.beginPath();
        ctx.arc(x, trophyY + TROPHY_SIZE * 0.15, TROPHY_SIZE * 0.2, 0, Math.PI);
        ctx.strokeStyle = 'black'; ctx.lineWidth = Math.max(1, TROPHY_SIZE * 0.05); ctx.stroke();
    }
    ctx.lineWidth = 1;
}
function drawGame() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    drawBackgroundSperms();
    ctx.fillStyle = PINK_CEILING_FLOOR_COLOR;
    ctx.fillRect(0, 0, GAME_WIDTH, CEILING_FLOOR_HEIGHT);
    ctx.fillRect(0, GAME_HEIGHT - CEILING_FLOOR_HEIGHT, GAME_WIDTH, CEILING_FLOOR_HEIGHT);
    if (player) player.draw();
    obstacles.forEach(obs => obs.draw());
    if (egg) egg.draw();
    drawTrophies();
}
function gameLoop() {
    if (gamePaused && !gameRunning && triesRemaining <=0) { return; }
    if (gamePaused && !gameRunning && currentLevel > MAX_LEVELS) { return; }
    if (gamePaused && !gameRunning && currentLevel <= MAX_LEVELS && triesRemaining > 0) {
        drawGame(); requestAnimationFrame(gameLoop); return;
    }
    updateGame(); drawGame();
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// --- Screen Management (Keep as they were) ---
function hideAllScreens() {
    if(startScreen) startScreen.style.display = 'none'; // Check if element exists
    if(levelCompleteScreen) levelCompleteScreen.style.display = 'none';
    if(finalGameOverScreen) finalGameOverScreen.style.display = 'none';
    if(allLevelsCompleteScreen) allLevelsCompleteScreen.style.display = 'none';
}
function showFinalGameOverScreen() {
    console.log("showFinalGameOverScreen called."); // DEBUG
    gameRunning = false; gamePaused = true; hideAllScreens();
    totalScore += currentLevelScore; currentLevelScore = 0;
    finalScoreGameOverText.textContent = `Final Score: ${totalScore}`;
    trophiesCollectedGameOverText.textContent = `Trophies: ${trophies.length} (${trophies.map(t=>t.type.charAt(0).toUpperCase()).join(', ')})`;
    finalGameOverScreen.style.display = 'flex';
}
function showAllLevelsCompleteScreen() {
    console.log("showAllLevelsCompleteScreen called."); // DEBUG
    gameRunning = false; gamePaused = true; hideAllScreens();
    totalScore += currentLevelScore; currentLevelScore = 0;
    finalScoreWinText.textContent = `Final Score: ${totalScore}`;
    trophiesCollectedWinText.textContent = `Trophies: ${trophies.length} (${trophies.map(t=>t.type.charAt(0).toUpperCase()).join(', ')})`;
    allLevelsCompleteScreen.style.display = 'flex';
}

// --- Event Listeners (With DEBUG logs) ---
function handleInput() {
    console.log("handleInput called. Conditions: !gameRunning =", !gameRunning, ", !gamePaused =", !gamePaused, ", startScreen.style.display !== 'none' =", startScreen ? startScreen.style.display !== 'none' : 'startScreen_null'); // DEBUG
    if (startScreen && !gameRunning && !gamePaused && startScreen.style.display !== 'none') {
        console.log("Condition to start game met. Calling startGameFlow()."); // DEBUG
        startGameFlow();
    } else if (gameRunning && !gamePaused) {
        console.log("Game is running. Calling player.jump()."); // DEBUG
        if (player) player.jump();
        else console.error("Player object is null when trying to jump!"); // DEBUG
    } else {
        console.log("handleInput: No action taken for current game state."); // DEBUG
    }
}

document.addEventListener('keydown', (e) => {
    console.log("Keydown event detected. Code:", e.code); // DEBUG
    if (e.code === 'Space') {
        console.log("Spacebar pressed!"); // DEBUG
        e.preventDefault();
        handleInput();
    }
});
if (canvas) { // Check if canvas exists before adding listeners
    canvas.addEventListener('mousedown', () => {
        console.log("Canvas mousedown detected."); // DEBUG
        handleInput();
    });
    canvas.addEventListener('touchstart', (e) => {
        console.log("Canvas touchstart detected."); // DEBUG
        e.preventDefault();
        handleInput();
    });
} else {
    console.error("Canvas element not found for input listeners."); // DEBUG
}

if (nextLevelButton) { // Check if element exists
    nextLevelButton.addEventListener('click', () => {
        console.log("Next Level button clicked."); // DEBUG
        if (currentLevel > MAX_LEVELS) { showAllLevelsCompleteScreen(); }
        else { startNextLevelFlow(); }
    });
}
if (restartGameButton) { // Check if element exists
    restartGameButton.addEventListener('click', () => {
        console.log("Restart Game (from game over) button clicked."); // DEBUG
        startGameFlow();
    });
}
if (playAgainAllLevelsButton) { // Check if element exists
    playAgainAllLevelsButton.addEventListener('click', () => {
        console.log("Play Again (from win) button clicked."); // DEBUG
        startGameFlow();
    });
}


// --- Initial Load (With DEBUG logs) ---
window.onload = () => {
    console.log("window.onload triggered."); // DEBUG
    let imagesLoadedCount = 0;
    const totalImagesToLoad = 3;

    const onSingleImageLoad = (imageName) => {
        imagesLoadedCount++;
        console.log(`${imageName} processed. Total images processed: ${imagesLoadedCount}/${totalImagesToLoad}`); // DEBUG
        if (imagesLoadedCount === totalImagesToLoad) {
            allImagesLoaded();
        }
    };

    const allImagesLoaded = () => {
        console.log("All images processed. Setting up start screen."); // DEBUG
        initBackgroundSperms();
        hideAllScreens();
        if (startScreen) {
            startScreen.style.display = 'flex';
            console.log("Start screen display set to 'flex'."); // DEBUG
        } else {
            console.error("Start screen element not found in allImagesLoaded."); // DEBUG
        }
        updateUI();
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        drawBackgroundSperms();
        ctx.fillStyle = PINK_CEILING_FLOOR_COLOR;
        ctx.fillRect(0, 0, GAME_WIDTH, CEILING_FLOOR_HEIGHT);
        ctx.fillRect(0, GAME_HEIGHT - CEILING_FLOOR_HEIGHT, GAME_WIDTH, CEILING_FLOOR_HEIGHT);
        console.log("Initial static frame drawn."); // DEBUG
    };

    playerImage.onload = () => onSingleImageLoad("PlayerImage");
    eggImage.onload = () => onSingleImageLoad("EggImage");
    obstacleImage.onload = () => onSingleImageLoad("ObstacleImage");

    playerImage.onerror = () => { console.error("Failed to load player image."); onSingleImageLoad("PlayerImage (Error)"); };
    eggImage.onerror = () => { console.error("Failed to load egg image."); onSingleImageLoad("EggImage (Error)"); };
    obstacleImage.onerror = () => { console.error("Failed to load obstacle image."); onSingleImageLoad("ObstacleImage (Error)"); };

    // Check for cached images more carefully
    let alreadyCompleted = 0;
    if (playerImage.complete && playerImage.naturalWidth !== 0) alreadyCompleted++;
    if (eggImage.complete && eggImage.naturalWidth !== 0) alreadyCompleted++;
    if (obstacleImage.complete && obstacleImage.naturalWidth !== 0) alreadyCompleted++;

    console.log(`Cached images detected (complete & naturalWidth > 0): ${alreadyCompleted}`); // DEBUG
    
    if (alreadyCompleted === totalImagesToLoad && imagesLoadedCount < totalImagesToLoad) {
        // If all images are reported as 'complete' by the browser (likely cached)
        // and our onload counters haven't caught up yet, force the allImagesLoaded.
        console.log("All images seem to be cached and complete. Forcing allImagesLoaded."); // DEBUG
        imagesLoadedCount = totalImagesToLoad; // Sync counter
        allImagesLoaded();
    } else if (imagesLoadedCount === totalImagesToLoad) {
        // This case handles if all onloads fired very quickly before this check
        console.log("All onloads fired quickly, calling allImagesLoaded (if not already)."); // DEBUG
        // allImagesLoaded() would have been called by the last onSingleImageLoad
    } else {
        console.log("Waiting for onload/onerror events for remaining images."); // DEBUG
    }
};
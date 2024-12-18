// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Power-up types
const POWERUP_TYPES = {
    SHIELD: 'shield',
    RAPID_FIRE: 'rapid-fire',
    TRIPLE_SHOT: 'triple-shot',
    HEALTH: 'health',
    NUKE: 'nuke'  // Destroys all enemies on screen
};

// Game elements
class Player {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 5;
        this.bullets = [];
        this.health = 3;
        this.shield = 0;
        this.rapidFire = false;
        this.tripleShot = false;
        this.powerupTimers = {
            rapidFire: 0,
            tripleShot: 0
        };
        this.maxHealth = 3;
        this.health = this.maxHealth;
        this.shootCooldown = 0;
    }

    draw() {
        // Draw ship
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Draw shield if active
        if (this.shield > 0) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.8, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw health hearts
        for (let i = 0; i < this.health; i++) {
            drawHeart(canvas.width - 30 - (i * 30), 30);
        }

        // Draw active power-ups
        let powerupY = 70;
        if (this.shield > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.fillText(`Shield: ${this.shield}`, canvas.width - 100, powerupY);
            powerupY += 25;
        }
        if (this.rapidFire) {
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.fillText('Rapid Fire', canvas.width - 100, powerupY);
            powerupY += 25;
        }
        if (this.tripleShot) {
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.fillText('Triple Shot', canvas.width - 100, powerupY);
        }

        // Draw high score
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`High Score: ${highScore}`, 20, 30);
        ctx.textAlign = 'center'; // Reset text align
    }

    move(direction) {
        switch(direction) {
            case 'left':
                if (this.x > 0) this.x -= this.speed;
                break;
            case 'right':
                if (this.x < canvas.width - this.width) this.x += this.speed;
                break;
            case 'up':
                if (this.y > 0) this.y -= this.speed;
                break;
            case 'down':
                if (this.y < canvas.height - this.height) this.y += this.speed;
                break;
        }
    }

    shoot() {
        // For rapid fire, ignore bullet limit and cooldown
        if (this.rapidFire) {
            if (this.tripleShot) {
                this.bullets.push(
                    new Bullet(this.x + this.width / 2, this.y, -6, 0),     // Forward
                    new Bullet(this.x + this.width / 2, this.y, -5, -3),    // Diagonal left
                    new Bullet(this.x + this.width / 2, this.y, -5, 3)      // Diagonal right
                );
            } else {
                this.bullets.push(new Bullet(this.x + this.width / 2, this.y, -6, 0));
            }
            return;
        }

        // Regular shooting with cooldown and bullet limit
        if (this.shootCooldown <= 0 && this.bullets.length < 5) {
            if (this.tripleShot) {
                this.bullets.push(
                    new Bullet(this.x + this.width / 2, this.y, -6, 0),     // Forward
                    new Bullet(this.x + this.width / 2, this.y, -5, -3),    // Diagonal left
                    new Bullet(this.x + this.width / 2, this.y, -5, 3)      // Diagonal right
                );
            } else {
                this.bullets.push(new Bullet(this.x + this.width / 2, this.y, -6, 0));
            }
            this.shootCooldown = 15;
        }
    }

    takeDamage() {
        if (this.shield > 0) {
            this.shield--;
            return false;
        } else {
            this.health--;
            return this.health <= 0;
        }
    }

    updatePowerups() {
        // Update shoot cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        if (this.rapidFire) {
            this.powerupTimers.rapidFire--;
            if (this.powerupTimers.rapidFire <= 0) {
                this.rapidFire = false;
            }
        }
        if (this.tripleShot) {
            this.powerupTimers.tripleShot--;
            if (this.powerupTimers.tripleShot <= 0) {
                this.tripleShot = false;
            }
        }
    }

    addHealth() {
        if (this.health < this.maxHealth) {
            this.health++;
            return true;
        }
        return false;
    }
}

class PowerUp {
    constructor(x, y) {
        this.width = 20;
        this.height = 20;
        this.x = x;
        this.y = y;
        this.speed = 2;
        this.type = this.randomType();
    }

    randomType() {
        const types = Object.values(POWERUP_TYPES);
        return types[Math.floor(Math.random() * types.length)];
    }

    draw() {
        ctx.fillStyle = this.getColor();
        if (this.type === POWERUP_TYPES.HEALTH) {
            // Draw heart shape for health power-up
            drawHeart(this.x + this.width/2, this.y + this.height/2);
        } else if (this.type === POWERUP_TYPES.NUKE) {
            // Draw circle with radiation symbol for nuke
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.fillText('☢', this.x + 4, this.y + 15);
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    getColor() {
        switch (this.type) {
            case POWERUP_TYPES.SHIELD:
                return '#00ffff';
            case POWERUP_TYPES.RAPID_FIRE:
                return '#ffff00';
            case POWERUP_TYPES.TRIPLE_SHOT:
                return '#ff00ff';
            case POWERUP_TYPES.HEALTH:
                return '#ff0000';
            case POWERUP_TYPES.NUKE:
                return '#ff8c00';
            default:
                return '#ffffff';
        }
    }

    move() {
        this.y += this.speed;
    }
}

class Enemy {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speed = 1; // Reduced from 2 to 1
        this.shootingDelay = Math.random() * 120 + 60; // Increased delay
        this.shootingCounter = 0;
    }

    draw() {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    move() {
        this.y += this.speed;
        this.shootingCounter++;
    }

    canShoot() {
        return this.shootingCounter >= this.shootingDelay;
    }

    shoot() {
        this.shootingCounter = 0;
        return new Bullet(
            this.x + this.width / 2,
            this.y + this.height,
            5
        );
    }
}

class Bullet {
    constructor(x, y, speedY, speedX = 0) {
        this.width = 4;
        this.height = 10;
        this.x = x - this.width / 2;
        this.y = y;
        this.speedY = speedY;
        this.speedX = speedX;
    }

    draw() {
        ctx.fillStyle = this.speedY < 0 ? '#00ffff' : '#ff6600';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    move() {
        this.y += this.speedY;
        this.x += this.speedX;
    }
}

// Game state
let player = new Player();
let enemies = [];
let enemyBullets = [];
let powerUps = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameOver = false;
let spawnCounter = 0;
let spawnDelay = 60;

// Controls
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    Space: false
};

// Event listeners
document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

document.getElementById('restartButton').addEventListener('click', resetGame);

// Game functions
function spawnEnemy() {
    spawnCounter++;
    if (spawnCounter >= spawnDelay) {
        enemies.push(new Enemy());
        spawnCounter = 0;
        // Increase difficulty over time
        spawnDelay = Math.max(30, spawnDelay - 0.5);
    }
}

function drawHeart(x, y) {
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(x, y + 5);
    ctx.bezierCurveTo(x, y, x - 10, y, x - 10, y + 5);
    ctx.bezierCurveTo(x - 10, y + 15, x, y + 20, x, y + 20);
    ctx.bezierCurveTo(x, y + 20, x + 10, y + 15, x + 10, y + 5);
    ctx.bezierCurveTo(x + 10, y, x, y, x, y + 5);
    ctx.fill();
}

function spawnPowerUp(x, y) {
    if (Math.random() < 0.15) { // 15% chance
        powerUps.push(new PowerUp(x, y));
    }
}

function checkCollisions() {
    // Player bullets hitting enemies
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (collision(bullet, enemy)) {
                // Remove both bullet and enemy
                player.bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 10;
                document.getElementById('scoreValue').textContent = score;
                spawnPowerUp(enemy.x, enemy.y);
                break; // Exit inner loop since bullet is now removed
            }
        }
    }

    // Enemy bullets hitting player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if (collision(bullet, player)) {
            enemyBullets.splice(i, 1);
            if (player.takeDamage()) {
                endGame();
            }
        }
    }

    // Power-ups collection
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        if (collision(powerUp, player)) {
            if (applyPowerUp(powerUp.type)) {
                powerUps.splice(i, 1);
            }
        }
    }

    // Enemies hitting player or reaching bottom
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (collision(enemy, player) || enemy.y + enemy.height >= canvas.height) {
            enemies.splice(i, 1);
            if (player.takeDamage()) {
                endGame();
            }
        }
    }
}

function applyPowerUp(type) {
    switch (type) {
        case POWERUP_TYPES.SHIELD:
            player.shield = Math.min(player.shield + 5, 10);
            break;
        case POWERUP_TYPES.RAPID_FIRE:
            player.rapidFire = true;
            player.powerupTimers.rapidFire = 180; // 3 seconds at 60fps
            break;
        case POWERUP_TYPES.TRIPLE_SHOT:
            player.tripleShot = true;
            player.powerupTimers.tripleShot = 300;
            break;
        case POWERUP_TYPES.HEALTH:
            return player.addHealth();
        case POWERUP_TYPES.NUKE:
            const enemyCount = enemies.length;
            enemies = [];
            score += enemyCount * 10;
            document.getElementById('scoreValue').textContent = score;
            return true;
    }
    return true;
}

function collision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function updateGame() {
    // Move player
    if (keys.ArrowLeft) player.move('left');
    if (keys.ArrowRight) player.move('right');
    if (keys.ArrowUp) player.move('up');
    if (keys.ArrowDown) player.move('down');
    if (keys.Space) player.shoot();

    // Update power-ups
    player.updatePowerups();

    // Update bullets with horizontal boundary check
    player.bullets.forEach(bullet => bullet.move());
    player.bullets = player.bullets.filter(bullet => 
        bullet.y > 0 && bullet.x > 0 && bullet.x < canvas.width
    );

    enemyBullets.forEach(bullet => bullet.move());
    enemyBullets = enemyBullets.filter(bullet => bullet.y < canvas.height);

    // Update enemies
    enemies.forEach(enemy => {
        enemy.move();
        if (enemy.canShoot()) {
            enemyBullets.push(enemy.shoot());
        }
    });
    enemies = enemies.filter(enemy => enemy.y < canvas.height);

    // Update power-ups
    powerUps.forEach(powerUp => powerUp.move());
    powerUps = powerUps.filter(powerUp => powerUp.y < canvas.height);

    // Spawn enemies
    spawnEnemy();

    // Check collisions
    checkCollisions();
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw game elements
    player.draw();
    player.bullets.forEach(bullet => bullet.draw());
    enemies.forEach(enemy => enemy.draw());
    enemyBullets.forEach(bullet => bullet.draw());
    powerUps.forEach(powerUp => powerUp.draw());
}

function endGame() {
    gameOver = true;
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    document.getElementById('gameOver').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;
}

function resetGame() {
    player = new Player();
    enemies = [];
    enemyBullets = [];
    powerUps = [];
    score = 0;
    gameOver = false;
    spawnCounter = 0;
    spawnDelay = 60;
    document.getElementById('scoreValue').textContent = '0';
    document.getElementById('gameOver').classList.add('hidden');
}

// Game loop
function gameLoop() {
    if (!gameOver) {
        updateGame();
        drawGame();
    }
    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop(); 
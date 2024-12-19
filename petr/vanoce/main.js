import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SoundManager } from './sounds.js';

class WinterScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.snowflakes = [];
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.velocity = new THREE.Vector3();
        this.reindeers = [];
        this.gifts = [];
        this.soundManager = new SoundManager();
        this.camera.add(this.soundManager.listener);
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Add gun properties
        this.gun = null;
        this.isGunLoaded = false;
        
        // Add bullet properties
        this.bullets = [];
        this.bulletSpeed = 2.0;
        
        // Add reindeer movement properties
        this.reindeerSpeed = 2.0;
        this.reindeerTurnSpeed = 0.02;
        this.musicSpeedFactor = 1.0;
        
        // Add mobile controls properties
        this.touchStartPos = null;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.mobileControls = null;
        
        this.init();
    }

    async init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Light blue sky
        document.body.appendChild(this.renderer.domElement);

        // Setup camera and controls
        this.camera.position.y = 2;
        this.controls = new PointerLockControls(this.camera, document.body);

        // Click to start
        document.addEventListener('click', async () => {
            if (!this.controls.isLocked) {
                this.controls.lock();
                // Load and start audio after user interaction
                if (!this.soundManager.loaded) {
                    await this.soundManager.loadSounds();
                    this.soundManager.startBackgroundMusic();
                }
            } else {
                this.shoot();
            }
        });

        // Setup lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Create crosshair
        const crosshairGeometry = new THREE.BufferGeometry();
        crosshairGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
            -0.01, 0, 0,
            0.01, 0, 0,
            0, -0.01, 0,
            0, 0.01, 0
        ], 3));
        const crosshairMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        this.crosshair = new THREE.LineSegments(crosshairGeometry, crosshairMaterial);
        this.crosshair.position.z = -0.5;
        this.camera.add(this.crosshair);

        // Load gun model
        await this.loadGun();
        // Load reindeers
        await this.loadReindeer();

        this.createTerrain();
        this.createSnowflakes();
        this.setupMovementControls();
        this.createMobileControls();
        this.animate();
    }

    async loadGun() {
        const loader = new GLTFLoader();
        try {
            const gunModel = await loader.loadAsync('models/gun.glb');
            this.gun = gunModel.scene;
            
            // Position the gun in the bottom right of the view
            this.gun.position.set(0.3, -0.3, -0.5);
            this.gun.rotation.y = Math.PI / 12; // Slight rotation
            this.gun.scale.set(0.1, 0.1, 0.1); // Adjust scale as needed
            
            this.camera.add(this.gun);
            this.isGunLoaded = true;
        } catch (error) {
            console.error("Error loading gun model:", error);
            // Create a simple cube as fallback gun
            const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
            const material = new THREE.MeshPhongMaterial({ color: 0x333333 });
            this.gun = new THREE.Mesh(geometry, material);
            this.gun.position.set(0.3, -0.3, -0.5);
            this.camera.add(this.gun);
        }
    }

    createTerrain() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);

        // Add some trees
        for (let i = 0; i < 50; i++) {
            this.createTree(
                Math.random() * 80 - 40,
                0,
                Math.random() * 80 - 40
            );
        }
    }

    createTree(x, y, z) {
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4d2926 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

        const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0f5f13,
            roughness: 0.8
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 2.5;

        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(leaves);
        tree.position.set(x, y, z);
        this.scene.add(tree);
    }

    createSnowflakes() {
        const snowflakeGeometry = new THREE.BufferGeometry();
        const snowflakeMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });

        for (let i = 0; i < 10000; i++) {
            const snowflake = {
                position: new THREE.Vector3(
                    Math.random() * 100 - 50,
                    Math.random() * 50,
                    Math.random() * 100 - 50
                ),
                velocity: Math.random() * 0.02 + 0.02
            };
            this.snowflakes.push(snowflake);
        }

        const positions = new Float32Array(this.snowflakes.length * 3);
        snowflakeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        this.snowflakeSystem = new THREE.Points(snowflakeGeometry, snowflakeMaterial);
        this.scene.add(this.snowflakeSystem);
    }

    updateSnowflakes() {
        const positions = this.snowflakeSystem.geometry.attributes.position.array;

        for (let i = 0; i < this.snowflakes.length; i++) {
            const snowflake = this.snowflakes[i];
            snowflake.position.y -= snowflake.velocity;

            if (snowflake.position.y < 0) {
                snowflake.position.y = 50;
            }

            positions[i * 3] = snowflake.position.x;
            positions[i * 3 + 1] = snowflake.position.y;
            positions[i * 3 + 2] = snowflake.position.z;
        }

        this.snowflakeSystem.geometry.attributes.position.needsUpdate = true;
    }

    setupMovementControls() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    updateMovement() {
        if (this.controls.isLocked) {
            const delta = 0.1;

            this.velocity.x = 0;
            this.velocity.z = 0;

            if (this.moveForward) this.velocity.z = delta;
            if (this.moveBackward) this.velocity.z = -delta;
            if (this.moveLeft) this.velocity.x = -delta;
            if (this.moveRight) this.velocity.x = delta;

            this.controls.moveRight(this.velocity.x);
            this.controls.moveForward(this.velocity.z);
        }
    }

    animate() {
        const delta = 0.016; // Assuming 60fps
        requestAnimationFrame(this.animate.bind(this));
        this.updateSnowflakes();
        this.updateMovement();
        this.updateGifts(delta);
        this.updateBullets(delta);
        this.updateReindeers(delta);
        this.renderer.render(this.scene, this.camera);
    }

    async loadReindeer() {
        const loader = new GLTFLoader();
        try {
            const reindeerModel = await loader.loadAsync('models/reindeer.glb');
            
            for (let i = 0; i < 10; i++) {
                const reindeer = reindeerModel.scene.clone();
                const x = Math.random() * 80 - 40;
                const z = Math.random() * 80 - 40;
                reindeer.position.set(x, 0, z);
                reindeer.rotation.y = Math.random() * Math.PI * 2;
                reindeer.scale.set(2, 2, 2);
                
                this.reindeers.push({
                    model: reindeer,
                    velocity: new THREE.Vector3(),
                    health: 100,
                    targetPosition: new THREE.Vector3(),
                    wanderAngle: Math.random() * Math.PI * 2,
                    state: 'wandering' // or 'fleeing'
                });
                this.scene.add(reindeer);
            }
        } catch (error) {
            console.error("Error loading reindeer model:", error);
            // Create simple placeholder reindeers
            for (let i = 0; i < 10; i++) {
                const geometry = new THREE.ConeGeometry(1, 2, 4);
                const material = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
                const reindeer = new THREE.Mesh(geometry, material);
                
                const x = Math.random() * 80 - 40;
                const z = Math.random() * 80 - 40;
                reindeer.position.set(x, 1, z);
                reindeer.rotation.y = Math.random() * Math.PI * 2;
                
                this.reindeers.push({
                    model: reindeer,
                    velocity: new THREE.Vector3(),
                    health: 100,
                    targetPosition: new THREE.Vector3(),
                    wanderAngle: Math.random() * Math.PI * 2,
                    state: 'wandering' // or 'fleeing'
                });
                this.scene.add(reindeer);
            }
        }
    }

    createGiftExplosion(position) {
        const giftColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        const particleCount = 50; // More particles
        
        // Create multiple explosion lights
        const lights = [];
        const lightColors = [0xffffcc, 0xff8800, 0xff0000];
        
        lightColors.forEach((color, index) => {
            const light = new THREE.PointLight(color, 50, 15);
            light.position.copy(position);
            this.scene.add(light);
            lights.push(light);
            
            // Animate light intensity
            const startIntensity = 50;
            const animate = () => {
                light.intensity = startIntensity * (1 - (Date.now() - startTime) / 500);
                if (light.intensity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    this.scene.remove(light);
                }
            };
            const startTime = Date.now() + index * 100; // Stagger the lights
            animate();
        });

        // Create shockwave ring
        const shockwaveGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.position.copy(position);
        shockwave.rotation.x = -Math.PI / 2;
        this.scene.add(shockwave);

        // Animate shockwave
        const startTime = Date.now();
        const animateShockwave = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const scale = elapsed * 10;
            shockwave.scale.set(scale, scale, 1);
            shockwave.material.opacity = 0.5 * (1 - elapsed / 0.5);
            
            if (elapsed < 0.5) {
                requestAnimationFrame(animateShockwave);
            } else {
                this.scene.remove(shockwave);
            }
        };
        animateShockwave();

        // Create spark particles
        const sparkGeometry = new THREE.BufferGeometry();
        const sparkPositions = [];
        const sparkVelocities = [];
        const sparkColors = [];
        
        for (let i = 0; i < 200; i++) {
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
            velocity.normalize().multiplyScalar(Math.random() * 5 + 5);
            
            sparkVelocities.push(velocity);
            sparkPositions.push(position.x, position.y, position.z);
            
            const color = new THREE.Color(0xffff00);
            sparkColors.push(color.r, color.g, color.b);
        }
        
        sparkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(sparkPositions, 3));
        sparkGeometry.setAttribute('color', new THREE.Float32BufferAttribute(sparkColors, 3));
        
        const sparkMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
        this.scene.add(sparks);

        // Animate sparks
        const animateSparks = () => {
            const positions = sparks.geometry.attributes.position.array;
            for (let i = 0; i < sparkVelocities.length; i++) {
                positions[i * 3] += sparkVelocities[i].x * 0.016;
                positions[i * 3 + 1] += sparkVelocities[i].y * 0.016;
                positions[i * 3 + 2] += sparkVelocities[i].z * 0.016;
                sparkVelocities[i].y -= 9.8 * 0.016; // gravity
            }
            sparks.geometry.attributes.position.needsUpdate = true;
            
            sparkMaterial.opacity -= 0.016;
            if (sparkMaterial.opacity > 0) {
                requestAnimationFrame(animateSparks);
            } else {
                this.scene.remove(sparks);
            }
        };
        animateSparks();

        // Create gift boxes (enhanced from previous version)
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const material = new THREE.MeshPhongMaterial({
                color: giftColors[Math.floor(Math.random() * giftColors.length)],
                emissive: 0x444444,
                shininess: 100,
                specular: 0xffffff
            });
            const gift = new THREE.Mesh(geometry, material);
            
            gift.position.copy(position);
            
            // More varied and explosive velocity
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * 8 + 4;
            const radius = Math.random() * 6 + 2;
            
            const velocity = new THREE.Vector3(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            this.gifts.push({ 
                mesh: gift, 
                velocity, 
                lifetime: 3.0, // Longer lifetime
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 10,
                    y: (Math.random() - 0.5) * 10,
                    z: (Math.random() - 0.5) * 10
                }
            });
            this.scene.add(gift);
        }
        
        // Play multiple sound effects with slight delays
        this.soundManager.play('explosion');
        setTimeout(() => this.soundManager.play('bells'), 100);
        setTimeout(() => this.soundManager.play('explosion'), 200);
    }

    updateGifts(delta) {
        for (let i = this.gifts.length - 1; i >= 0; i--) {
            const gift = this.gifts[i];
            gift.velocity.y -= 9.8 * delta; // gravity
            gift.mesh.position.add(gift.velocity.multiplyScalar(delta));
            
            // Add spinning motion
            gift.mesh.rotation.x += gift.rotationSpeed.x * delta;
            gift.mesh.rotation.y += gift.rotationSpeed.y * delta;
            gift.mesh.rotation.z += gift.rotationSpeed.z * delta;
            
            gift.lifetime -= delta;
            
            // Fade out before disappearing
            if (gift.lifetime < 0.5) {
                gift.mesh.material.opacity = gift.lifetime / 0.5;
                gift.mesh.material.transparent = true;
            }
            
            if (gift.lifetime <= 0 || gift.mesh.position.y < 0) {
                this.scene.remove(gift.mesh);
                this.gifts.splice(i, 1);
            }
        }
    }

    shoot() {
        // Play sound
        if (this.soundManager.sounds.shoot.isPlaying) {
            this.soundManager.sounds.shoot.stop();
        }
        this.soundManager.play('shoot', 0.4);
        
        // Handle gun recoil
        if (this.gun) {
            const originalPosition = this.gun.position.clone();
            this.gun.position.z += 0.1;
            setTimeout(() => {
                this.gun.position.copy(originalPosition);
            }, 100);
        }
        
        // Create new bullet
        this.createBullet();
    }

    createBullet() {
        const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const bulletMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        // Get camera's world position and direction
        const cameraWorldPos = new THREE.Vector3();
        const cameraWorldDir = new THREE.Vector3();
        
        this.camera.getWorldPosition(cameraWorldPos);
        this.camera.getWorldDirection(cameraWorldDir);
        
        // Set bullet initial position slightly in front of camera
        const bulletOffset = 0.5; // Distance in front of camera
        bullet.position.copy(cameraWorldPos).add(cameraWorldDir.multiplyScalar(bulletOffset));
        
        // Store initial position and direction for consistent movement
        const bulletVelocity = cameraWorldDir.clone().normalize().multiplyScalar(this.bulletSpeed);
        
        this.bullets.push({
            mesh: bullet,
            velocity: bulletVelocity,
            lifetime: 2.0,
            initialPos: bullet.position.clone(),
            initialTime: performance.now() / 1000 // Store creation time in seconds
        });
        
        this.scene.add(bullet);
    }

    updateBullets(delta) {
        const currentTime = performance.now() / 1000;
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            const timeAlive = currentTime - bullet.initialTime;
            
            // Update position based on initial position and velocity
            bullet.mesh.position.copy(bullet.initialPos).add(
                bullet.velocity.clone().multiplyScalar(timeAlive)
            );
            
            // Check collision with reindeers
            for (let j = this.reindeers.length - 1; j >= 0; j--) {
                const reindeer = this.reindeers[j];
                const boundingBox = new THREE.Box3().setFromObject(reindeer.model);
                
                if (boundingBox.containsPoint(bullet.mesh.position)) {
                    // Handle collision
                    this.scene.remove(bullet.mesh);
                    this.bullets.splice(i, 1);
                    
                    reindeer.health -= 50;
                    if (reindeer.health <= 0) {
                        this.createGiftExplosion(reindeer.model.position);
                        this.scene.remove(reindeer.model);
                        this.reindeers.splice(j, 1);
                        
                        // Speed up music
                        this.musicSpeedFactor += 0.1;
                        if (this.soundManager.backgroundMusic) {
                            this.soundManager.backgroundMusic.playbackRate = this.musicSpeedFactor;
                        }
                    }
                    return; // Exit early since bullet is removed
                }
            }
            
            // Remove bullets that have lived too long
            if (timeAlive > bullet.lifetime) {
                this.scene.remove(bullet.mesh);
                this.bullets.splice(i, 1);
            }
        }
    }

    // Add new method for reindeer movement
    updateReindeers(delta) {
        this.reindeers.forEach(reindeer => {
            if (reindeer.state === 'wandering') {
                // Update wander angle
                reindeer.wanderAngle += (Math.random() - 0.5) * this.reindeerTurnSpeed;
                
                // Calculate new velocity
                const direction = new THREE.Vector3(
                    Math.sin(reindeer.wanderAngle),
                    0,
                    Math.cos(reindeer.wanderAngle)
                );
                
                reindeer.velocity.copy(direction.multiplyScalar(this.reindeerSpeed * 0.5));
            } else if (reindeer.state === 'fleeing') {
                // Run away from player
                const toPlayer = new THREE.Vector3().subVectors(
                    this.camera.position,
                    reindeer.model.position
                );
                toPlayer.y = 0; // Keep movement on ground plane
                
                // Run in opposite direction
                const fleeDirection = toPlayer.negate().normalize();
                reindeer.velocity.copy(fleeDirection.multiplyScalar(this.reindeerSpeed));
            }

            // Update position
            reindeer.model.position.add(reindeer.velocity.clone().multiplyScalar(delta));
            
            // Face movement direction
            if (reindeer.velocity.lengthSq() > 0.001) {
                reindeer.model.rotation.y = Math.atan2(
                    reindeer.velocity.x,
                    reindeer.velocity.z
                );
            }

            // Keep within bounds
            const bounds = 40;
            if (Math.abs(reindeer.model.position.x) > bounds || 
                Math.abs(reindeer.model.position.z) > bounds) {
                // Turn around
                reindeer.wanderAngle += Math.PI;
                reindeer.model.position.clamp(
                    new THREE.Vector3(-bounds, 0, -bounds),
                    new THREE.Vector3(bounds, 0, bounds)
                );
            }

            // Chance to change state
            if (Math.random() < 0.01) {
                reindeer.state = 'wandering';
            }
        });
    }

    createMobileControls() {
        if (!this.isMobile) return;

        const controlsDiv = document.createElement('div');
        controlsDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
            z-index: 1000;
        `;

        const shootBtn = document.createElement('button');
        shootBtn.textContent = '🎯 Shoot';
        shootBtn.style.cssText = `
            padding: 15px 30px;
            font-size: 20px;
            background: rgba(255, 0, 0, 0.6);
            border: none;
            border-radius: 25px;
            color: white;
            touch-action: manipulation;
        `;
        
        const moveStick = document.createElement('div');
        moveStick.style.cssText = `
            width: 120px;
            height: 120px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            position: fixed;
            bottom: 20px;
            left: 20px;
            touch-action: none;
        `;

        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.shoot();
        });

        moveStick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartPos = {
                x: touch.clientX,
                y: touch.clientY
            };
        });

        moveStick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.touchStartPos) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - this.touchStartPos.x;
            const deltaY = touch.clientY - this.touchStartPos.y;
            
            // Normalize deltas to -1 to 1 range
            const maxDelta = 60;
            this.moveLeft = deltaX < -10;
            this.moveRight = deltaX > 10;
            this.moveForward = deltaY < -10;
            this.moveBackward = deltaY > 10;
        });

        moveStick.addEventListener('touchend', () => {
            this.touchStartPos = null;
            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;
        });

        controlsDiv.appendChild(shootBtn);
        document.body.appendChild(moveStick);
        document.body.appendChild(controlsDiv);
        
        this.mobileControls = { controlsDiv, moveStick };
    }
}

// Handle window resizing
window.addEventListener('resize', () => {
    const scene = window.winterScene;
    scene.camera.aspect = window.innerWidth / window.innerHeight;
    scene.camera.updateProjectionMatrix();
    scene.renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create and store the scene
async function initScene() {
    window.winterScene = new WinterScene();
    await window.winterScene.init();
}

initScene().catch(console.error); 
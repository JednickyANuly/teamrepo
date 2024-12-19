import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.157.0/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'https://unpkg.com/three@0.157.0/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'https://unpkg.com/three@0.157.0/examples/jsm/loaders/FontLoader.js';
import { TTFLoader } from 'https://unpkg.com/three@0.157.0/examples/jsm/loaders/TTFLoader.js';

// Mobile detection
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: !isMobile,
    powerPreference: isMobile ? "low-power" : "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Update initial camera position
camera.position.set(-0.33, 1.22, 11.89);
camera.lookAt(0, 2, 0);  // Keep looking at the text height

// Camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Main directional light (sun)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(15, 15, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = isMobile ? 1024 : 2048;
directionalLight.shadow.mapSize.height = isMobile ? 1024 : 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -25;
directionalLight.shadow.camera.right = 25;
directionalLight.shadow.camera.top = 25;
directionalLight.shadow.camera.bottom = -25;
directionalLight.shadow.radius = 3;
directionalLight.shadow.bias = -0.001;
scene.add(directionalLight);

// Replace the secondary light with a softer fill light
const fillLight = new THREE.HemisphereLight(
    0xffffff,  // Sky color
    0x404040,  // Ground color
    0.4        // Intensity
);
scene.add(fillLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(50, 50, isMobile ? 25 : 50, isMobile ? 25 : 50);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcccccc,
    roughness: 0.8
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2;
ground.receiveShadow = true;
scene.add(ground);

// Snow particles
const snowflakeCount = isMobile ? 500 : 1000;
const snowflakes = [];
const snowGeometry = new THREE.SphereGeometry(0.02, isMobile ? 4 : 8, isMobile ? 4 : 8);
const snowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

for (let i = 0; i < snowflakeCount; i++) {
    const snowflake = new THREE.Mesh(snowGeometry, snowMaterial);
    resetSnowflake(snowflake);
    scene.add(snowflake);
    snowflakes.push(snowflake);
}

function resetSnowflake(snowflake) {
    snowflake.position.set(
        Math.random() * 50 - 25,
        Math.random() * 20 + 10,
        Math.random() * 50 - 25
    );
    snowflake.velocity = Math.random() * 0.02 + 0.01;
    snowflake.drift = {
        x: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01
    };
}

// Snow accumulation system
class SnowAccumulation {
    constructor() {
        this.resolution = isMobile ? 0.5 : 0.25; // Larger cells on mobile
        this.maxHeight = 0.5;
        this.accumulation = new Map();
        this.snowMeshes = new Map();
    }

    getKey(x, z) {
        const gridX = Math.round(x / this.resolution);
        const gridZ = Math.round(z / this.resolution);
        return `${gridX},${gridZ}`;
    }

    addSnow(x, z) {
        const key = this.getKey(x, z);
        const height = this.accumulation.get(key) || 0;

        if (height < this.maxHeight) {
            const newHeight = height + 0.02;
            this.accumulation.set(key, newHeight);

            // Create or update snow pile
            const gridX = Math.round(x / this.resolution) * this.resolution;
            const gridZ = Math.round(z / this.resolution) * this.resolution;

            if (!this.snowMeshes.has(key)) {
                const snowPileGeometry = new THREE.BoxGeometry(
                    this.resolution,
                    0.02,
                    this.resolution
                );
                const snowPile = new THREE.Mesh(
                    snowPileGeometry,
                    new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        roughness: 0.9,
                        metalness: 0.1
                    })
                );
                snowPile.position.set(gridX, -1.99, gridZ);
                snowPile.receiveShadow = true;
                snowPile.castShadow = true;
                scene.add(snowPile);
                this.snowMeshes.set(key, snowPile);
            }

            const snowPile = this.snowMeshes.get(key);
            snowPile.scale.y = newHeight * 20; // Adjust scale for visible accumulation
            snowPile.position.y = -2 + (newHeight / 2);
        }
    }
}

const snowAccumulation = new SnowAccumulation();

// Add these before the animate function
let lastInteractionTime = 0;
const interactionTimeout = 5000; // 5 seconds
let isUserInteracting = false;

// Update the OrbitControls setup
controls.addEventListener('start', () => {
    isUserInteracting = true;
    lastInteractionTime = Date.now();
});

controls.addEventListener('end', () => {
    isUserInteracting = false;
    lastInteractionTime = Date.now();
});

// Animation
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Log camera position when it changes significantly
    const roundedPos = {
        x: Math.round(camera.position.x * 100) / 100,
        y: Math.round(camera.position.y * 100) / 100,
        z: Math.round(camera.position.z * 100) / 100
    };
    
    if (!window.lastLoggedPos || 
        Math.abs(window.lastLoggedPos.x - roundedPos.x) > 0.1 ||
        Math.abs(window.lastLoggedPos.y - roundedPos.y) > 0.1 ||
        Math.abs(window.lastLoggedPos.z - roundedPos.z) > 0.1) {
        
        console.log('Camera position:', roundedPos);
        window.lastLoggedPos = roundedPos;
    }

    // Update snowflakes
    snowflakes.forEach(snowflake => {
        snowflake.position.y -= snowflake.velocity;
        snowflake.position.x += snowflake.drift.x;
        snowflake.position.z += snowflake.drift.z;

        if (snowflake.position.y < -2 || 
            Math.abs(snowflake.position.x) > 25 || 
            Math.abs(snowflake.position.z) > 25) {
            
            snowAccumulation.addSnow(snowflake.position.x, snowflake.position.z);
            resetSnowflake(snowflake);
        }
    });

    // Update particles with more dynamic movement
    particles.forEach((particle, i) => {
        const userData = particle.userData;
        
        // Vertical floating motion
        particle.position.y = userData.originalY + 
            Math.sin(Date.now() * 0.001 * userData.speed + userData.phase) * userData.amplitude;
        
        // Horizontal swirling motion
        const swirl = Date.now() * 0.001 * 0.5 + i * 0.001;
        particle.position.x = userData.originalX + 
            Math.sin(swirl) * 0.2;
        particle.position.z = userData.originalZ + 
            Math.cos(swirl) * 0.2;
        
        // Sparkle effect
        particle.material.emissiveIntensity = 
            0.5 + Math.sin(Date.now() * 0.001 * 5 + userData.phase) * 0.5;
        
        // Scale pulsing
        particle.scale.setScalar(
            1.0 + Math.sin(Date.now() * 0.001 * 3 + userData.phase) * 0.2
        );
    });

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create a simple tree
function createTree(x, z, scale = 1) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3d2314,  // Darker, richer brown
        roughness: 0.9 
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, -1.5, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;

    // Create 3 layers of leaves with different shades
    const leafColors = [
        0x1a472a,  // Dark pine green
        0x2d5a27,  // Medium forest green
        0x355e20   // Lighter pine green
    ];

    const leaves = [];
    for(let i = 0; i < 3; i++) {
        const leafGeometry = new THREE.ConeGeometry(1 - (i * 0.2), 1.5, 8);
        const leafMaterial = new THREE.MeshStandardMaterial({
            color: leafColors[i],
            roughness: 0.8
        });
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.position.y = i * 0.8;
        leaf.castShadow = true;
        leaf.receiveShadow = true;
        leaves.push(leaf);
        trunk.add(leaf);
    }

    trunk.scale.set(scale, scale, scale);
    scene.add(trunk);
    return trunk;
}

// Add random trees
function createForest() {
    function isInClearing(x, z) {
        // Define the clearing area in front of the billboard
        const billboardZ = -5;  // Billboard z position
        const clearingWidth = 8;  // Width of clearing
        const clearingDepth = 10;  // Depth of clearing
        
        // Check if point is in the clearing area
        return Math.abs(x) < clearingWidth/2 && 
               z > billboardZ - clearingDepth && 
               z < billboardZ + 2;
    }

    // Create dense clusters of trees
    for(let cluster = 0; cluster < 5; cluster++) {
        const centerX = (Math.random() - 0.5) * 35;
        const centerZ = (Math.random() - 0.5) * 35;
        
        // Skip cluster if its center is in the clearing
        if (isInClearing(centerX, centerZ)) continue;
        
        // Create 15-20 trees per cluster
        const treesInCluster = 15 + Math.floor(Math.random() * 5);
        
        for(let i = 0; i < treesInCluster; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 8; // Cluster radius
            const x = centerX + Math.cos(angle) * radius;
            const z = centerZ + Math.sin(angle) * radius;
            
            // Only create tree if it's not in the clearing
            if (!isInClearing(x, z)) {
                const scale = 0.6 + Math.random() * 1.2;
                createTree(x, z, scale);
            }
        }
    }

    // Add some scattered individual trees
    for(let i = 0; i < 30; i++) {
        const x = (Math.random() - 0.5) * 45;
        const z = (Math.random() - 0.5) * 45;
        
        // Only create tree if it's not in the clearing
        if (!isInClearing(x, z)) {
            const scale = 0.7 + Math.random() * 1.0;
            createTree(x, z, scale);
        }
    }
}

// Replace the existing tree creation loop with
createForest();

// Add after scene setup
const particles = [];
const particleCount = 200;

// Create floating 3D text
function createFloatingText() {
    const ttfLoader = new TTFLoader();
    const fontLoader = new FontLoader();

    ttfLoader.load('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf', function(json) {
        const font = fontLoader.parse(json);
        
        const textMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: isMobile ? 0.5 : 1.0,
            roughness: isMobile ? 0.5 : 0.1,
            emissive: 0xffd700,
            emissiveIntensity: 0.2,
            envMapIntensity: isMobile ? 0.5 : 1.5
        });

        const text = 'Veselé Vánoce a šťastný nový rok!';
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: 1.2,
            height: 0.2,
            curveSegments: isMobile ? 4 : 12,
            bevelEnabled: !isMobile,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: isMobile ? 2 : 5
        });

        textGeometry.computeBoundingBox();
        const centerOffset = -(textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x) / 2;
        
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.x = centerOffset;
        textMesh.position.y = 2;
        textMesh.position.z = 0;
        textMesh.castShadow = true;
        textMesh.receiveShadow = true;
        
        scene.add(textMesh);

        // Enhanced sparkling particles
        const particleCount = isMobile ? 200 : 1000;
        const particleGeometry = new THREE.SphereGeometry(0.03, isMobile ? 4 : 8, isMobile ? 4 : 8);
        
        for(let i = 0; i < particleCount; i++) {
            const particleMaterial = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                emissive: 0xffd700,
                emissiveIntensity: 0.8,
                metalness: isMobile ? 0.5 : 1,
                roughness: isMobile ? 0.5 : 0,
                transparent: !isMobile,
                opacity: isMobile ? 1 : 0.8
            });

            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position particles in a more contained volume around the text
            const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
            const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
            
            particle.position.x = centerOffset + (Math.random() * textWidth);
            particle.position.y = 1.8 + Math.random() * textHeight;
            particle.position.z = -0.5 + Math.random() * 1;
            
            particle.userData = {
                originalY: particle.position.y,
                originalX: particle.position.x,
                originalZ: particle.position.z,
                speed: 0.8 + Math.random() * 1.2,
                phase: Math.random() * Math.PI * 2,
                amplitude: 0.1 + Math.random() * 0.15
            };

            particles.push(particle);
            scene.add(particle);
        }
    });
}

// Call createFloatingText instead of createBillboard
createFloatingText();

// Add environment map only for desktop
if (!isMobile) {
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const envMap = cubeTextureLoader.load([
        'https://threejs.org/examples/textures/cube/Park2/posx.jpg',
        'https://threejs.org/examples/textures/cube/Park2/negx.jpg',
        'https://threejs.org/examples/textures/cube/Park2/posy.jpg',
        'https://threejs.org/examples/textures/cube/Park2/negy.jpg',
        'https://threejs.org/examples/textures/cube/Park2/posz.jpg',
        'https://threejs.org/examples/textures/cube/Park2/negz.jpg'
    ]);
    scene.environment = envMap;
}

animate(); 
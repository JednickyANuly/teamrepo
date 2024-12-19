import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.157.0/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'https://unpkg.com/three@0.157.0/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'https://unpkg.com/three@0.157.0/examples/jsm/loaders/FontLoader.js';
import { TTFLoader } from 'https://unpkg.com/three@0.157.0/examples/jsm/loaders/TTFLoader.js';

// Detect if running on mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Adjust quality settings based on device
const qualitySettings = {
    particleCount: isMobile ? 300 : 1000,
    snowflakeCount: isMobile ? 300 : 1000,
    shadowMapSize: isMobile ? 1024 : 2048,
    treeClusters: isMobile ? 3 : 5,
    treesPerCluster: isMobile ? 8 : 15
};

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
directionalLight.shadow.mapSize.width = qualitySettings.shadowMapSize;
directionalLight.shadow.mapSize.height = qualitySettings.shadowMapSize;
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
const groundGeometry = new THREE.PlaneGeometry(50, 50, 50, 50);
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
const snowflakeCount = qualitySettings.snowflakeCount;
const snowflakes = [];
const snowGeometry = new THREE.SphereGeometry(0.02, 8, 8);
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
        this.resolution = 0.25; // Size of each snow accumulation cell
        this.maxHeight = 0.5;   // Maximum snow height
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
let frameCount = 0;
const particleUpdateInterval = isMobile ? 2 : 1;

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Update snowflakes every frame
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

    // Update particles with mobile optimization
    frameCount++;
    if (frameCount % particleUpdateInterval === 0) {
        particles.forEach((particle, i) => {
            const userData = particle.userData;
            
            particle.position.y = userData.originalY + 
                Math.sin(Date.now() * 0.001 * userData.speed + userData.phase) * userData.amplitude;
            
            const swirl = Date.now() * 0.001 * 0.3 + i * 0.001;
            particle.position.x = userData.originalX + Math.sin(swirl) * 0.1;
            particle.position.z = userData.originalZ + Math.cos(swirl) * 0.1;
            
            particle.material.emissiveIntensity = 
                0.5 + Math.sin(Date.now() * 0.001 * 3 + userData.phase) * 0.5;
            
            if (!isMobile) {
                particle.scale.setScalar(
                    1.0 + Math.sin(Date.now() * 0.001 * 3 + userData.phase) * 0.2
                );
            }
        });
    }

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
        const billboardZ = -5;
        const clearingWidth = 8;
        const clearingDepth = 10;
        
        return Math.abs(x) < clearingWidth/2 && 
               z > billboardZ - clearingDepth && 
               z < billboardZ + 2;
    }

    // Create dense clusters of trees
    for(let cluster = 0; cluster < qualitySettings.treeClusters; cluster++) {
        const centerX = (Math.random() - 0.5) * 35;
        const centerZ = (Math.random() - 0.5) * 35;
        
        if (isInClearing(centerX, centerZ)) continue;
        
        const treesInCluster = qualitySettings.treesPerCluster + 
            Math.floor(Math.random() * 5);
        
        for(let i = 0; i < treesInCluster; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 8;
            const x = centerX + Math.cos(angle) * radius;
            const z = centerZ + Math.sin(angle) * radius;
            
            if (!isInClearing(x, z)) {
                const scale = 0.6 + Math.random() * 1.2;
                createTree(x, z, scale);
            }
        }
    }

    // Add scattered trees
    const scatteredTrees = isMobile ? 15 : 30;
    for(let i = 0; i < scatteredTrees; i++) {
        const x = (Math.random() - 0.5) * 45;
        const z = (Math.random() - 0.5) * 45;
        
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
const particleCount = qualitySettings.particleCount;

// Create floating 3D text
function createFloatingText() {
    const ttfLoader = new TTFLoader();
    const fontLoader = new FontLoader();

    ttfLoader.load('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf', function(json) {
        const font = fontLoader.parse(json);
        
        const textMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 1.0,
            roughness: 0.1,
            emissive: 0xffd700,
            emissiveIntensity: 0.2,
            envMapIntensity: 1.5
        });

        const text = 'Veselé Vánoce a šťastný nový rok!';
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: 1.2,
            height: 0.2,
            curveSegments: isMobile ? 8 : 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: isMobile ? 3 : 5
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

        // Create particles with mobile optimization
        const particleCount = qualitySettings.particleCount;
        const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        
        for(let i = 0; i < particleCount; i++) {
            const particleMaterial = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                emissive: 0xffd700,
                emissiveIntensity: 0.8,
                metalness: 1,
                roughness: 0,
                transparent: true,
                opacity: 0.8
            });

            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
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

// Add this after scene setup to create environment map
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

animate(); 
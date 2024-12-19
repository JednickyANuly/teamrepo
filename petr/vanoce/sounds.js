import * as THREE from 'three';

export class SoundManager {
    constructor() {
        this.listener = new THREE.AudioListener();
        this.sounds = {};
        this.backgroundMusic = null;
        this.loaded = false;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.audioContext = null;
    }

    async loadSounds() {
        // Create audio context on user interaction for mobile
        if (this.isMobile && !this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.listener.context = this.audioContext;
        }

        const audioLoader = new THREE.AudioLoader();

        // Load background music
        this.backgroundMusic = new THREE.Audio(this.listener);
        await new Promise(resolve => {
            audioLoader.load('sounds/jingle-bells.mp3', (buffer) => {
                this.backgroundMusic.setBuffer(buffer);
                this.backgroundMusic.setLoop(true);
                this.backgroundMusic.setVolume(0.5);
                this.backgroundMusic.preservesPitch = false;
                resolve();
            });
        });

        // Load sound effects
        const soundEffects = {
            shoot: 'sounds/shoot.mp3',
            explosion: 'sounds/explosion.mp3',
            bells: 'sounds/bells.mp3'
        };

        await Promise.all(Object.entries(soundEffects).map(([name, path]) => {
            return new Promise(resolve => {
                const sound = new THREE.Audio(this.listener);
                audioLoader.load(path, (buffer) => {
                    sound.setBuffer(buffer);
                    sound.setVolume(0.5);
                    this.sounds[name] = sound;
                    resolve();
                });
            });
        }));

        this.loaded = true;
    }

    startBackgroundMusic() {
        if (this.isMobile && this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }
        
        if (this.loaded && this.backgroundMusic && !this.backgroundMusic.isPlaying) {
            this.backgroundMusic.play();
        }
    }

    play(soundName, offset = 0) {
        if (this.isMobile && this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }

        if (this.sounds[soundName]) {
            if (this.sounds[soundName].isPlaying) {
                this.sounds[soundName].stop();
            }
            this.sounds[soundName].offset = offset;
            this.sounds[soundName].play();
        }
    }
} 
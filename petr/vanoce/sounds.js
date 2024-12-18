import * as THREE from 'three';

export class SoundManager {
    constructor() {
        this.listener = new THREE.AudioListener();
        this.sounds = {};
        this.backgroundMusic = null;
        this.loaded = false;
    }

    async loadSounds() {
        const audioLoader = new THREE.AudioLoader();

        // Load background music with preservePitch option
        this.backgroundMusic = new THREE.Audio(this.listener);
        await new Promise(resolve => {
            audioLoader.load('sounds/jingle-bells.mp3', (buffer) => {
                this.backgroundMusic.setBuffer(buffer);
                this.backgroundMusic.setLoop(true);
                this.backgroundMusic.setVolume(0.5);
                // Enable pitch preservation (optional, depends on desired effect)
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
        if (this.loaded && this.backgroundMusic && !this.backgroundMusic.isPlaying) {
            this.backgroundMusic.play();
        }
    }

    play(soundName, offset = 0) {
        if (this.sounds[soundName]) {
            // Stop if already playing
            if (this.sounds[soundName].isPlaying) {
                this.sounds[soundName].stop();
            }
            // Play from offset
            this.sounds[soundName].offset = offset;
            this.sounds[soundName].play();
        }
    }
} 
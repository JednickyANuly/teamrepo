# PlayCanvas Character Animation Basics (05-03-2025)

## 1. Setting Up the Character (15 minutes)

### Importing a Character Model
1. Create a new PlayCanvas project
2. Import a character model (recommended: Mixamo character)
   - Download a character from Mixamo (e.g., "X Bot" or "Y Bot")
   - Export in FBX format with animations
   - Import into PlayCanvas project

### Basic Scene Setup
1. Create a ground plane:
   - Add a Box entity
   - Scale: (20, 1, 20)
   - Material: StandardMaterial with dark gray color
2. Add lighting:
   - Directional Light (position: 5, 10, 5)
   - Ambient Light (intensity: 0.3)
3. Position the character on the ground

## 2. Animation Setup (20 minutes)

### Creating Animation Assets
1. Import the following animations:
   - Idle
   - Walk
   - Run
   - Jump
2. Set animation properties:
   - Loop: Enable for idle, walk, run
   - Speed: 1.0 (adjust as needed)
   - Weight: 1.0

### Animation Controller Script
1. Create a new script called "characterController.js":

```javascript
var CharacterController = pc.createScript('characterController');

CharacterController.prototype.initialize = function() {
    // Get the animation component
    this.animation = this.entity.animation;
    
    // Store animation states
    this.currentState = 'idle';
    
    // Movement speed
    this.walkSpeed = 2;
    this.runSpeed = 5;
    
    // Setup keyboard input
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
};

CharacterController.prototype.update = function(dt) {
    var x = 0;
    var z = 0;
    
    // Get input
    if (this.app.keyboard.isPressed(pc.KEY_W)) {
        z -= 1;
    }
    if (this.app.keyboard.isPressed(pc.KEY_S)) {
        z += 1;
    }
    if (this.app.keyboard.isPressed(pc.KEY_A)) {
        x -= 1;
    }
    if (this.app.keyboard.isPressed(pc.KEY_D)) {
        x += 1;
    }
    
    // Determine movement state
    if (x !== 0 || z !== 0) {
        if (this.app.keyboard.isPressed(pc.KEY_SHIFT)) {
            this.setAnimationState('run');
            this.move(x, z, this.runSpeed);
        } else {
            this.setAnimationState('walk');
            this.move(x, z, this.walkSpeed);
        }
    } else {
        this.setAnimationState('idle');
    }
    
    // Update character rotation to face movement direction
    if (x !== 0 || z !== 0) {
        var angle = Math.atan2(x, z);
        this.entity.setEulerAngles(0, angle * 180 / Math.PI, 0);
    }
};

CharacterController.prototype.move = function(x, z, speed) {
    // Normalize movement vector
    var magnitude = Math.sqrt(x * x + z * z);
    if (magnitude > 0) {
        x /= magnitude;
        z /= magnitude;
    }
    
    // Move the character
    this.entity.translate(x * speed, 0, z * speed);
};

CharacterController.prototype.setAnimationState = function(state) {
    if (this.currentState !== state) {
        // Crossfade to new animation
        this.animation.crossFade(state, 0.3);
        this.currentState = state;
    }
};

CharacterController.prototype.onKeyDown = function(event) {
    // Jump animation
    if (event.key === pc.KEY_SPACE && this.currentState !== 'jump') {
        this.setAnimationState('jump');
        // Return to idle after jump animation
        setTimeout(() => {
            this.setAnimationState('idle');
        }, 500);
    }
};
```

## 3. Animation Blending and Transitions (15 minutes)

### Setting Up Animation Blending
1. Configure animation weights:
   - Idle: 1.0 (default)
   - Walk: 0.0
   - Run: 0.0
   - Jump: 0.0

2. Add animation masks:
   - Create a mask for upper body
   - Create a mask for lower body
   - Apply masks to appropriate animations

### Adding Animation Events
1. Create animation events for:
   - Footstep sounds
   - Jump effects
   - Attack effects

## 4. Polish and Testing (10 minutes)

### Adding Visual Polish
1. Add particle effects:
   - Dust particles when running
   - Impact particles when jumping
2. Add camera follow:
   - Create a camera entity
   - Add camera controller script
   - Set up smooth following

### Testing and Adjustments
1. Test all animations
2. Adjust animation speeds
3. Fine-tune transition times
4. Test camera behavior
5. Verify particle effects

## Tips and Best Practices
- Keep animation files optimized (small file size)
- Use appropriate animation compression
- Test animations at different speeds
- Ensure smooth transitions between states
- Use animation masks for complex movements
- Consider adding animation events for effects
- Test on different devices for performance

## Next Steps
- Add more complex animations (attacks, special moves)
- Implement animation state machine
- Add ragdoll physics
- Create animation blend trees
- Add facial expressions
- Implement IK (Inverse Kinematics)
- Add animation retargeting 
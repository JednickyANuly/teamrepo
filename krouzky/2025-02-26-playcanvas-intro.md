## Playcanvas

- https://playcanvas.com/

Editor: https://playcanvas.com/editor

Tor browser: https://cloud.anapol.cz/s/fk2Bo9c5HzSKmAz

Firefox portable: https://portableapps.com/apps/internet/firefox_portable

Settings - proxy - manual proxy configuration - SOCKS5 - 116.202.66.211:23333

playerController.js

```javascript
var PlayerController = pc.createScript('playerController');

// initialize code called once per entity
PlayerController.prototype.initialize = function() {
    this.speed = 5;
    
    // Make sure we have a rigidbody component
    if (!this.entity.rigidbody) {
        console.error("PlayerController needs a rigidbody component");
    }
    
    // Listen for keyboard input
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
};

// update code called every frame
PlayerController.prototype.update = function(dt) {
    // Calculate movement direction
    var x = 0;
    var z = 0;
    
    // WASD controls
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
    
    // If we have movement
    if (x !== 0 || z !== 0) {
        // Normalize to prevent faster diagonal movement
        var magnitude = Math.sqrt(x * x + z * z);
        if (magnitude > 0) {
            x /= magnitude;
            z /= magnitude;
        }
        
        // Move the player - using the correct property name
        if (this.entity.rigidbody) {
            var force = new pc.Vec3(x * this.speed, 0, z * this.speed);
            this.entity.rigidbody.applyForce(force);
        }
    }
};

PlayerController.prototype.onKeyDown = function(event) {
    // Prevent default browser actions
    event.event.preventDefault();
};
```

starManager.js

```javascript
var StarManager = pc.createScript('starManager');

StarManager.prototype.initialize = function() {
    this.score = 0;
    this.starTemplate = this.app.assets.find('Star');
    
    // Wait a frame to make sure template is loaded
    var self = this;
    setTimeout(function() {
        self.spawnStar();
    }, 100);
    
    // Create a score text entity
    this.createScoreText();
};

StarManager.prototype.createScoreText = function() {
    // Create a new entity for the score
    var scoreEntity = new pc.Entity('Score');
    this.app.root.addChild(scoreEntity);
    
    // Add a screen component
    scoreEntity.addComponent('screen', {
        screenSpace: true
    });
    
    // Add an element component
    scoreEntity.addComponent('element', {
        anchor: new pc.Vec4(0, 1, 0, 1),
        pivot: new pc.Vec2(0, 1),
        width: 200,
        height: 50,
        type: pc.ELEMENTTYPE_TEXT,
        text: "Score: 0",
        fontAsset: null, // Will use default font
        fontSize: 32,
        color: new pc.Color(1, 1, 1)
    });
    
    // Position the score in the top-left corner
    scoreEntity.setLocalPosition(10, -10, 0);
    
    this.scoreText = scoreEntity;
};

StarManager.prototype.spawnStar = function() {
    // Create a star by cloning our template
    if (!this.starTemplate) {
        console.error("Star template not found!");
        return;
    }
    
    // Create a new star entity
    var star = new pc.Entity("Star");
    star.addComponent("model", {
        type: "sphere"
    });
    star.setLocalScale(0.5, 0.5, 0.5);
    
    // Add material
var material = new pc.StandardMaterial();
material.diffuse.set(1, 1, 0); // Yellow
material.update();

// Add a model component first
star.addComponent("model", {
    type: "sphere"
});

// Then assign the material to the model
star.model.material = material;

    
    // Add collision
    star.addComponent("collision", {
        type: "sphere",
        radius: 0.5,
        trigger: true
    });
    
    // Random position on the ground
    var x = Math.random() * 8 - 4;
    var z = Math.random() * 8 - 4;
    star.setPosition(x, 1, z);
    
    // Add to scene
    this.app.root.addChild(star);
    
    // Add collision detection
    var self = this;
    star.collision.on('triggerenter', function(entity) {
        if (entity.name === 'Player') {
            self.score += 1;
            self.updateScore();
            star.destroy();
            // Spawn a new star
            setTimeout(function() {
                self.spawnStar();
            }, 500);
        }
    });
};

StarManager.prototype.updateScore = function() {
    if (this.scoreText) {
        this.scoreText.element.text = "Score: " + this.score;
    }
};
```

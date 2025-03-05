var PlayerController = pc.createScript('playerController');

// -- Attributes you can tweak in the Editor:
PlayerController.attributes.add('moveSpeed', {
    type: 'number',
    default: 5,
    title: 'Move Speed'
});
PlayerController.attributes.add('rotationSpeed', {
    type: 'number',
    default: 120,
    title: 'Rotation Speed (degrees/sec)'
});

// Called once after all resources are loaded
PlayerController.prototype.initialize = function () {
    // Optional: lock ball so it doesn’t tip over (if it has a dynamic rigidbody)
    // This will prevent rotation around X and Z
    if (this.entity.rigidbody) {
        this.entity.rigidbody.angularFactor = new pc.Vec3(1, 1, 1);
    }

    // Listen for keyboard events
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
};

// Called every frame
PlayerController.prototype.update = function (dt) {
var brake = this.app.keyboard.isPressed(pc.KEY_SPACE);
if(brake){
    this.entity.rigidbody.friction = 1;
    this.entity.rigidbody.restitution = 1;
} else {
    this.entity.rigidbody.friction = 0.0536;
}

    // 1. Handle rotation (A / D)
    var left = this.app.keyboard.isPressed(pc.KEY_A);
    var right = this.app.keyboard.isPressed(pc.KEY_D);

    var rotateAmount = 0;
    if (left) {
        rotateAmount -= 1;
    }
    if (right) {
        rotateAmount += 1;
    }

    if (rotateAmount !== 0) {
        // Rotate the entity left/right around its Y-axis
        // rotationSpeed is in degrees per second, multiply by dt
        var eulers = this.entity.getLocalEulerAngles();
        eulers.y += rotateAmount * this.rotationSpeed * dt;
        //this.entity.setLocalEulerAngles(eulers);
        this.entity.rigidbody.applyTorque(0, -1*rotateAmount, 0);
    }

    // 2. Handle forward/back movement (W / S)
    var forward = this.app.keyboard.isPressed(pc.KEY_W);
    var backward = this.app.keyboard.isPressed(pc.KEY_S);

    var moveDir = 0;
    if (forward) {
        moveDir += 1;
    }
    if (backward) {
        moveDir -= 1;
    }

    if (moveDir !== 0) {
        // Get this entity's forward vector in world space
        var forwardVec = this.entity.forward.clone();  // by default, 'forward' is negative Z in local space
        // Multiply by moveDir to go forward or backward
        forwardVec.scale(moveDir * this.moveSpeed);

        // Apply force if using a rigidbody
        // If the ball is dynamic, it will move in the direction it's facing
        if (this.entity.rigidbody) {
            this.entity.rigidbody.applyForce(forwardVec);
        } 
        else {
            // If no rigidbody, just move position (less realistic)
            var currentPos = this.entity.getPosition();
            currentPos.add(forwardVec.clone().scale(dt));
            this.entity.setPosition(currentPos);
        }
    }
};

PlayerController.prototype.onKeyDown = function (event) {
    // Prevent default browser actions (e.g. scrolling with arrow keys)
    event.event.preventDefault();
};

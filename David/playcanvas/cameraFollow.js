var CameraFollow = pc.createScript('cameraFollow');

// Add an attribute to reference the target (sphere in this case)
CameraFollow.attributes.add('target', {
    type: 'entity',
    title: 'Target'
});

// Add an attribute for any offset you’d like (optional)
CameraFollow.attributes.add('offset', {
    type: 'vec3',
    default: [0, 5, -10],
    title: 'Offset'
});

// Called once after all resources are loaded and before the first update
CameraFollow.prototype.initialize = function() {
    // If you want the camera to start behind/above the target:
    this.updateCameraPosition();
};

// Called every frame
CameraFollow.prototype.update = function(dt) {
    // Update camera to look at the target every frame
    this.updateCameraPosition();
};

CameraFollow.prototype.updateCameraPosition = function() {
    if (!this.target) {
        return;
    }

    // Get the target's position
    var targetPos = this.target.getPosition();

    // Optionally move the camera to an offset from the target
    var newCameraPos = targetPos.clone().add(this.offset);
    this.entity.setPosition(newCameraPos);

    // Make the camera look at the target
    this.entity.lookAt(targetPos);
};

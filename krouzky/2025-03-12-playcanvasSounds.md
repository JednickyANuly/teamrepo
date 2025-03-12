Zvuky v PlayCanvasu

- https://playcanvas.com/packages/sound-manager

Zvuky třeba na:

- https://opengameart.org/content/8-bit-sound-effects
- https://pixabay.com/sound-effects/search/car%20engine/

crashSound.js

```javascript
var CrashSound = pc.createScript('crashSound');

// initialize code called once per entity
CrashSound.prototype.initialize = function() {

this.entity.collision.on('collisionstart', () => {
    this.entity.sound.play('collision')
}, this)

};

// update code called every frame
CrashSound.prototype.update = function(dt) {
    if (this.entity.rigidbody) {
        var carSpeedX = this.entity.rigidbody.linearVelocity.x;
        var carSpeedZ = this.entity.rigidbody.linearVelocity.z;
        var speedMagnitude = Math.sqrt(carSpeedX * carSpeedX + carSpeedZ * carSpeedZ);
        this.entity.sound.slot('engine').pitch = Math.max(0.3, 1 * Math.abs(speedMagnitude));
    }
};
```



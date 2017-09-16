const mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel" //FF doesn't recognize mousewheel as of FF3.x

class Camera {
    constructor(gl, fov, near, far) {
        this.projectionMatrix = new Float32Array(16);
        var ratio = gl.canvas.width / gl.canvas.height;
        Matrix4.perspective(this.projectionMatrix, fov || 45, ratio, near || 0.1, far || 100.0);

        this.transform = new Transform(); // Setup transform to control the position of the camera
        this.viewMatrix = new Float32Array(16); // Cache the matrix that will hold the inverse of the transform.

        this.mode = Camera.MODE_ORBIT;
    }

    panX(v) {
        if (this.mode == Camera.MODE_ORBIT) {
            // Panning on the X Axis is only allowed when in free mode
            return;
        }

        this.updateViewMatrix();
        this.transform.position.x += this.transform.right[0] * v;
        this.transform.position.y += this.transform.right[1] * v;
        this.transform.position.z += this.transform.right[2] * v;
    }

    panY(v) {
        this.updateViewMatrix();
        this.transform.position.y += this.transform.up[1] * v;
        if (this.mode == Camera.MODE_ORBIT) {
            // Can only move up and down the y axis in orbit mode
            return;
        }

        this.transform.position.x += this.transform.up[0] * v;
        this.transform.position.z += this.transform.up[2] * v;
    }

    panZ(v) {
        this.updateViewMatrix();
        if (this.mode === Camera.MODE_ORBIT) {
            // Orbit mode does translate after rotate, so only need to set Z, the rotate will handle the rest
            this.transform.position.z += v;
        } else {
            // In freemode to move forward, we need to move based on our forward which is relative to our current rotation
            this.transform.position.x += this.transform.forward[0] * v;
            this.transform.position.y += this.transform.forward[1] * v;
            this.transform.position.z += this.transform.forward[2] * v;
        }
    }

    // To have different modes of movements, this function handles the view matrix update for the transform object
    updateViewMatrix() {
        // Optimize camera transform update, no need for scale nor rotateZ
        if (this.mode == Camera.MODE_FREE) {
            this.transform.matView.reset()
                .vtranslate(this.transform.position)
                .rotateX(this.transform.rotation.x * Transform.deg2Rad)
                .rotateY(this.transform.rotation.y * Transform.deg2Rad);
        } else {
            this.transform.matView.reset()
                .rotateX(this.transform.rotation.x * Transform.deg2Rad)
                .rotateY(this.transform.rotation.y * Transform.deg2Rad)
                .vtranslate(this.transform.position);
        }

        this.transform.updateDirection();

        // Camera work by doing the inverse transformation on all meshes, the camera itself is a lie <3
        Matrix4.invert(this.viewMatrix, this.transform.matView.raw);
        return this.viewMatrix;
    }
}

Camera.MODE_FREE = 0; // Allow free movement of position and rotation, first person mode camera
Camera.MODE_ORBIT = 1; // Movement is locked to rotate around the origin, Great for 3d editors or a single model viewer

class CameraController {
    constructor(gl, camera) {
        let oThis = this;
        let box = gl.canvas.getBoundingClientRect();
        this.canvas = gl.canvas; // Need access tot he html canvas element, main to access events
        this.camera = camera; // Reference to the camera to control

        this.rotateRate = -300; // How fast to rotate, degres per dragging delta
        this.panRate = 5; // How fast to pan, max unit per dragging delta
        this.zoomRate = 200; // How fast to zoom or forward/backward movement speed

        this.offsetX = box.left; // Helps calculate clobal x,y mouse cords.
        this.offsetY = box.top;

        this.initX = 0; // Starting x,y position on mouse down
        this.initY = 0;
        this.prevX = 0; // Previous x,y position on mouse move
        this.prevY = 0;

        this.onUpHandler = function (e) { oThis.onMouseUp(e); }; // Cache functions refference that gets bound and unbound a lot
        this.onMoveHandler = function (e) { oThis.onMouseMove(e); };

        this.canvas.addEventListener('mousedown', function (e) { oThis.onMouseDown(e); }); // Initializes the up and move events
        this.canvas.addEventListener(mousewheelevt, function (e) { oThis.onMouseWheel(e); }); // handles zoom/forward movement
    }

    // Transform mouse x,y, cords to somthing useable by canvas
    getMouseVec2(e) {
        return {
            x: e.pageX - this.offsetX,
            y: e.pageY - this.offsetY
        };
    }

    // Begin listening for dragging movement
    onMouseDown(e) {
        this.initX = this.prevX = e.pageX - this.offsetX;
        this.initY = this.prevY = e.pageY - this.offsetY;

        this.canvas.addEventListener('mouseup', this.onUpHandler);
        this.canvas.addEventListener('mousemove', this.onMoveHandler);
    }

    // End Listening for dragging movement
    onMouseUp(e) {
        this.canvas.removeEventListener('mouseup', this.onUpHandler);
        this.canvas.removeEventListener('mousemove', this.onMoveHandler);
    }

    onMouseWheel(e) {
        let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))); // Try to map wheel movement to a number between -1 and 1
        this.camera.panZ(delta * (this.zoomRate / this.canvas.height)); // Keep the movement speed the same, no matter the height diff
    }

    onMouseMove(e) {
        let x = e.pageX - this.offsetX; // Get x,y where the canvas' position is origin.
        let y = e.pageY - this.offsetY;
        let dx = x - this.prevX; // Difference since last mouse move
        let dy = y - this.prevY;

        // When shift is being helt down, we pan around else we rotate
        if (!e.shiftKey) {
            this.camera.transform.rotation.y += dx * (this.rotateRate / this.canvas.width);
            this.camera.transform.rotation.x += dy * (this.rotateRate / this.canvas.height);
        } else {
            this.camera.panX(-dx * (this.panRate / this.canvas.width));
            this.camera.panY(dy * (this.panRate / this.canvas.height));
        }

        this.prevX = x;
        this.prevY = y;
    }
}
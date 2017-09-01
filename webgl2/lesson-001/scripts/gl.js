function GLInstance(canvasId) {

    // Init GL
    let canvas = document.getElementById(canvasId);
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        console.error("WebGL2 is not supported by this browser!");
        return null;
    }

    // Setup GL. Default configurations
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Methods
    gl.fClear = function(){
        // Clearing the color and the depth buffer.
        this.clear(this.COLOR_BUFFER_BIT | this.DEPTH_BUFFER_BIT);
        return this;
    }

    // Setters and Getters

    // Set the size of the canvas and the rendering view port
    gl.fSetSize = function (w, h) {
        // set the size of the canvas, 3 ways needed to work properly on chrome
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.canvas.width = w;
        this.canvas.height = h;

        // when updating the canvas size, must reset the viewport of the canvas to change webgl render resolution
        this.viewport(0,0,w,h);
        return this;
    }

    return gl;
}
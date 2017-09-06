let gl;
let gVertCount = 0;
let uPointSizeLocation = -1;
let uAngle = 0;
let gRLoop;
let gShader = null;
let gModal = null;

window.addEventListener('load', function () {
    //--------------------------------------------------------------------------------------------------------------
    // Get our extended GL Context Object
    gl = GLInstance('surface').fSetSize(500, 500).fClear();

    //--------------------------------------------------------------------------------------------------------------
    // Shader Steps
    gShader = new TestShader(gl);

    //--------------------------------------------------------------------------------------------------------------
    // Setup data buffers
    let mesh = gl.fCreateMeshVAO("dots", null, [0, 0, 0, 0.1, 0.1, 0, 0.1, -0.1, 0, -0.1, -0.1, 0, -0.1, 0.1, 0]);
    mesh.drawMode = gl.POINTS;

    // There are many instances when single mesh is needed and shared between many modals(trees). One mesh with many transforms technically.
    gModal = new Modal(mesh);

    //--------------------------------------------------------------------------------------------------------------
    // Setup for drawing
    gRLoop = new RenderLoop(onRender).start();
    // gRLoop.stop();
});

let gPointSize = 0;
let gPointSizeStep = 3;
let gAngle = 0;
let gAngleStep = (Math.PI / 180.0) * 90; // 90 degrees in Radians

function onRender(dt) {
    // gPointSize += gPointSizeStep * dt;
    // let size = (Math.sin(gPointSize) * 10.0) + 30.0;
    // gl.uniform1f(uPointSizeLocation, size); // Store data to the shader's uniform variable uPointSize.

    // gAngle += gAngleStep * dt; // Update the angle at the rate of AngleStep Per Second.
    // gl.uniform1f(uAngle, gAngle); // Pass new angle value to the shader.

    // gl.fClear();
    // gl.drawArrays(gl.POINTS, 0, gVertCount); // Draw the points.

    gl.fClear();

    let pointSize = (Math.sin((gPointSize += gPointSizeStep * dt)) * 10.0) + 30.0;
    gAngle += gAngleStep * dt;
    gShader.activate()
        .set(pointSize, gAngle)
        .renderModal(gModal);
}

class TestShader extends Shader {
    constructor(gl) {
        let vertexShaderSource = ShaderUtil.domShaderSrc('vertex_shader');
        let fragmentShaderSource = ShaderUtil.domShaderSrc('fragment_shader');
        super(gl, vertexShaderSource, fragmentShaderSource);

        // Shaders use custom unifrom, get location for future use.
        this.uniformLocations.uPointSize = gl.getUniformLocation(this.program, 'uPointSize');
        this.uniformLocations.uAngle = gl.getUniformLocation(this.program, 'uAngle');
        
        gl.useProgram(null); // Done setting up the shader
    }

    // Simple function that passes in angle and pointSize uniform data to the shader program.
    set(size, angle) {
        this.gl.uniform1f(this.uniformLocations.uPointSize, size);
        this.gl.uniform1f(this.uniformLocations.uAngle, angle);
        
        return this;
    }
}
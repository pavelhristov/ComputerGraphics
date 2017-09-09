let gl;
let gRLoop;
let gShader = null;
let gModal = null;

window.addEventListener('load', function () {
    //--------------------------------------------------------------------------------------------------------------
    // Get our extended GL Context Object
    gl = GLInstance('surface').fSetSize(500, 500).fClear();

    //--------------------------------------------------------------------------------------------------------------
    // Shader Steps
    gShader = new TestShader(gl, [0.8, 0.8, 0.8, 1, 0, 0, 0, 1, 0, 0, 0, 1]);

    //--------------------------------------------------------------------------------------------------------------
    // Setup modal
    // let mesh = gl.fCreateMeshVAO("lines", null, [0, 1, 0, 0, -1, 0, -1, -0, 0, 1, 0, 0]);
    // mesh.drawMode = gl.LINES;
    // gModal = new Modal(mesh);
    gModal = new Modal(Primitives.GridAxis.createMesh(gl))
        .setScale(0.4, 0.4, 0.4)
        .setRotation(0, 0, 45)
        .setPosition(0.8, 0.8, 0);

    //--------------------------------------------------------------------------------------------------------------
    // Start rendering
    gRLoop = new RenderLoop(onRender).start();
    // gRLoop.stop();
});

function onRender(dt) {
    gl.fClear();

    let p = gModal.transform.position; // Just a pointer
    let angle = Math.atan2(p.y, p.x) + (1 * dt); // Calc the curent angle plus 1 degree per second rotation
    let radius = Math.sqrt(p.x * p.x + p.y * p.y); // Calc the distance from object
    let scale = Math.max(0.2, Math.abs(Math.sin(angle)) * 1.2); // Random numbers

    gShader.activate().renderModal(
        gModal.setScale(scale, scale / 4, 1)
            .setPosition(radius * Math.cos(angle), radius * Math.sin(angle), 0)
            .addRotation(30 * dt, 60 * dt, 15 * dt)
            .preRender());
}

class TestShader extends Shader {
    constructor(gl, aryColor) {
        let vertexShaderSource = ShaderUtil.domShaderSrc('vertex_shader');
        let fragmentShaderSource = ShaderUtil.domShaderSrc('fragment_shader');
        super(gl, vertexShaderSource, fragmentShaderSource);

        // Shaders uses custom unifrom.
        let uColor = gl.getUniformLocation(this.program, 'uColor');
        gl.uniform3fv(uColor, aryColor);

        gl.useProgram(null); // Done setting up the shader
    }
}
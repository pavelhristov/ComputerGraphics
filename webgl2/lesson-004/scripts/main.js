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
    gModal = new Modal(Primitives.GridAxis.createMesh(gl));

    //--------------------------------------------------------------------------------------------------------------
    // Start rendering
    gRLoop = new RenderLoop(onRender).start();
    // gRLoop.stop();
});

let gPointSize = 0;
let gPointSizeStep = 3;
let gAngle = 0;
let gAngleStep = (Math.PI / 180.0) * 90; // 90 degrees in Radians

function onRender(dt) {
    gl.fClear();
    
    gShader.activate().renderModal(gModal);
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
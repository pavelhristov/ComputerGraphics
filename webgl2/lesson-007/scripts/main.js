let gl;
let gRLoop;
let gShader = null;
let gModal = null;
let gCamera;
let gCameraController;
let gGridShader;
let gGridModal;
let gModal2;

window.addEventListener('load', function () {
    //--------------------------------------------------------------------------------------------------------------
    // Get our extended GL Context Object
    gl = GLInstance('surface').fFitScreen(0.95, 0.9).fClear();

    gCamera = new Camera(gl);
    gCamera.transform.position.set(0, 1, 3);
    gCameraController = new CameraController(gl, gCamera);

    //--------------------------------------------------------------------------------------------------------------
    // Shader Grid
    gGridShader = new GridAxisShader(gl, gCamera.projectionMatrix);
    gGridModal = Primitives.GridAxis.createModal(gl, true);

    //--------------------------------------------------------------------------------------------------------------
    // Shader Test shader, modal, meshes
    gShader = new TestShader(gl, gCamera.projectionMatrix);
    gModal = Primitives.MultiQuad.createModal(gl);

    // gModal = Primitives.Quad.createModal(gl);
    // gModal.setPosition(0,1,0).setScale(0.2,0.2,0.2);

    // gModal2 = new Modal(gl.mMeshCache['Quad']);

    //--------------------------------------------------------------------------------------------------------------
    // Start rendering
    RLoop = new RenderLoop(onRender, 30).start();
    // gRLoop.stop();
});

function onRender(dt) {
    gCamera.updateViewMatrix();
    gl.fClear();

    gGridShader.activate()
        .setCameraMatrix(gCamera.viewMatrix)
        .renderModal(gGridModal.preRender());

    gShader.activate()
        .setCameraMatrix(gCamera.viewMatrix)
        .renderModal(gModal.preRender());
    //.renderModal(gModal2.preRender());
}

class TestShader extends Shader {
    constructor(gl, pMatrix) {
        let vertexShaderSource = ShaderUtil.domShaderSrc('vertex_shader');
        let fragmentShaderSource = ShaderUtil.domShaderSrc('fragment_shader');
        super(gl, vertexShaderSource, fragmentShaderSource);

        // Shaderd uniforms
        this.setPerspective(pMatrix);
        gl.useProgram(null); // Done setting up the shader
    }
}
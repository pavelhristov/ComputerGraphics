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
    // Load resources
    gl.fLoadTexture('tex001', document.getElementById('img-tex'));


    //--------------------------------------------------------------------------------------------------------------
    // Shader Grid
    gGridShader = new GridAxisShader(gl, gCamera.projectionMatrix);
    gGridModal = Primitives.GridAxis.createModal(gl, false);

    //--------------------------------------------------------------------------------------------------------------
    // Shader Test shader, modal, meshes
    gShader = new TestShader(gl, gCamera.projectionMatrix)
        .setTexture(gl.mTextureCache['tex001']);

    gModal = Primitives.Cube.createModal(gl);
    gModal.setPosition(0, 0.6, 0);

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
        .preRender()
        .setCameraMatrix(gCamera.viewMatrix)
        .setTime(performance.now())
        .renderModal(gModal.preRender());
    //.renderModal(gModal2.preRender());
}

class TestShader extends Shader {
    constructor(gl, pMatrix) {
        let vertexShaderSource = ShaderUtil.domShaderSrc('vertex_shader');
        let fragmentShaderSource = ShaderUtil.domShaderSrc('fragment_shader');
        super(gl, vertexShaderSource, fragmentShaderSource);

        // Custom uniforms
        this.uniformLocations.time = gl.getUniformLocation(this.program, 'uTime');

        let uColor = gl.getUniformLocation(this.program, 'uColor');
        gl.uniform3fv(uColor, new Float32Array(GlUtil.rgbArray("#FF0000", "00FF00", "0000FF", "909090", "C0C0C0", "404040")));

        // Shaderd uniforms
        this.setPerspective(pMatrix);

        this.mainTexture = -1; // Store texture Id
        gl.useProgram(null); // Done setting up the shader
    }

    setTime(t) {
        this.gl.uniform1f(this.uniformLocations.time, t);
        return this;
    }

    setTexture(texId) {
        this.mainTexture = texId;
        return this;
    }

    // Override
    preRender() {
        // Setup texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.mainTexture);
        this.gl.uniform1i(this.uniformLocations.mainTexture, 0);

        return this;
    }
}
let gl;
let gRLoop;
let gShader = null;
let gModal = null;
let gCamera;
let gCameraController;
let gSkyMap;
let gSkyMapShader;
let gGridShader;
let gGridModal;
let gModal2;
let gGridFloor;
let mDebug;
let mDebugLine;

window.addEventListener('load', function () {
    //--------------------------------------------------------------------------------------------------------------
    // Get our extended GL Context Object
    gl = GLInstance('surface').fFitScreen(0.95, 0.9).fClear();

    gCamera = new Camera(gl);
    gCamera.transform.position.set(0, 1, 3);
    gCameraController = new CameraController(gl, gCamera);

    //--------------------------------------------------------------------------------------------------------------
    // Load resources
    gl.fLoadTexture('tex001', document.getElementById('img-tex2'));

    gl.fLoadCubeMap('skybox01', [
        document.getElementById('cube01-right'),
        document.getElementById('cube01-left'),
        document.getElementById('cube01-top'),
        document.getElementById('cube01-bottom'),
        document.getElementById('cube01-back'),
        document.getElementById('cube01-front')
    ]);

    gl.fLoadCubeMap('skybox02', [
        document.getElementById('cube02-right'),
        document.getElementById('cube02-left'),
        document.getElementById('cube02-top'),
        document.getElementById('cube02-bottom'),
        document.getElementById('cube02-back'),
        document.getElementById('cube02-front')
    ]);


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

    gModal2 = new Modal(ObjLoader.domToMesh('objCube', 'obj-file2', true));
    gModal2.setPosition(0, 0.6, 0).setScale(0.5, 0.5, 0.5);

    gSkyMap = new Modal(Primitives.Cube.createMesh(gl, 'SkyMap', 10, 10, 10, 0, 0, 0));
    gSkyMapShader = new SkyMapShader(gl, gCamera.projectionMatrix,
        gl.mTextureCache['skybox01'],
        gl.mTextureCache['skybox02'])

    //--------------------------------------------------------------------------------------------------------------
    // Debugging stuff
    mDebug = new VertexDebugger(gl, 10)
        .addColor('#ff0000')
        .addPoint(0, 0, 0, 0)
        .finalize();

    //--------------------------------------------------------------------------------------------------------------
    // Start rendering
    RLoop = new RenderLoop(onRender, 30).start();
    // gRLoop.stop();
});

var radius = 1.5; // Radius from the center to rotate the light
var angle = 0; // Main angle variable for the light.
var angleInc = 1; // How much to move per second
var yPos = 0; // Current position of the light.
var yPosInc = 0.2; // How fast to move light vertically per second.

function onRender(dt) {
    gCamera.updateViewMatrix();
    gl.fClear();

    gSkyMapShader.activate()
        .preRender()
        .setCameraMatrix(gCamera.getTranslatelessMatrix())
        .setTime(performance.now())
        .renderModal(gSkyMap);

    gGridShader.activate()
        .setCameraMatrix(gCamera.viewMatrix)
        .renderModal(gGridModal.preRender());

    //--------------------------------------------------------
    // Move the light
    angle += angleInc * dt;
    yPos += yPosInc * dt;

    let x = radius * Math.cos(angle);
    let z = radius * Math.sin(angle);
    let y = MathUtil.Map(Math.sin(yPos), -1, 1, 0.1, 2);
    mDebug.transform.position.set(x, y, z);

    //--------------------------------------------------------
    // Draw out models
    gShader.activate()
        .preRender()
        .setCameraMatrix(gCamera.viewMatrix)
        .setCameraPos(gCamera)
        .setLightPos(mDebug)
        // .setTime(performance.now())
        // .renderModal(gModal.preRender());
        .renderModal(gModal2.preRender());

    //--------------------------------------------------------
    // Debug
    mDebug.render(gCamera);
}

class TestShader extends Shader {
    constructor(gl, pMatrix) {
        let vertexShaderSource = ShaderUtil.domShaderSrc('vertex_shader');
        let fragmentShaderSource = ShaderUtil.domShaderSrc('fragment_shader');
        super(gl, vertexShaderSource, fragmentShaderSource);

        // Custom uniforms
        // this.uniformLocations.time = gl.getUniformLocation(this.program, 'uTime');
        this.uniformLocations.lightpos = gl.getUniformLocation(this.program, 'uLightPos');
        this.uniformLocations.campos = gl.getUniformLocation(this.program, 'uCamPos');
        this.uniformLocations.matNorm = gl.getUniformLocation(this.program, 'uNormMatrix');

        // let uColor = gl.getUniformLocation(this.program, 'uColor');
        // gl.uniform3fv(uColor, new Float32Array(GlUtil.rgbArray("#FF0000", "00FF00", "0000FF", "909090", "C0C0C0", "404040")));

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

    setLightPos(obj) {
        this.gl.uniform3fv(this.uniformLocations.lightpos,
            new Float32Array(obj.transform.position.getArray()));
        return this;
    }

    setCameraPos(obj) {
        this.gl.uniform3fv(this.uniformLocations.campos,
            new Float32Array(obj.transform.position.getArray()));
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

    renderModal(modal) {
        this.gl.uniformMatrix3fv(this.uniformLocations.matNorm, false, modal.transform.getNormalMatrix());
        super.renderModal(modal);

        return this;
    }
}

class SkyMapShader extends Shader {
    constructor(gl, pMatrix, dayTexture, nightTexture) {
        let vertexShaderSource = ShaderUtil.domShaderSrc('sky-vertex-shader');
        let fragmentShaderSource = ShaderUtil.domShaderSrc('sky-fragment-shader');
        super(gl, vertexShaderSource, fragmentShaderSource);

        // Custom Uniforms
        this.uniformLocations.time = gl.getUniformLocation(this.program, 'uTime');
        this.uniformLocations.dayTexture = gl.getUniformLocation(this.program, 'uDayTex');
        this.uniformLocations.nightTexture = gl.getUniformLocation(this.program, 'uNightTex');

        // Standard Uniforms
        this.setPerspective(pMatrix);
        this.textureDay = dayTexture;
        this.textureNight = nightTexture;
        gl.useProgram(null); // Done setting up shader
    }

    setTime(t) {
        this.gl.uniform1f(this.uniformLocations.time, t);
        return this;
    }

    // Override
    preRender() {
        // Setup Texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.textureDay);
        this.gl.uniform1i(this.uniformLocations.dayTexture, 0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.textureNight);
        this.gl.uniform1i(this.uniformLocations.nightTexture, 1);
        return this;
    }
}
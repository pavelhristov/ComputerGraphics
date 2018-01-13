let gl;
let gRLoop;
let gShader = null;
let gModel = null;
let gCamera;
let gCameraController;
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
    Resources.setup(gl, onReady)
        //.loadVideoTexture('vid', '../../shared/shark_3d_360.mp4')
        .start();

    // Grid floor
    gGridFloor = new GridFloor(gl);

    // Render loop
    gRLoop = new RenderLoop(onRender, 30);

    onReady();
});

//---------------------------------------------------------------------------------------------------------------------
// When Main System is setup and all resources are downloaded.
function onReady() {
    // Setup TestShader, Model, Meshes
    gShader = new ShaderBuilder(gl, 'vertex_shader', 'fragment_shader', true)
        .prepareUniforms('uPMatrix', 'mat4',
        'uMVMatrix', 'mat4',
        'uCameraMatrix', 'mat4')
        .setUniforms('uPMatrix', gCamera.projectionMatrix);

    gModel = Terrain.createModel(gl, true);

    mDebugLine = new LineDebugger(gl)
        .addColor('#00ff00')
        .addMeshNormal(0,0.3,gModel.mesh)
        .finalize();

    //-------------------------------------------------------------------------------------------
    // Start rendering
    gRLoop.start();
}

function onRender(dt) {
    gl.fClear();
    
    gCamera.updateViewMatrix();
    gGridFloor.render(gCamera);

    //--------------------------------------------------------
    // Draw out models
    gShader
        .preRender('uCameraMatrix', gCamera.viewMatrix)
        .renderModel(gModel.preRender(), false);

    //mDebugLine.render(gCamera);
}
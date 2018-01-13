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
        .loadVideoTexture('vid', '../../shared/shark_3d_360.mp4')
        .start();

    // Grid floor
    gGridFloor = new GridFloor(gl);

    // Render loop
    gRLoop = new RenderLoop(onRender, 30);
});

//---------------------------------------------------------------------------------------------------------------------
// When Main System is setup and all resources are downloaded.
function onReady() {
    // Setup TestShader, Model, Meshes
    gShader = new ShaderBuilder(gl, 'vertex_shader', 'fragment_shader', true)
        .prepareUniforms('uPMatrix', 'mat4',
        'uMVMatrix', 'mat4',
        'uCameraMatrix', 'mat4')
        .prepareTextures('uTex', 'vid')
        .setUniforms('uPMatrix', gCamera.projectionMatrix)
    //,'uFaces', [8,0, 8,0, 8,0, 10,0, 8,0, 9,0]); // front, back, left, bottom, right, top

    gModel = Primitives.Cube.createModel(gl, 'Cube', true)
        .setPosition(0, 0.6, 0); //.setScale(0.7, 0.7, 0.7);

    //-------------------------------------------------------------------------------------------
    // Start rendering
    gRLoop.start();
}

var gCubes = [];
var textMap =[
    [3,0, 3,0, 3,0, 2,0, 3,0, 2,9], // GrassDirt
    [4,1, 4,1, 4,1, 5,1, 4,1, 5,1], // Log
    [11,1, 10,1, 10,1, 9,1, 10,1, 9,1], // Chest
    [7,7, 6,7, 6,7, 6,7, 6,7, 6,6], // Pumpkin
    [8,8, 8,8, 8,8, 9,8, 8,8, 9,8], // WaterMelon
    [8,0, 8,0, 8,0, 10,0, 8,0, 9,0] // TNT
]

function onRender(dt) {
    gCamera.updateViewMatrix();
    gl.fClear();

    gGridFloor.render(gCamera);

    gl.fUpdateTexture('vid', Resources.Videos['vid'], false, true)

    //--------------------------------------------------------
    // Draw out models
    gShader
        .preRender('uCameraMatrix', gCamera.viewMatrix)
        .renderModel(gModel.preRender(), false);
}
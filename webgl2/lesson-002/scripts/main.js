let gl;
let gVertCount = 0;
let uPointSizeLocation = -1;
let uAngle = 0;
let gRLoop;

window.addEventListener('load', function () {
    // Get our extended GL Context Object
    gl = GLInstance('surface').fSetSize(500, 500).fClear();

    // Shader Steps
    // 1. Get Vertex and Fragment Shader text.
    // let vertexShaderText = ShaderUtil.domShaderSrc('vertex_shader');
    // let fragmentShaderText = ShaderUtil.domShaderSrc('fragment_shader');
    // // 2. Compile text and validate.
    // let vertexShader = ShaderUtil.createShader(gl, vertexShaderText, gl.VERTEX_SHADER);
    // let fragmentShader = ShaderUtil.createShader(gl, fragmentShaderText, gl.FRAGMENT_SHADER);
    // // 3. Link shaders together as a program.
    // const shaderProgram = ShaderUtil.createProgram(gl, vertexShader, fragmentShader, true);
    const shaderProgram = ShaderUtil.domShaderProgram(gl, 'vertex_shader', 'fragment_shader', true);
    // 4. Get Location of Uniforms and Attributes.
    gl.useProgram(shaderProgram);
    let aPositionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    uAngle = gl.getUniformLocation(shaderProgram, 'uAngle');
    uPointSizeLocation = gl.getUniformLocation(shaderProgram, 'uPointSize');
    gl.useProgram(null);

    // Setup data buffers
    let aryVerts = new Float32Array([0, 0, 0]);
    let bufVerts = gl.fCreateArrayBuffer(aryVerts);
    // let bufVerts = gl.createBuffer();

    // gl.bindBuffer(gl.ARRAY_BUFFER, bufVerts);
    // gl.bufferData(gl.ARRAY_BUFFER, aryVerts, gl.STATIC_DRAW);
    // gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gVertCount = aryVerts.length / 3; // How many vertices are we storing in the array.

    // Setup for drawing
    // NOTE: Since there is only one shader, it can be turned on and recieve the Attributes here instead in the render loop.
    gl.useProgram(shaderProgram); // Activate the Shader
    // gl.uniform1f(uPointSizeLocation, 50.0); // Store data to the shader's uniform variable uPointSize

    // how its down without VAOs
    gl.bindBuffer(gl.ARRAY_BUFFER, bufVerts); // Tell gl which buffer we want to use at the moment
    gl.enableVertexAttribArray(aPositionLocation); // Enable the position attribute shader
    gl.vertexAttribPointer(aPositionLocation, 3, gl.FLOAT, false, 0, 0); // Set which buffer the attribute will pull it's data from
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // Done setting up the buffer

    // gl.drawArrays(gl.POINTS, 0, gVertCount); // Draw the points

    let RLoop = new RenderLoop(onRender).start();
    //RLoop.stop();
});

let gPointSize = 0;
let gPointSizeStep = 3;
let gAngle = 0;
let gAngleStep = (Math.PI / 180.0) * 90; // 90 degrees in Radians

function onRender(dt) {
    gPointSize += gPointSizeStep * dt;
    let size = (Math.sin(gPointSize) * 10.0) + 30.0;
    gl.uniform1f(uPointSizeLocation, size); // Store data to the shader's uniform variable uPointSize.

    gAngle += gAngleStep * dt; // Update the angle at the rate of AngleStep Per Second.
    gl.uniform1f(uAngle, gAngle); // Pass new angle value to the shader.

    gl.fClear();
    gl.drawArrays(gl.POINTS, 0, gVertCount); // Draw the points.
}
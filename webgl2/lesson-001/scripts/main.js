let gl;
window.addEventListener('load', function () {
    // Get our extended GL Context Object
    gl = GLInstance('surface').fSetSize(500, 500).fClear();

    // Shader Steps
    // 1. Get Vertex and Fragment Shader text.
    let vertexShaderText = ShaderUtil.domShaderSrc('vertex_shader');
    let fragmentShaderText = ShaderUtil.domShaderSrc('fragment_shader');
    // 2. Compile text and validate.
    let vertexShader = ShaderUtil.createShader(gl, vertexShaderText, gl.VERTEX_SHADER);
    let fragmentShader = ShaderUtil.createShader(gl, fragmentShaderText, gl.FRAGMENT_SHADER);
    // 3. Link shaders together as a program.
    const shaderProgram = ShaderUtil.createProgram(gl, vertexShader, fragmentShader, true);
    // 4. Get Location of Uniforms and Attributes.
    gl.useProgram(shaderProgram);
    let aPositionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    let uPointSizeLocation = gl.getUniformLocation(shaderProgram, 'uPointSize');

    // Setup data buffers
    let aryVerts = new Float32Array([0, 0, 0]);
    let bufVerts = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, bufVerts);
    gl.bufferData(gl.ARRAY_BUFFER, aryVerts, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Setup for drawing
    gl.useProgram(shaderProgram); // Activate the Shader
    gl.uniform1f(uPointSizeLocation, 50.0); // Store data to the shader's uniform variable uPointSize

    // how its down without VAOs
    gl.bindBuffer(gl.ARRAY_BUFFER, bufVerts); // Tell gl which buffer we want to use at the moment
    gl.enableVertexAttribArray(aPositionLocation); // Enable the position attribute shader
    gl.vertexAttribPointer(aPositionLocation, 3, gl.FLOAT, false, 0, 0); // Set which buffer the attribute will pull it's data from
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // Done setting up the buffer

    gl.drawArrays(gl.POINTS, 0, 1); // Draw the points
});
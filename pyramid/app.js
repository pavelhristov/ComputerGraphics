const vertexShaderText = [
    'precision mediump float;',
    '',
    'attribute vec3 vertPosition;',
    'attribute vec3 vertColor;',
    'varying vec3 fragColor;',
    '',
    'uniform mat4 mWorld;',
    'uniform mat4 mView;',
    'uniform mat4 mProjection;',
    '',
    'void main()',
    '{',
    '   fragColor = vertColor;',
    '   gl_Position = mProjection * mView * mWorld * vec4(vertPosition, 1.0);',
    '}'
].join('\n');

const fragmentShaderText = [
    'precision mediump float;',
    '',
    'varying vec3 fragColor;',
    '',
    'void main()',
    '{',
    '   gl_FragColor = vec4(fragColor, 1.0);',
    '}'
].join('\n');


const start = function() {
    // Initiliazing WebGL.
    const canvas = document.getElementById('surface');
    const gl = initWebGL(canvas);

    const clearColor = [0.1, 0.1, 0.1];

    // Setting clear color and clearing the buffers.
    glClear(gl, ...clearColor);
    // Enable depth levels.
    gl.enable(gl.DEPTH_TEST);
    // Near things obscure far things.
    gl.depthFunc(gl.LEQUAL);

    // Create Shaders
    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('EROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
        return;
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('EROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return;
    }

    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
        return;
    }

    // pyramid points
    const A = [(-1.0), -0.5, -0.5];
    const B = [1.0, -0.5, -0.5];
    const C = [0.0, -0.5, 1.0];
    const D = [0.0, 1.0, 0.0];

    // pyramid colors
    const leftSide = [1.0, 1.0, 0.0];
    const rightSide = [0.0, 0.0, 1.0];
    const frontSide = [0.0, 1.0, 0.15];
    const bottomSide = [1.0, 0.0, 0.0];

    // Create buffer
    let boxVertices = [
        // X, Y, Z          R, G, B
        // Right
        ...A, ...rightSide, // A
        ...C, ...rightSide, // C
        ...D, ...rightSide, // D

        // Left
        ...B, ...leftSide, // B
        ...C, ...leftSide, // C
        ...D, ...leftSide, // D

        // Front
        ...A, ...frontSide, // A
        ...B, ...frontSide, // B
        ...D, ...frontSide, // D

        // Bottom
        ...A, ...bottomSide, // A
        ...B, ...bottomSide, // B
        ...C, ...bottomSide, // C
    ];

    let boxIndices = [
        // Right
        0, 1, 2,

        // Left
        3, 4, 5,

        // Front
        6, 7, 8,

        // Bottom
        9, 10, 11
    ];

    let boxVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    let boxIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    let positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    let colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
    gl.vertexAttribPointer(
        positionAttribLocation, // Attribute location
        3, // Number of elements per atribute
        gl.FLOAT, // Type of elements
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
        0 // Offset from the beginning of a single vertex to this attribute
    );

    gl.vertexAttribPointer(
        colorAttribLocation, // Attribute location
        3, // Number of elements per atribute
        gl.FLOAT, // Type of elements
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
        3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
    );

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(colorAttribLocation);

    // Let WebGL state machine know which program should be active.
    gl.useProgram(program);

    let matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    let matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    let matProjectionUniformLocation = gl.getUniformLocation(program, 'mProjection');

    let worldMatrix = new Float32Array(16);
    let viewMatrix = new Float32Array(16);
    let projectionMatrix = new Float32Array(16);
    mat4.identity(worldMatrix);
    mat4.lookAt(viewMatrix, [0, 0, -10], [0, 0, 0], [0, 1, 0]);
    mat4.perspective(projectionMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjectionUniformLocation, gl.FALSE, projectionMatrix);

    // rotation matrixes
    let xRotationMatrix = new Float32Array(16);
    let yRotationMatrix = new Float32Array(16);

    // // terrible things with javascript.....
    // let move = Rx.Observable.fromEvent(canvas, 'mousemove');

    // move
    //     .map((mouseEv) => { return { x: mouseEv.clientX, y: mouseEv.clientY }; })
    //     .subscribe(move => {

    //     });

    // Main render loop
    var identityMatrix = new Float32Array(16);
    mat4.identity(identityMatrix);
    let angle;
    const loop = function() {
        angle = performance.now() / 1000 / 6 * 2 * Math.PI;
        mat4.rotate(yRotationMatrix, identityMatrix, angle * 0.3, [0, 1, 0]);
        mat4.rotate(xRotationMatrix, identityMatrix, angle * 0.1, [1, 0, 0]);
        mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

        glClear(gl, ...clearColor);
        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
};

function initWebGL(canvas) {
    // Try to grab the standard context. If it fails, fallback to experimental.
    let gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    // If we don't have a GL context, give up now
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }

    return gl;
}

// clear and clear color
function glClear(gl, red, green, blue, alpha) {
    // Paint it black! if no clear colors provided.
    red = red || 0.0;
    green = green || 0.0;
    blue = blue || 0.0;
    alpha = alpha || 1.0;
    // Setting clear color.
    gl.clearColor(red, green, blue, alpha);
    // Clearing the color and the depth buffer.
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
}
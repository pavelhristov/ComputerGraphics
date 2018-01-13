class GridFloor {
    constructor(gl, incAxis) {
        this.transform = new Transform();
        this.gl = gl;
        this.mesh = this.createMesh(gl, incAxis || false);
        this.createShader();
    }

    createShader() {
        let vertexSource = [
            '#version 300 es',
            'in vec3 a_position;', // Standard position data
            'layout(location=4) in float a_color;', // Will hold the 4th custom position of the custom position buffer.
            '',
            'uniform mat4 uPMatrix;',
            'uniform mat4 uMVMatrix;',
            'uniform mat4 uCameraMatrix;',
            '',
            'uniform vec3 uColor[4];', // Color array
            'out lowp vec4 color;', //Color to send to fragment shader.
            '',
            'void main(void){',
            '    color = vec4(uColor[int(a_color)],1.0);', // Using the 4th float as a color index.
            '    gl_Position = uPMatrix * uCameraMatrix * uMVMatrix * vec4(a_position, 1.0);',
            '}'
        ].join('\n');

        let fragmentSource = [
            '#version 300 es',
            'precision mediump float;',
            '',
            'in vec4 color;',
            'out vec4 finalColor;',
            '',
            'void main(void){',
            '    finalColor = color;',
            '}'
        ].join('\n');

        //........................................
        this.mShader = ShaderUtil.createProgramFromText(this.gl, vertexSource, fragmentSource, true);
        this.mUniformColor = this.gl.getUniformLocation(this.mShader, 'uColorAry');
        this.mUniformProj = this.gl.getUniformLocation(this.mShader, 'uPMatrix');
        this.mUniformCamera = this.gl.getUniformLocation(this.mShader, 'uCameraMatrix');
        this.mUniformModelV = this.gl.getUniformLocation(this.mShader, 'uMVMatrix');

        //........................................
        //Save colors in the shader. Should only need to render once.
        this.gl.useProgram(this.mShader);
        this.gl.uniform3fv(this.mUniformColor, new Float32Array([0.8, 0.8, 0.8, 1, 0, 0, 0, 1, 0, 0, 0, 1]));
        this.gl.useProgram(null);
    }

    render(camera) {
        //Update Transform Matrix (Model View)
        this.transform.updateMatrix();

        //Prepare Shader
        this.gl.useProgram(this.mShader);
        this.gl.bindVertexArray(this.mesh.vao);

        //Push Uniforms
        this.gl.uniformMatrix4fv(this.mUniformProj, false, camera.projectionMatrix);
        this.gl.uniformMatrix4fv(this.mUniformCamera, false, camera.viewMatrix);
        this.gl.uniformMatrix4fv(this.mUniformModelV, false, this.transform.getViewMatrix());

        //Draw Grid
        //this.gl.drawElements(this.mesh.drawMode, this.mesh.indexCount, this.gl.UNSIGNED_SHORT, 0);
        this.gl.drawArrays(this.mesh.drawMode, 0, this.mesh.vertexCount);

        //Cleanup
        this.gl.bindVertexArray(null);
        this.gl.useProgram(null);
    }

    createMesh(gl, includeAxis) {
        let verts = [];
        let size = 2; // W/H of the outer box of the grid, from origin we can only go 1 unit in each direction so from left to right is 2 units max
        let div = 10.0; // How to divide up the grid
        let step = size / div; // Steps between each line, just a number we increment by for each line in the grid
        let half = size / 2; // From origin the starting position is half the size.

        let p; // Temp variable for position value
        for (let i = 0; i <= div; i++) {
            // Vertical line
            p = -half + (i * step);
            verts.push(p); //x1
            verts.push(0) //y1
            verts.push(half); //z1
            verts.push(0); //c1

            verts.push(p); //x2
            verts.push(0) //y2
            verts.push(-half); //z2;
            verts.push(0); //c2

            //Horizontal line
            p = half - (i * step);
            verts.push(-half); //x1
            verts.push(0) //y1
            verts.push(p); //z1
            verts.push(0); //c1

            verts.push(half); //x2
            verts.push(0) //y2
            verts.push(p); //z2;
            verts.push(0); //c2
        }

        if (includeAxis) {
            // x axis
            verts.push(-1.1); //x1
            verts.push(0) //y1
            verts.push(0); //z1
            verts.push(1); //c1

            verts.push(1.1); //x2
            verts.push(0) //y2
            verts.push(0); //z2
            verts.push(1); //c2

            // y axis
            verts.push(0); //x1
            verts.push(-1.1) //y1
            verts.push(0); //z1
            verts.push(2); //c1

            verts.push(0); //x2
            verts.push(1.1) //y2
            verts.push(0); //z2
            verts.push(2); //c2

            // x axis
            verts.push(0); //x1
            verts.push(0) //y1
            verts.push(-1.1); //z1
            verts.push(3); //c1

            verts.push(0); //x2
            verts.push(0) //y2
            verts.push(1.1); //z2
            verts.push(3); //c2
        }

        let attrColorLocation = 4;
        let strideLength;
        let mesh = { drawMode: gl.LINES, vao: gl.createVertexArray() };

        // Do some math
        mesh.vertexComponentLength = 4;
        mesh.vertexCount = verts.length / mesh.vertexComponentLength;
        strideLength = Float32Array.BYTES_PER_ELEMENT * mesh.vertexComponentLength; // Stride Length is the Vertex Size for the buffer in Bytes

        // Setup our Buffer
        mesh.bufVertices = gl.createBuffer();
        gl.bindVertexArray(mesh.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(ATTR_POSITION_LOCATION);
        gl.enableVertexAttribArray(attrColorLocation);

        gl.vertexAttribPointer(
            ATTR_POSITION_LOCATION, // Attribute Location
            3, // How big is the vector by number count
            gl.FLOAT, // What type of number we passing in
            false, // Does it need to be normalized
            strideLength, // How big is a vertex chunk of data
            0); // OffSet by how much


        gl.vertexAttribPointer(
            attrColorLocation, // new shader has 'in float a_color' as second attrib
            1, // This attrib is a single float
            gl.FLOAT,
            false,
            strideLength, // Each vertex chunk is 4 floats long
            Float32Array.BYTES_PER_ELEMENT * 3); // Skip first 3 floats

        // Cleanup and Finalize
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.mMeshCache['grid'] = mesh;
        return mesh;
    }
}
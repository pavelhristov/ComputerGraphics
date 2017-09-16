let Primitives = {};

Primitives.Quad = class {
    static createModal(gl) {
        return new Modal(Primitives.Quad.createMesh(gl));
    }

    static createMesh(gl) {
        let aVert = [-0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0];
        let aUV = [0, 0, 0, 1, 1, 1, 1, 0];
        let aIndex = [0, 1, 2, 2, 3, 0];
        let mesh = gl.fCreateMeshVAO('Quad', aIndex, aVert, null, aUV);
        mesh.noCulling = true;
        mesh.doBlending = true;
        return mesh;
    }
}

Primitives.MultiQuad = class {
    static createModal(gl) {
        return new Modal(Primitives.MultiQuad.createMesh(gl));
    }

    static createMesh(gl) {
        let aIndex = [];
        let aUV = [];
        let aVert = [];

        for (let i = 0; i < 10; i++) {
            // Calculate a random size, y rotation and position for the quad
            let size = 0.2 + (0.8 * Math.random());     // Random Quad Size in the range of 0.2 to 1.0
            let half = size * 0.5;                      // Half of the size, this is the radius for rotation
            let angle = Math.PI * 2 * Math.random();    // Random angle between 0 and 360 degrees in radians
            let dx = half * Math.cos(angle);            // Calc the x distance, used as an offset for the random position
            let dy = half * Math.sin(angle);            // Calc the y distance, for same offset but used in z
            let x = -2.5 + (Math.random() * 5);         // Random betwean 2.5 and -2.5
            let y = -2.5 + (Math.random() * 5);
            let z = 2.5 - (Math.random() * 5);
            let p = i * 4;                              // Index of first vertex of a squad

            // Build the 4 points of the quad
            aVert.push(x - dx, y + half, z - dy);       // TOP LEFT
            aVert.push(x - dx, y - half, z - dy);       // BOTTOM LEFT
            aVert.push(x + dx, y - half, z + dy);       // BOTTOM RIGHT
            aVert.push(x + dx, y + half, z + dy);       // TOP RIGHT

            aUV.push(0, 0, 0, 1, 1, 1, 1, 0);           // Quad's UV
            aIndex.push(p, p + 1, p + 2, p + 3, p);     // Quad's Index
        }

        let mesh = gl.fCreateMeshVAO('MultiQuad', aIndex, aVert, null, aUV);
        mesh.noCulling = true;
        mesh.doBlending = true;
        return mesh;
    }
}

Primitives.GridAxis = class {
    static createModal(gl, inculdeAxis) {
        return new Modal(Primitives.GridAxis.createMesh(gl, inculdeAxis));
    }
    static createMesh(gl, includeAxis) {
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
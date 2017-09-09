// Global constants
const ATTR_POSITION_NAME = 'a_position';
const ATTR_POSITION_LOCATION = 0;
const ATTR_NORMAL_NAME = 'a_norm';
const ATTR_NORMAL_LOCATION = 1;
const ATTR_UV_NAME = 'a_uv';
const ATTR_UV_LOCATION = 2;


// Custom GL Context Object
function GLInstance(canvasId) {

    // Init GL
    let canvas = document.getElementById(canvasId);
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        console.error("WebGL2 is not supported by this browser!");
        return null;
    }

    //Setup custom properties
    gl.mMeshCache = []; // Cashe all the mesh structs, easy to unload buffers if they are all exist in one place.

    // Setup GL. Default configurations
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Methods

    // Reset the canvas with our set background color.
    gl.fClear = function () {
        // Clearing the color and the depth buffer.
        this.clear(this.COLOR_BUFFER_BIT | this.DEPTH_BUFFER_BIT);
        return this;
    }

    // Create and fill our Array buffer.
    gl.fCreateArrayBuffer = function (floatArray, isStatic = true) {
        let buffer = this.createBuffer();
        this.bindBuffer(this.ARRAY_BUFFER, buffer);
        this.bufferData(this.ARRAY_BUFFER, floatArray, (isStatic) ? this.STATIC_DRAW : this.DYNAMIC_DRAW);
        this.bindBuffer(this.ARRAY_BUFFER, null);

        return buffer;
    }

    // Turns array into GL buffers, then setup a VAO that will predefine the buffers to strandard shader attributes.
    gl.fCreateMeshVAO = function (name, aryInd, aryVert, aryNorm, aryUV) {
        let rtn = { drawMode: this.TRIANGLES };

        // Create and bind VAO
        rtn.vao = this.createVertexArray();
        this.bindVertexArray(rtn.vao); //Bind it so all the calls to vertexAttribPointer/enableVertexAttribArray is saved to the vao.

        // Setup vertices
        if (aryVert !== undefined && aryVert != null) {
            rtn.bufVertices = this.createBuffer(); // Create buffer
            rtn.vertexComponentLen = 3; // How many floats make up a vertex
            rtn.vertexCount = aryVert.length / rtn.vertexComponentLen; // How many vertices in the array

            this.bindBuffer(this.ARRAY_BUFFER, rtn.bufVertices);
            this.bufferData(this.ARRAY_BUFFER, new Float32Array(aryVert), this.STATIC_DRAW); // Push array
            this.enableVertexAttribArray(ATTR_POSITION_LOCATION); // Enable attribute location
            this.vertexAttribPointer(ATTR_POSITION_LOCATION, 3, this.FLOAT, false, 0, 0); // Put buffer at location of the vao
        }

        // Setup normals
        if (aryNorm !== undefined && aryNorm != null) {
            rtn.bufNormals = this.createBuffer();
            this.bindBuffer(this.ARRAY_BUFFER, rtn.bufNormals);
            this.bufferData(this.ARRAY_BUFFER, new Float32Array(aryNorm), this.STATIC_DRAW);
            this.enableVertexAttribArray(ATTR_NORMAL_LOCATION);
            this.vertexAttribPointer(ATTR_NORMAL_LOCATION, 3, this.FLOAT, false, 0, 0);
        }

        // Setup UV
        if (aryUV !== undefined && aryUV != null) {
            rtn.bufUV = this.createBuffer();
            this.bindBuffer(this.ARRAY_BUFFER, rtn.bufUV);
            this.bufferData(this.ARRAY_BUFFER, new Float32Array(aryUV), this.STATIC_DRAW);
            this.enableVertexAttribArray(ATTR_UV_LOCATION);
            this.vertexAttribPointer(ATTR_UV_LOCATION, 2, this.FLOAT, false, 0, 0); // UV only has two floats per component
        }

        // Setup Index
        if (aryInd !== undefined && aryInd != null) {
            rtn.bufIndex = this.createBuffer();
            rtn.IndexCount = aryInd.length;
            this.bindBuffer(this.ELEMENT_ARRAY_BUFFER, rtn.bufIndex);
            this.bufferData(this.ELEMENT_ARRAY_BUFFER, new Uint16Array(aryInd), this.STATIC_DRAW);
            this.bindBuffer(this.ELEMENT_ARRAY_BUFFER, null);
        }

        // Clean up
        this.bindVertexArray(null); //Unbind the VAO, very Important. Always unbind when you are done using it.
        this.bindBuffer(this.ARRAY_BUFFER, null); // Unbind any buffers that might be set

        this.mMeshCache[name] = rtn;
        return rtn;
    }

    // Setters and Getters

    // Set the size of the canvas and the rendering view port
    gl.fSetSize = function (w, h) {
        // set the size of the canvas, 3 ways needed to work properly on chrome
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.canvas.width = w;
        this.canvas.height = h;

        // when updating the canvas size, must reset the viewport of the canvas to change webgl render resolution
        this.viewport(0, 0, w, h);
        return this;
    }

    gl.fFitScreen = function (wp, hp) {
        return this.fSetSize(window.innerWidth * (wp || 1), window.innerHeight * (hp || 1));
    }

    return gl;
}
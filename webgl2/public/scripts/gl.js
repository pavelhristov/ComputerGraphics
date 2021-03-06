// Global constants
const ATTR_POSITION_NAME = 'a_position';
const ATTR_POSITION_LOCATION = 0;
const ATTR_NORMAL_NAME = 'a_norm';
const ATTR_NORMAL_LOCATION = 1;
const ATTR_UV_NAME = 'a_uv';
const ATTR_UV_LOCATION = 2;

// Util Class
class GlUtil {
    // Convert Hex color to float arrays, can batch process a list into one big array.
    // example: GlUtil.rgbArray('#FF0000', '00FF00', '#0000FF');
    static rgbArray() {
        if (arguments.length === 0) {
            return null;
        }

        let rtn = [];
        for (var i = 0, c, p; i < arguments.length; i++) {
            if (arguments[i].length < 6) {
                continue;
            }

            c = arguments[i];
            p = (c[0] === '#') ? 1 : 0;

            rtn.push(parseInt(c[p] + c[p + 1], 16) / 255.0,
                parseInt(c[p + 2] + c[p + 3], 16) / 255.0,
                parseInt(c[p + 4] + c[p + 5], 16) / 255.0);
        }

        return rtn;
    }
}




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
    gl.mTextureCache = [];


    // Setup GL. Default configurations
    gl.cullFace(gl.BACK); // dont render back
    gl.frontFace(gl.CCW); // counter clock wise rendering
    gl.enable(gl.DEPTH_TEST); // Fragments closer to camera overrides further ones
    gl.enable(gl.CULL_FACE); // Cull back face, so only show triangles that are created clockwise
    gl.depthFunc(gl.LEQUAL); // Near things obscure further things
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Setup default alpha blending
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Methods

    // Reset the canvas with our set background color.
    gl.fClear = function () {
        // Clearing the color and the depth buffer.
        this.clear(this.COLOR_BUFFER_BIT | this.DEPTH_BUFFER_BIT);
        return this;
    }

    // Create and fill our Array buffer.
    gl.fCreateArrayBuffer = function (floatArray, isStatic) {
        if (isStatic === undefined) isStatic = true;

        let buffer = this.createBuffer();
        this.bindBuffer(this.ARRAY_BUFFER, buffer);
        this.bufferData(this.ARRAY_BUFFER, floatArray, (isStatic) ? this.STATIC_DRAW : this.DYNAMIC_DRAW);
        this.bindBuffer(this.ARRAY_BUFFER, null);

        return buffer;
    }

    // Turns array into GL buffers, then setup a VAO that will predefine the buffers to strandard shader attributes.
    gl.fCreateMeshVAO = function (name, aryInd, aryVert, aryNorm, aryUV, vertLen) {
        let rtn = { drawMode: this.TRIANGLES };

        // Create and bind VAO
        rtn.vao = this.createVertexArray();
        this.bindVertexArray(rtn.vao); //Bind it so all the calls to vertexAttribPointer/enableVertexAttribArray is saved to the vao.

        // Setup vertices
        if (aryVert !== undefined && aryVert != null) {
            rtn.bufVertices = this.createBuffer(); // Create buffer
            rtn.vertexComponentLen = vertLen || 3; // How many floats make up a vertex
            rtn.vertexCount = aryVert.length / rtn.vertexComponentLen; // How many vertices in the array

            this.bindBuffer(this.ARRAY_BUFFER, rtn.bufVertices);
            this.bufferData(this.ARRAY_BUFFER, new Float32Array(aryVert), this.STATIC_DRAW); // Push array
            this.enableVertexAttribArray(ATTR_POSITION_LOCATION); // Enable attribute location
            this.vertexAttribPointer(ATTR_POSITION_LOCATION, rtn.vertexComponentLen, this.FLOAT, false, 0, 0); // Put buffer at location of the vao
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
            rtn.indexCount = aryInd.length;
            this.bindBuffer(this.ELEMENT_ARRAY_BUFFER, rtn.bufIndex);
            this.bufferData(this.ELEMENT_ARRAY_BUFFER, new Uint16Array(aryInd), this.STATIC_DRAW);
            // this.bindBuffer(this.ELEMENT_ARRAY_BUFFER, null);
        }

        // Clean up
        this.bindVertexArray(null); //Unbind the VAO, very Important. Always unbind when you are done using it.
        this.bindBuffer(this.ARRAY_BUFFER, null); // Unbind any buffers that might be set

        if (aryInd) {
            this.bindBuffer(this.ELEMENT_ARRAY_BUFFER, null);
        }

        this.mMeshCache[name] = rtn;
        return rtn;
    }
    
    gl.fLoadTexture = function (name, img, doYFlip, noMips) {
        let texture = this.createTexture();
        this.mTextureCache[name] = texture;
        return this.fUpdateTexture(name, img, doYFlip, noMips);
    }

    gl.fUpdateTexture = function (name, img, doYFlip, noMips) {
        let tex = this.mTextureCache[name];
        if (doYFlip) {
            this.pixelStorei(this.UNPACK_FLIP_Y_WEBGL, true); // Flip texture by the Y position
        }

        this.bindTexture(this.TEXTURE_2D, tex); // Setup texture buffer
        this.texImage2D(this.TEXTURE_2D, 0, this.RGBA, this.RGBA, this.UNSIGNED_BYTE, img); // Push image to GPU

        if(!noMips){
        this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, this.LINEAR); // Setup up scaling
        this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, this.LINEAR_MIPMAP_NEAREST); // Setup down scaling
        this.generateMipmap(this.TEXTURE_2D); // Precalc different sizes of texture for better quality rendering
        }else{
            this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, this.NEAREST);
            this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, this.NEAREST);
            this.texParameteri(this.TEXTURE_2D, this.TEXTURE_WRAP_S, this.CLAMP_TO_EDGE);
            this.texParameteri(this.TEXTURE_2D, this.TEXTURE_WRAP_T, this.CLAMP_TO_EDGE);
        }

        this.bindTexture(this.TEXTURE_2D, null); // Unbind

        if (doYFlip === true) {
            this.pixelStorei(this.UNPACK_FLIP_Y_WEBGL, false); // Stop flipping textures
        }

        return tex;
    }

    // imagArray must be 6 elements long and images placed in the right order
    // Right, Left, Top, Bottom, Back, Front
    gl.fLoadCubeMap = function(name, imgArray){
        if(imgArray.length !== 6) {
            return null;
        }

        // Cube Constants values increment, so easy to start with right and just add 1 in a loop.
        // To make the code easier costs by making the imgArray coming into the function to have the images sorted in the same way the constants are set.
        // TEXTURE_CUBE_MAP_POSITIVE_X - Right :: TEXTURE_CUBE_MAP_NEGATIVE_X - Left
        // TEXTURE_CUBE_MAP_POSITIVE_Y - Top   :: TEXTURE_CUBE_MAP_NEGATIVE_Y - Bottom
        // TEXTURE_CUBE_MAP_POSITIVE_Z - Back  :: TEXTURE_CUBE_MAP_NEGATIVE_Z - Front

        let texture = this.createTexture();
        this.bindTexture(this.TEXTURE_CUBE_MAP, texture);

        // push image to specific spot in the cube map
        for(let i = 0; i < 6; i+= 1){
            this.texImage2D(this.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.RGBA, this.RGBA, this.UNSIGNED_BYTE, imgArray[i]);
        }

        this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_MAG_FILTER, this.LINEAR); // Setup up scaling
        this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_MIN_FILTER, this.LINEAR); // Setup down scaling
        this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_WRAP_S, this.CLAMP_TO_EDGE); // Strench image to X position
        this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_WRAP_T, this.CLAMP_TO_EDGE); // Strench image to Y position
        this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_WRAP_R, this.CLAMP_TO_EDGE); // Strench image to Z position
        // this.generateMipmap(this.TEXTURE_CUBE_MAP);

        this.bindTexture(this.TEXTURE_CUBE_MAP, null);
        this.mTextureCache[name] = texture;
        return texture;
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
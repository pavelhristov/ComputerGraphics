class ShaderBuilder {
    constructor(gl, vertexShader, fragmentShader, isFromDom) {
        if (isFromDom) {
            this.program = ShaderUtil.domShaderProgram(gl, vertexShader, fragmentShader, true);
        } else {
            this.program = ShaderUtil.createProgramFromText(gl, vertexShader, fragmentShader, true);
        }

        if (this.program) {
            this.gl = gl;
            this.gl.useProgram(this.program);
            this.mUniformList = []; // List of Uniforms that have been loaded in. Key = UNIFORM_NAME {loc, type}
            this.mTextureList = []; // List of texture uniforms, Indexed {loc, tex}

            this.noCulling = false; // If true, disables culling
            this.doBlending = false; // If true, allows alpha to work.
        }
    }

    //------------------------------------------------------------------------------------------------------------------
    // Methods For Shader Prep.
    //------------------------------------------------------------------------------------------------------------------
    // Takes in unlimited arguments. Its grouped by two for example (UniformName, UniformType): 'uColor', '3fv'
    prepareUniforms() {
        if (arguments.length % 2 != 0) {
            console.log('prepareUniforms needs arguments to be in pairs.');
            return this;
        }

        let location = 0;
        for (let i = 0; i < arguments.length; i += 2) {
            location = gl.getUniformLocation(this.program, arguments[i]);
            if (location) {
                this.mUniformList[arguments[i]] = {
                    location: location,
                    type: arguments[i + 1]
                }
            }
        }

        return this;
    }

    // Takes unlimited arguments. Its grouped by two (Uniformname, CacheTextureName): 'uMask01', 'tex01'
    prepareTextures() {
        if (arguments.length % 2 != 0) {
            console.log('prepareTextures needs arguments to be in pairs.');
            return this;
        }

        let location = 0;
        let texture = '';
        for (let i = 0; i < arguments.length; i += 2) {
            texture = this.gl.mTextureCache[arguments[i + 1]];
            if (!texture) {
                console.log(`Texture not found in cache :${arguments[i + 1]}`);
                continue;
            }

            location = this.gl.getUniformLocation(this.program, arguments[i]);
            if (location) {
                this.mTextureList.push({
                    location: location,
                    texture: texture
                });
            }
        }

        return this;
    }

    //------------------------------------------------------------------------------------------------------------------
    // Setters and Getters.
    //------------------------------------------------------------------------------------------------------------------
    // Uses a 2 item group argument array. Uniform_Name, Uniform_Value
    setUniforms() {
        if (arguments.length % 2 != 0) {
            console.log('setUniforms needs arguments to be in pairs.');
            return this;
        }

        let name;
        for (let i = 0; i < arguments.length; i += 2) {
            name = arguments[i];
            if (this.mUniformList[name] === undefined) {
                console.log(`uniform not found ${name}`);
                return this;
            }

            switch (this.mUniformList[name].type) {
                case '2fv':
                    this.gl.uniform2fv(this.mUniformList[name].location, new Float32Array(arguments[i + 1]));
                    break;
                case '3fv':
                    this.gl.uniform3fv(this.mUniformList[name].location, new Float32Array(arguments[i + 1]));
                    break;
                case '4fv':
                    this.gl.uniform4fv(this.mUniformList[name].location, new Float32Array(arguments[i + 1]));
                    break;
                case 'mat4':
                    this.gl.uniformMatrix4fv(this.mUniformList[name].location, false, arguments[i + 1]);
                    break;
                default:
                    console.log(`unknown uniform type for ${name}`);
                    break;
            }
        }

        return this;
    }

    //------------------------------------------------------------------------------------------------------------------
    // Methods.
    //------------------------------------------------------------------------------------------------------------------
    activate() {
        this.gl.useProgram(this.program);
        return this;
    }

    deactivate() {
        this.gl.useProgram(null);
        return this;
    }

    // Clean up function for when shadder is no longer needed.
    dispose() {
        // unbind the program if its currently active
        if (this.gl.getParameter(this.gl.CURRENT_PROGRAM) === this.program) {
            this.gl.useProgram(null);
        }

        this.gl.deleteProgram(this.program);
    }

    preRender() {
        this.gl.useProgram(this.program); //Save a function call and just activate this shader program on preRender

        // If passing in arguments, then lets push that to setUniforms for handling.
        if (arguments.length > 0) {
            this.setUniforms.apply(this, arguments);
        }

        //--------------------------------------------------------------------------------------------------------------
        // Prepare textures that might be loaded up.
        // TODO: After done rendering need to deactivate the texture slots
        let textureSlot;
        for (let i = 0; i < this.mTextureList.length; i++) {
            textureSlot = this.gl['TEXTURE' + i];
            this.gl.activeTexture(textureSlot);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.mTextureList[i].texture);
            this.gl.uniform1i(this.mTextureList[i].location, i);
        }

        return this;
    }

    // Handle rendering a model
    renderModel(model, doShaderClose) {
        this.setUniforms('uMVMatrix', model.transform.getViewMatrix());
        this.gl.bindVertexArray(model.mesh.vao);

        if (model.mesh.noCulling || this.noCulling) {
            this.gl.disable(this.gl.CULL_FACE);
        }

        if (model.mesh.doBlending || this.doBlending) {
            this.gl.enable(this.gl.BLEND);
        }

        if (model.mesh.indexCount) {
            this.gl.drawElements(model.mesh.drawMode, model.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
        } else {
            this.gl.drawArrays(model.mesh.drawMode, 0, model.mesh.vertexCount);
        }

        // Clean up
        this.gl.bindVertexArray(null);
        if (model.mesh.noCulling || this.noCulling) {
            this.gl.enable(this.gl.CULL_FACE);
        }

        if (model.mesh.doBlending || this.doBlending) {
            this.gl.disable(this.gl.BLEND);
        }

        if (doShaderClose) {
            this.gl.useProgram(null);
        }

        return this;
    }
}


class Shader {
    constructor(gl, vertexShaderSource, fragmentShaderSource) {
        this.program = ShaderUtil.createProgramFromText(gl, vertexShaderSource, fragmentShaderSource, true);

        if (this.program != null) {
            this.gl = gl;
            gl.useProgram(this.program);
            this.attribLocations = ShaderUtil.getStandardAttribLocations(gl, this.program);
            this.uniformLocations = ShaderUtil.getStandardUniformLocations(gl, this.program);
        }
        // Note: extended shaders should deactivate shader when done calling super and setting up custom parts in the constructor.
    }

    // Methods
    activate() {
        this.gl.useProgram(this.program);
        return this;
    }

    deactivate() {
        this.gl.useProgram(null);
        return this;
    }

    setPerspective(matData) {
        this.gl.uniformMatrix4fv(this.uniformLocations.perspective, false, matData);
        return this;
    }

    setModalMatrix(matData) {
        this.gl.uniformMatrix4fv(this.uniformLocations.modalMatrix, false, matData);
        return this;
    }

    setCameraMatrix(matData) {
        this.gl.uniformMatrix4fv(this.uniformLocations.cameraMatrix, false, matData);
        return this;
    }

    // Helps cleaning up resources when shader is no longer needed
    dispose() {
        // unbind the program if it's currently active.
        if (this.gl.getParameter(this.gl.CURRENT_PROGRAM) === this.program) {
            this.gl.useProgram(null);
        }

        this.gl.deleteProgram(this.program);
    }

    // Render related methods

    // Setup custom properties
    preRender() { } // abstract method

    renderModal(modal) {
        this.setModalMatrix(modal.transform.getViewMatrix()); // Set the transform, so the shader knows where the modal exists in 3d space
        this.gl.bindVertexArray(modal.mesh.vao); // Enable VAO, this will set all the predefined attributes for the shader

        if (modal.mesh.noCulling) {
            this.gl.disable(this.gl.CULL_FACE);
        }

        if (modal.mesh.doBlending) {
            this.gl.enable(this.gl.BLEND);
        }

        if (modal.mesh.indexCount) {
            this.gl.drawElements(modal.mesh.drawMode, modal.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
        } else {
            this.gl.drawArrays(modal.mesh.drawMode, 0, modal.mesh.vertexCount);
        }

        // Cleanup
        this.gl.bindVertexArray(null);
        if (modal.mesh.noCulling) {
            this.gl.enable(this.gl.CULL_FACE);
        }

        if (modal.mesh.doBlending) {
            this.gl.disable(this.gl.BLEND);
        }

        return this;
    }
}

class ShaderUtil {
    // Main utility functions

    // get the text of a script tag storing shader code
    static domShaderSrc(elementId) {
        let element = document.getElementById(elementId);
        if (!element || element.text == "") {
            console.log(`${elementId} shader not found or empty!`);
            return null;
        }

        return element.text;
    }

    // Create shader by passing in its code and type
    static createShader(gl, src, type) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        // Get error data if shader failed to compile
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`Error compiling shader: ${src}`, gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    // Link two compiled shaders to create a program for rendering
    static createProgram(gl, vShader, fShader, doValidate) {
        // Link shaders together
        let program = gl.createProgram();
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);

        // Force predefined locations for specific attributes. If the attribute isn't used in th shader its location will default to -1
        gl.bindAttribLocation(program, ATTR_POSITION_LOCATION, ATTR_POSITION_NAME);
        gl.bindAttribLocation(program, ATTR_NORMAL_LOCATION, ATTR_NORMAL_NAME);
        gl.bindAttribLocation(program, ATTR_UV_LOCATION, ATTR_UV_NAME);

        gl.linkProgram(program);

        // Check if successful
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(`Error creating shader program!`, gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        // Only do this for additional debugging.
        if (doValidate) {
            gl.validateProgram(program);
            if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
                console.error(`Error validating program!`, gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return null;
            }
        }

        // Can delete the shaders since the program has been made
        gl.detachShader(program, vShader); // Detach might cause problems on some browsers, only delete should do.
        gl.detachShader(program, fShader);
        gl.deleteShader(fShader);
        gl.deleteShader(vShader);

        return program;
    }

    // Helper functions

    // Pass in script tag ids for shaders and create a program
    static domShaderProgram(gl, vertexId, fragmentId, doValidate) {
        // 1. Get Vertex and Fragment Shader text.
        let vertexShaderText = ShaderUtil.domShaderSrc(vertexId);
        if (!vertexShaderText) {
            return null;
        }

        let fragmentShaderText = ShaderUtil.domShaderSrc(fragmentId);
        if (!fragmentShaderText) {
            return null;
        }

        // 2. Compile text and validate.
        let vertexShader = ShaderUtil.createShader(gl, vertexShaderText, gl.VERTEX_SHADER);
        if (!vertexShader) {
            return null;
        }

        let fragmentShader = ShaderUtil.createShader(gl, fragmentShaderText, gl.FRAGMENT_SHADER);
        if (!fragmentShader) {
            gl.deleteShader(vertexShader);
            return null;
        }

        // 3. Link shaders together as a program.
        return ShaderUtil.createProgram(gl, vertexShader, fragmentShader, doValidate);
    }

    static createProgramFromText(gl, vertexShaderText, fragmentShaderText, doValidate) {
        let vertexShader = ShaderUtil.createShader(gl, vertexShaderText, gl.VERTEX_SHADER);
        if (!vertexShader) {
            return null;
        }

        let fragmentShader = ShaderUtil.createShader(gl, fragmentShaderText, gl.FRAGMENT_SHADER);
        if (!fragmentShader) {
            gl.deleteShader(vertexShader);
            return null;
        }

        return ShaderUtil.createProgram(gl, vertexShader, fragmentShader, doValidate);
    }

    // Getter/Setters

    // Get the locations of standard Attributes. Location will be -1 if attribute is not found.
    static getStandardAttribLocations(gl, program) {
        return {
            position: gl.getAttribLocation(program, ATTR_POSITION_NAME),
            norm: gl.getAttribLocation(program, ATTR_NORMAL_NAME),
            uv: gl.getAttribLocation(program, ATTR_UV_NAME)
        };
    }

    static getStandardUniformLocations(gl, program) {
        return {
            perspective: gl.getUniformLocation(program, 'uPMatrix'),
            modalMatrix: gl.getUniformLocation(program, 'uMVMatrix'),
            cameraMatrix: gl.getUniformLocation(program, 'uCameraMatrix'),
            mainTexture: gl.getUniformLocation(program, 'uMainTex')
        }
    }
}
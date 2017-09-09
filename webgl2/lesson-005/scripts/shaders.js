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
            this.gl.deleteProgram(this.program);
        }
    }

    // Render related methods

    // Setup custom properties
    preRender() { } // abstract method

    renderModal(modal) {
        this.setModalMatrix(modal.transform.getViewMatrix()); // Set the transform, so the shader knows where the modal exists in 3d space
        this.gl.bindVertexArray(modal.mesh.vao); // Enable VAO, this will set all the predefined attributes for the shader

        if (modal.mesh.indexCount) {
            this.gl.drawElements(modal.mesh.drawMode, modal.meshindexLength, gl.UNSIGNED_SHORT, 0);
        } else {
            this.gl.drawArrays(modal.mesh.drawMode, 0, modal.mesh.vertexCount);
        }

        this.gl.bindVertexArray(null);

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
            position: gl.getAttribLocation(program, ATTR_POSITION_LOCATION),
            norm: gl.getAttribLocation(program, ATTR_NORMAL_LOCATION),
            uv: gl.getAttribLocation(program, ATTR_UV_LOCATION)
        };
    }

    static getStandardUniformLocations(gl, program){
        return {
            perspective: gl.getUniformLocation(program, 'uPMatrix'),
            modalMatrix: gl.getUniformLocation(program, 'uMVMatrix'),
            cameraMatrix: gl.getUniformLocation(program, 'uCameraMatrix'),
            mainTexture: gl.getUniformLocation(program, 'uMainTex')
        }
    }
}
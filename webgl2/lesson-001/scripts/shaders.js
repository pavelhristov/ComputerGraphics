class ShaderUtil{
    static domShaderSrc(elementId){
        let element = document.getElementById(elementId);
        if(!element || element.text == ""){
            console.log(`${elementId} shader not found or empty!`);
            return null;
        }

        return element.text;
    }

    static createShader(gl,src,type){
        let shader = gl.createShader(type);
        gl.shaderSource(shader,src);
        gl.compileShader(shader);

        // Get error data if shader failed to compile
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`Error compiling shader: ${src}`,gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    static createProgram(gl, vShader, fShader, doValidate){
        // Link shaders together
        let program = gl.createProgram();
        gl.attachShader(program,vShader);
        gl.attachShader(program,fShader);
        gl.linkProgram(program);

        // Check if successful
        if (!gl.getProgramParameter(program,gl.LINK_STATUS)) {
            console.error(`Error creating shader program!`, gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        // Only do this for additional debugging.
        if(doValidate){
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
}
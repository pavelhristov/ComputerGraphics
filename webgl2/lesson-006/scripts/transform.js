class Transform {
    constructor() {
        // Transfrom Vectors
        this.position = new Vector3(0, 0, 0); // Traditional x,y,z 3d position
        this.scale = new Vector3(1, 1, 1); // How much to sacle a mesh. Having a 1 means no scaling.
        this.rotation = new Vector3(0, 0, 0); // Hold rotation values based on degrees, Object will translate it to radians.
        this.matView = new Matrix4(); // Cache the results when calling updateMatrix
        this.matNormal = new Float32Array(9); // This is a Mat3, raw array to hold the values is enough for what its used for

        // Direction Vectors
        this.forward = new Float32Array(4); // When rotating, keep track of what the forward direction is
        this.up = new Float32Array(4); // What the up direction is, invert to get bottom
        this.right = new Float32Array(4); // What the right direction is, invert to get left
    }

    //--------------------------------------------------------------------------------
    // Methods
    updateMatrix() {
        this.matView.reset() // Order is very important
            .vtranslate(this.position)
            .rotateX(this.rotation.x * Transform.deg2Rad)
            .rotateY(this.rotation.y * Transform.deg2Rad)
            .rotateZ(this.rotation.z * Transform.deg2Rad)
            .vscale(this.scale);

        // Calculate the Normal Matrix which doesn't need translate, then traspose and inverses the mat4 to mat3
        Matrix4.normalMat3(this.matNormal, this.matView.raw);

        // Determine Direction after all the transformations.
        Matrix4.transformVec4(this.forward, [0, 0, 1, 0], this.matView.raw); //Z
        Matrix4.transformVec4(this.up, [0, 1, 0, 0], this.matView.raw); //Y
        Matrix4.transformVec4(this.right, [1, 0, 0, 0], this.matView.raw); //X

        return this.matView.raw;
    }

    updateDirection() {
        Matrix4.transformVec4(this.forward, [0, 0, 1, 0], this.matView.raw); //Z
        Matrix4.transformVec4(this.up, [0, 1, 0, 0], this.matView.raw); //Y
        Matrix4.transformVec4(this.right, [1, 0, 0, 0], this.matView.raw); //X

        return this;
    }

    getViewMatrix() {
        return this.matView.raw;
    }

    getNormalMatrix(){
        return this.matNormal;
    }

    reset(){
        this.position.set(0,0,0);
        this.scale.set(1,1,1);
        this.rotation.set(0,0,0);
    }
}

Transform.deg2Rad = Math.PI / 180; // Cache result, one less operation to do each update;

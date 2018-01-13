class Terrain {
    static createModel(gl, keepRawData) {
        return new Model(Terrain.createMesh(gl, 10, 10, 20, 20, keepRawData));
    }

    static createMesh(gl, width, height, rowLength, colLength, keepRawData) {
        let rowStart = width / -2; // Starting position for rows when calculation Z position.
        let colStart = height / -2; // Starting position of column when calculation X position.
        let vLen = rowLength * colLength; // Total Vertices needed to create plane
        let indexLenght = (rowLength - 1) * colLength; // Total index values needed to create the Triangle Strip
        let colIncrement = width / (colLength - 1); // Increment value for columns when calculation X position
        let rowIncrement = height / (rowLength - 1); // Increment value for rows when calculation Z position
        let currentRow = 0;
        let currentCol = 0;
        let aVert = [];
        let aIndex = [];
        let aUV = [];
        let uvxIncrement = 1 / (colLength - 1); // Increment value for columns when calculating X UV position of UV
        let uvyIncrement = 1 / (rowLength - 1); // Increment valye for rows when calculation Y UV position of UV

        // Perlin Noise
        noise.seed(1)
        let h = 0; // temporary height
        let freq = 13; // Frequency on how to step through perlin noise
        let maxHeight = -3; // Max Height

        //----------------------------------------------------------------------------------
        // Generate the vertices and the index array.
        for (let i = 0; i < vLen; i += 1) {
            currentRow = Math.floor(i / colLength);
            currentCol = i % colLength;
            h = noise.perlin2((currentRow + 1) / freq, (currentCol + 1) / freq) * maxHeight;

            // Create Vertices: x,y,z
            aVert.push(colStart + currentCol * colIncrement, 0.2 + h, rowStart + currentRow * rowIncrement);

            // Create UV s,t. Spread the 0,0 to 1,1 throughout the whole plane
            aUV.push((currentCol === colLength - 1) ? 1 : currentCol * uvxIncrement,
                (currentRow === rowLength - 1) ? 1 : currentRow * uvyIncrement);

            // Create the index, stop creating indexes before the loop ends creating the vertices.
            if (i < indexLenght) {
                // Column index of row R and R+1
                aIndex.push(currentRow * colLength + currentCol, (currentRow + 1) * colLength + currentCol);

                // Create Degenerate Triangle, Last and first index of the R+1
                if (currentCol === colLength - 1 && i < indexLenght - 1) {
                    aIndex.push((currentRow + 1) * colLength + currentCol, (currentRow + 1) * colLength);
                }
            }
        }

        //----------------------------------------------------------------------------------
        // Generate the Normals using finite difference method
        let x;  // X Position in grid
        let y; // Y Position in grid
        let p; // Temp array index when calculating neighboring vertices
        let position; // Using X,Y, determine current vertex index position in array
        let xMax = colLength - 1; // Max X position in grid
        let yMax = rowLength - 1; // Max Y position in grid
        let normalX = 0;
        let normalY = 0;
        let normalZ = 0;
        let normalsLenght = 0; // Normal Vector Length
        let heightLeft;
        let heightRight;
        let heightDown;
        let heightUp;
        let aNorm = [];

        for (let i = 0; i < vLen; i += 1) {
            y = Math.floor(i / colLength);
            x = i % colLength;
            position = y * 3 * colLength + x * 3; // X,Y position to Array index convertion

            //------------------------------------------------------------------------------
            // Get the height value of 4 neighboring vectirs: Left, Right, Top, Bottom

            if (x > 0) { // Left
                p = y * 3 * colLength + (x - 1) * 3; // Calc Neighbour Vector
                heightLeft = aVert[p + 1]; // Grab only the y position which is the height.
            } else {
                heightLeft = aVert[position + 1]; //Out of bounds, use current
            }

            if (x < xMax) { // Right
                p = y * 3 * colLength + (x + 1) * 3;
                heightRight = aVert[p + 1];
            } else {
                heightRight = aVert[position + 1];
            }

            if (y > 0) { // Up
                p = (y - 1) * 3 * colLength + x * 3;
                heightUp = aVert[p + 1];
            } else {
                heightUp = aVert[position + 1];
            }

            if (y < xMax) { // Down
                p = (y - 1) * 3 * colLength + x * 3;
                heightDown = aVert[p + 1];
            } else {
                heightDown = aVert[position + 1];
            }

            //------------------------------------------------------------------------------
            // Calculate the final normal vector
            normalX = heightLeft - heightRight;
            normalY = 2.0;
            normalZ = heightDown - heightUp;
            normalsLenght = Math.sqrt(normalX * normalX + normalY*normalY + normalZ * normalZ); // Length of the vector.
            aNorm.push(normalX/normalsLenght, normalY/normalsLenght, normalZ/ normalsLenght); // Normalize the final normal vector data before saving to array.
        }

        //----------------------------------------------------------------------------------
        let mesh = gl.fCreateMeshVAO('Terrain', aIndex, aVert, aNorm, aUV, 3);
        mesh.drawMode = gl.TRIANGLE_STRIP;

        if(keepRawData){
            mesh.aVert = aVert;
            mesh.aNorm = aNorm;
            mesh.aIndex = aIndex;
        }

        return mesh;
    }
}
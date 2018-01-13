class ObjLoader {
    static domToMesh(meshName, elementId, flipYUV, keepRawData) {
        let d = ObjLoader.parseFromDom(elementId, flipYUV);
        let mesh = gl.fCreateMeshVAO(meshName, d[0], d[1], d[2], d[3], 3);

        // Have the option to save the data to use for normal debugging
        if (keepRawData) {
            mesh.aIndex = d[0];
            mesh.aVert = d[1];
            mesh.aNorm = d[2];
        }

        return mesh;
    }

    static parseFromDom(elementId, flipYUV) {
        return ObjLoader.parseObjText(document.getElementById(elementId).innerHTML, flipYUV);
    }

    static parseObjText(text, flipYUV) {
        text = text.trim() + '\n'; // add new line to be able to access last line in the for loop

        let itm; // line split into an array
        let ary; // itm split into an array, used for face decoding
        let i;
        let ind; // index of the cache arrays
        let isQuad = false; // determine if the face is a quad or not
        let aCache = []; // cache dictionary key = itm array element, val = final index of the vertice
        let cVert = []; // cache vertice array read from obj
        let cNorm = []; // cache normal array
        let cUV = []; // cache UV array
        let fVert = []; // final Index sorted vertice array
        let fNorm = []; // final index sorted normal array
        let fUV = []; // final index sorted uv array
        let fIndex = []; //final sorted index array
        let fIndexCount = 0; // final count of unique vertices

        let lines = text.split('\n');

        lines.forEach(element => {
            let item = element.trim().split(' ');

            switch (item[0]) {
                //--------------------------------------------------
                // Cache vertex data for index processing when going through face data
                // simple data (x, y, z)
                // v -1.000000 1.000000 1.000000
                // vt 0.000000 0.666667
                // vn 0.000000 0.000000 -1.000000
                case 'v':
                    cVert.push(parseFloat(item[1]), parseFloat(item[2]), parseFloat(item[3]));
                    break;

                case 'vt':
                    cUV.push(parseFloat(item[1]), parseFloat(item[2]));
                    break;

                case 'vn':
                    cNorm.push(parseFloat(item[1]), parseFloat(item[2]), parseFloat(item[3]));
                    break;

                //--------------------------------------------------
                // Porcess face data
                // All index values start at 1, but javascript array index start at 0, subtract 1 from the index
                // sample data [Vertex Index, UV Index, Normal Index], Each line is triangle or quad.
                // f 1/1/1 2/2/1 3/3/1 4/4/1
                // f 34/41/36 34/41/35 34/41/36
                // f 34//36 34//35 34//36
                case 'f':
                    itm = item;
                    itm.shift();
                    isQuad = false;

                    for (let i = 0; i < itm.length; i += 1) {
                        //------------------------------------------
                        // In the event the face is a quad
                        if (i == 3 && !isQuad) {
                            i = 2; // Last vertex in the first triangle is the start of the 2nd triangle in a quad
                            isQuad = true;
                        }

                        //------------------------------------------
                        // Has this vertex data been processed?
                        if (itm[i] in aCache) {
                            fIndex.push(aCache[itm[i]]); // It has, add its index to the list
                        } else {
                            // New Unique vertex data, Process it.
                            ary = itm[i].split('/');

                            // Parse vertex data and save final version orded correctly by index
                            ind = (parseInt(ary[0]) - 1) * 3;
                            fVert.push(cVert[ind], cVert[ind + 1], cVert[ind + 2]);

                            // Parse Normal Data and save final version ordered correctly by index
                            ind = (parseInt(ary[2]) - 1) * 3;
                            fNorm.push(cNorm[ind], cNorm[ind + 1], cNorm[ind + 2]);

                            // Parse texture if available and save final version ordered correctly by index
                            if (ary[1] != '') {
                                ind = (parseInt(ary[1]) - 1) * 2;
                                fUV.push(cUV[ind], (!flipYUV) ? cUV[ind + 1] : 1 - cUV[ind + 1]);
                            }

                            // Cache the vertex item value and its new index.
                            // The idea is to create an index for each unique set of vertex data base on the face data
                            // So when the same item is found, just add the index value without duplicating
                            aCache[itm[i]] = fIndexCount;
                            fIndex.push(fIndexCount);
                            fIndexCount += 1;
                        }

                        //--------------------------------------------
                        // in a quad the last vertex of the second triangle is the first vertex of the first triangle
                        if (i == 3 && isQuad) {
                            fIndex.push(aCache[itm[0]]);
                        }
                    }
                    break;
            }
        });

        return [fIndex, fVert, fNorm, fUV];
    }
}
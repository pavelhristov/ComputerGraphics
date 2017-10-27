class ObjLoader {
    static domToMesh(meshName, elementId, flipYUV) {
        let d = ObjLoader.parseFromDom(elementId, flipYUV);
        return gl.fCreateMeshVAO(meshName, d[0], d[1], d[2], d[3], 3);
    }

    static parseFromDom(elementId, flipYUV) {
        return ObjLoader.parseObjText(document.getElementById(elementId).innerHTML, flipYUV);
    }

    static parseObjText(text, flipYUV) {
        text = text.trim() + '\r\n'; // add new line to be able to access last line in the for loop

        let line; // line text from obj file
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
        let posA = 0;
        let posB = text.indexOf('\r\n', 0);

        while (posB > posA) {
            line = text.substring(posA, posB).trim();

            switch (line.charAt(0)) {
                //--------------------------------------------------
                // Cache vertex data for index processing when going through face data
                // simple data (x, y, z)
                // v -1.000000 1.000000 1.000000
                // vt 0.000000 0.666667
                // vn 0.000000 0.000000 -1.000000
                case 'v':
                    itm = line.split(' ');
                    itm.shift();
                    switch (line.charAt(1)) {
                        case ' ':
                            cVert.push(parseFloat(itm[0]), parseFloat(itm[1]), parseFloat(itm[2]));
                            break;
                        case 't':
                            cUV.push(parseFloat(itm[0]), parseFloat(itm[1]));
                            break;
                        case 'n':
                            cNorm.push(parseFloat(itm[0]), parseFloat(itm[1]), parseFloat(itm[2]));
                            break;
                    }

                //--------------------------------------------------
                // Porcess face data
                // All index values start at 1, but javascript array index start at 0, subtract 1 from the index
                // sample data [Vertex Index, UV Index, Normal Index], Each line is triangle or quad.
                // f 1/1/1 2/2/1 3/3/1 4/4/1
                // f 34/41/36 34/41/35 34/41/36
                // f 34//36 34//35 34//36
                case 'f':
                    itm = line.split(' ');
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

            // Get ready to parse the next line of the obj data.
            posA = posB + 1;
            posB = text.indexOf('\r\n', posA);
        }
        
        return [fIndex, fVert, fNorm, fUV];
    }
}




function degToRad(d) {
    return d * Math.PI / 180;
}

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function eMod(x, n) {
    return x >= 0 ? (x % n) : ((n - (-x % n)) % n);
}
// 计算模型矩阵
function computeMatrix(translation, xRotation, yRotation) {
    let matrix = m4.translation(
        translation[0],
        translation[1],
        translation[2]);
    matrix = m4.xRotate(matrix, xRotation);
    return m4.yRotate(matrix, yRotation);
}

function drawObjects(gl, objectsToDraw, overrideProgramInfo) {
    objectsToDraw.forEach(function (object) {
        // 着色器程序
        const programInfo = overrideProgramInfo || object.programInfo;
        const bufferInfo = object.bufferInfo;
        //使用着色器程序
        gl.useProgram(programInfo.program);

        // 设置所有需要的 attributes
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        // 设置 uniforms
        webglUtils.setUniforms(programInfo, object.uniforms);

        // 绘制图形
        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });
}
// 创建每个对象的信息 Make infos for each object for each object.
function createObjects(gl, viewProjectionMatrix, programInfo) {
    const shapes = createShapes(gl);
    const objects = [];
    const objectsToDraw = [];
    const baseHue = rand(0, 360);
    const numObjects = 200;
    for (let ii = 0; ii < numObjects; ++ii) {
        const id = ii + 1;
        const u_colorMult = chroma.hsv(eMod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl();
        const object = {
            uniforms: {
                u_colorMult,
                u_world: m4.identity(),
                u_viewProjection: viewProjectionMatrix,
                u_id: [
                    ((id >> 0) & 0xFF) / 0xFF,
                    ((id >> 8) & 0xFF) / 0xFF,
                    ((id >> 16) & 0xFF) / 0xFF,
                    ((id >> 24) & 0xFF) / 0xFF,
                ],
            },
            translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
            xRotationSpeed: rand(0.8, 1.2),
            yRotationSpeed: rand(0.8, 1.2),
        };
        objects.push(object);
        objectsToDraw.push({
            programInfo: programInfo,
            bufferInfo: shapes[ii % shapes.length],
            uniforms: object.uniforms,
        });
    }
    return {
        objects,
        objectsToDraw
    }

}

function createShapes(gl) {
    // creates buffers with position, normal, texcoord, and vertex color
    // data for primitives by calling gl.createBuffer, gl.bindBuffer,
    // and gl.bufferData
    //创建缓冲区数据
    const sphereBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(gl, 10, 12, 6);
    const cubeBufferInfo = primitives.createCubeWithVertexColorsBufferInfo(gl, 20);
    const coneBufferInfo = primitives.createTruncatedConeWithVertexColorsBufferInfo(gl, 10, 0, 20, 12, 1, true, false);

    return [sphereBufferInfo, cubeBufferInfo, coneBufferInfo];
}

function createTexture(gl) {
    // 创建一个纹理对象作为渲染目标
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return targetTexture;
}

export {
    createTexture,
    createShapes,
    createObjects,
    drawObjects,
    computeMatrix,
    eMod,
    rand,
    degToRad,
}
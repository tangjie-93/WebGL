function drawObjectsToTexture(gl, objectsToDraw, objects, viewMatrix, viewProjectionMatrix, pickingProgramInfo, fieldOfViewRadians, near, far, fb) {


    //找出鼠标下的像素，然后设置一个截头体来渲染
    {
        // compute the rectangle the near plane of our frustum covers
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const top = Math.tan(fieldOfViewRadians * 0.5) * near;
        const bottom = -top;
        const left = aspect * bottom;
        const right = aspect * top;
        const width = Math.abs(right - left);
        const height = Math.abs(top - bottom);

        // compute the portion of the near plane covers the 1 pixel
        // under the mouse.
        //计算覆盖视锥体前方的近平面矩形尺寸
        const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
        const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;

        const subLeft = left + pixelX * width / gl.canvas.width;
        const subBottom = bottom + pixelY * height / gl.canvas.height;
        const subWidth = width / gl.canvas.width;
        const subHeight = height / gl.canvas.height;

        // 为此像素创建视锥体
        const projectionMatrix = m4.frustum(
            subLeft,
            subLeft + subWidth,
            subBottom,
            subBottom + subHeight,
            near,
            far);
        //计算viewProjectionMatrix根据projectionMatrix和viewMatrix
        m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, 1, 1);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawObjects(gl, objectsToDraw, pickingProgramInfo);

    // read the 1 pixel
    const data = new Uint8Array(4);
    gl.readPixels(
        0,                 // x
        0,                 // y
        1,                 // width
        1,                 // height
        gl.RGBA,           // format
        gl.UNSIGNED_BYTE,  // type
        data);             // typed array to hold result
    const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

    // 恢复对象的颜色
    if (oldPickNdx >= 0) {
        const object = objects[oldPickNdx];
        object.uniforms.u_colorMult = oldPickColor;
        oldPickNdx = -1;
    }

    // 高亮在鼠标下的物体
    if (id > 0) {
        const pickNdx = id - 1;
        oldPickNdx = pickNdx;
        const object = objects[pickNdx];
        oldPickColor = object.uniforms.u_colorMult;
        object.uniforms.u_colorMult = (frameCount & 0x8) ? [1, 0, 0, 1] : [1, 1, 0, 1];
    }

}

function drawObjectsToCanvas(gl, objectsToDraw, fieldOfViewRadians, near, far, viewMatrix, viewProjectionMatrix) {
    {
        // 计算投影矩阵
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix =
            m4.perspective(fieldOfViewRadians, aspect, near, far);

        m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    drawObjects(gl, objectsToDraw);
}



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
    drawObjectsToCanvas,
    drawObjectsToTexture
}
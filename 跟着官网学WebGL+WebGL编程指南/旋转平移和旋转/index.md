## 1.二维的平移、旋转、缩放的实现
+ 在webgl中的平移、旋转、缩放操作
```js
<script id="vertex-shader-2d" type="x-shader/x-vertex">
attribute vec2 a_position;
 
uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;
 
void main() {
  // 缩放
  vec2 scaledPosition = a_position * u_scale;
 
  // 旋转
  vec2 rotatedPosition = vec2(
     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);
 
  // 平移
  vec2 position = rotatedPosition + u_translation;
  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
```
+ 在js中的平移、旋转、缩放赋值。
```js
// set the resolution
gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

// set the color
gl.uniform4fv(colorLocation, color);
 // Set the translation. translation是一个二维数组
gl.uniform2fv(translationLocation, translation);

// Set the rotation.rotation是一个二维数组
gl.uniform2fv(rotationLocation, rotation);

// Set the scale.
gl.uniform2fv(scaleLocation, scale);
```
构建几何模型的顶点的创建。**按照顺时针的方向去构建，按照三角形去构建多边形，上一个三角形的最后一个顶点作为下一个三角形的起点。**
```js
// Fill the buffer with the values that define a letter 'F'.
// 
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // top rung
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // middle rung
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90,
]),
gl.STATIC_DRAW);
}
```

## 2.使用矩阵去实现二维的平移、旋转和缩放
二维的平移、旋转和缩放我们一般用三维矩阵来操作。矩阵主要是有前面的平移、旋转、缩放操作的常规操作来封装推导实现的。矩阵的运算是大学线性代数的知识，大家要是不记得话可以去回忆一下矩阵的乘法等运算知识。
具体推导过程可以参考下面的文章。
[https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-2d-matrices.html]

**注意:下面定义的矩阵在进行矩阵运算时都是需要转置的，因为webgl中的矩阵是列主序的。**
```js
const m3 = {
    // x0 = 2x/width-1； y0 = -2y/height + 1;
    projection: function(width, height) {
        // 注意：这个矩阵翻转了 Y 轴，所以 0 在上方
        return [
            2 / width, 0, 0,
            0, -2 / height, 0,
            -1, 1, 1
        ];
    },
    // 单位矩阵
    identity: function() {
        return [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        ];
    },
    translation: function(tx, ty) {
        return [
            1, 0, 0,
            0, 1, 0,
            tx, ty, 1,
        ];
    },
    /****
     * newX = x *  c + y * s;
       newY = x * -s + y * c;
     */
    rotation: function(angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);
        return [
            c,-s, 0,
            s, c, 0,
            0, 0, 1,
        ];
    },
 
    scaling: function(sx, sy) {
        return [
            sx, 0, 0,
            0, sy, 0,
            0, 0, 1,
        ];
    },
    multiply: function(a, b) {
        const a00 = a[0 * 3 + 0];
        const a01 = a[0 * 3 + 1];
        const a02 = a[0 * 3 + 2];
        const a10 = a[1 * 3 + 0];
        const a11 = a[1 * 3 + 1];
        const a12 = a[1 * 3 + 2];
        const a20 = a[2 * 3 + 0];
        const a21 = a[2 * 3 + 1];
        const a22 = a[2 * 3 + 2];
        const b00 = b[0 * 3 + 0];
        const b01 = b[0 * 3 + 1];
        const b02 = b[0 * 3 + 2];
        const b10 = b[1 * 3 + 0];
        const b11 = b[1 * 3 + 1];
        const b12 = b[1 * 3 + 2];
        const b20 = b[2 * 3 + 0];
        const b21 = b[2 * 3 + 1];
        const b22 = b[2 * 3 + 2];
        return [
            b00 * a00 + b01 * a10 + b02 * a20,
            b00 * a01 + b01 * a11 + b02 * a21,
            b00 * a02 + b01 * a12 + b02 * a22,
            b10 * a00 + b11 * a10 + b12 * a20,
            b10 * a01 + b11 * a11 + b12 * a21,
            b10 * a02 + b11 * a12 + b12 * a22,
            b20 * a00 + b21 * a10 + b22 * a20,
            b20 * a01 + b21 * a11 + b22 * a21,
            b20 * a02 + b21 * a12 + b22 * a22,
        ];
  },
};
```
原来的平移、旋转和缩放操作使用矩阵来实现变成.
```js
  // Compute the matrices
const projectionMatrix = m3.projection(
        gl.canvas.clientWidth, gl.canvas.clientHeight);
const translationMatrix = m3.translation(translation[0], translation[1]);
const rotationMatrix = m3.rotation(angleInRadians);
const scaleMatrix = m3.scaling(scale[0], scale[1]);

// const matrix = m3.identity();
// Multiply the matrices.
matrix = m3.multiply(projectionMatrix, translationMatrix);
matrix = m3.multiply(matrix, rotationMatrix);
matrix = m3.multiply(matrix, scaleMatrix);

// Set the matrix.
gl.uniformMatrix3fv(matrixLocation, false, matrix);
```
在webgl中的代码实现
```js
attribute vec2 a_position; 
uniform mat3 u_matrix;
void main() {
  // 使位置和矩阵相乘
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
```



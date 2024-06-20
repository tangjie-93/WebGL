## 1.选中物体
通过在顶点着色器中定义一个`uniform bool u_Clicked`变量,用于判断鼠标点击的位置是否在`canvas`的区域内，通过判断`u_Clicked`的值来给模型设置相应的选中颜色。
+ **顶点着色器中的代码**如下所示
```js
attribute vec4 a_Position;
attribute vec4 a_Color;
uniform mat4 u_MvpMatrix;
uniform bool u_Clicked; // Mouse is pressed
varying vec4 v_Color;
void main() {
    gl_Position = u_MvpMatrix * a_Position;
    if (u_Clicked) { //  Draw in red if mouse is pressed
        v_Color = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        v_Color = a_Color;
    }
}
```
+ **`js`代码主要是通过 点击事件的位置 来判断鼠标落点是否在`canvas`中来设置`u_Clicked`的值。**
```js
canvas.onmousedown = function(ev) {   
    // Mouse is pressed
    // 默认offset为0
    const x = ev.clientX, y = ev.clientY;
    const rect = ev.target.getBoundingClientRect();
    // 判断是否canvas内
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
        // If pressed position is inside <canvas>, check if it is above object
        var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
        var picked = check(gl, n, x_in_canvas, y_in_canvas, currentAngle, u_Clicked, viewProjMatrix, u_MvpMatrix);
    }
}
```
+ 判断是否点中的是物体。
```js
function check(gl, n, x, y, currentAngle, u_Clicked, viewProjMatrix, u_MvpMatrix) {
  gl.uniform1i(u_Clicked, 1);  // Pass true to u_Clicked
  draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix); // Draw cube with red
  // Read pixel at the clicked position
  var pixels = new Uint8Array(4); // Array for storing the pixel value
  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
     // The mouse in on cube if R(pixels[0]) is 255
  if (pixels[0] !== 255){
    gl.uniform1i(u_Clicked, 0);  // Pass false to u_Clicked(rewrite the cube)
    draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix); // Draw the cube
    
  }else{
    alert('The cube was selected! ');
  }
}
```
**缺点**：上面的方法缺点很明显，如果模型过多就不太好使用了。上面的选中物体的原理是在鼠标触发点击事件后，将物体渲染为红色，然后在获取鼠标点的一个像素，判断是否为红色，是红色，则代表选中的是物体。
具体`demo` 参考 [`./demo/选中物体.html`](./demo/选中物体.html)

## 2.选中一个面
需要为每个绘制的面设置一个编号，并作为`attribute float a_Face;`传递到顶点着色器中。然后再传递一个变量`uniform int u_PickedFace`表示选中的面的编号，通过判断两个变量的值是否相等来确定是否被选中了。并且将物体表面的编号存入到`a`分量中。
+ 顶点着色器代码
```js
attribute vec4 a_Position;
attribute vec4 a_Color;
attribute float a_Face;   // Surface number (Cannot use int for attribute variable)
uniform mat4 u_MvpMatrix;
uniform int u_PickedFace;// Surface number of selected face
varying vec4 v_Color;
void main() {
  gl_Position = u_MvpMatrix * a_Position;
  int face = int(a_Face); // Convert to int
  // 通过判断选中的面是否是face
  vec3 color = (face == u_PickedFace) ? vec3(1.0) : a_Color.rgb;
  if(u_PickedFace == 0) { // 将表面编号存入 alpha 分量
    v_Color = vec4(color, a_Face/255.0);
  } else {
    v_Color = vec4(color, a_Color.a);
  }
}
```
+ 判断是否选中的`js`代码
```js
  gl.uniform1i(u_PickedFace, -1);

  var currentAngle = 0.0; // Current rotation angle
  // Register the event handler
  canvas.onmousedown = function(ev) {   // Mouse is pressed
    var x = ev.clientX, y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
      // If Clicked position is inside the <canvas>, update the selected surface
      const x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
      const face = checkFace(gl, n, x_in_canvas, y_in_canvas, currentAngle, u_PickedFace, viewProjMatrix, u_MvpMatrix);
      gl.uniform1i(u_PickedFace, face); // Pass the surface number to u_PickedFace
      draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix);
    }
  }
// 点击的时候采取设置颜色a分量的值
function checkFace(gl, n, x, y, currentAngle, u_PickedFace, viewProjMatrix, u_MvpMatrix) {
  var pixels = new Uint8Array(4); // Array for storing the pixel value
  gl.uniform1i(u_PickedFace, 0);  // 通过设置u_PickedFace 为0, 来将表面标号写入a分量
  // 存在颜色缓冲区中，没有最终显示在屏幕上
  draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix);
  // Read the pixel value of the clicked position. pixels[3] is the surface number
  // 获取当前点击像素位置的表面编号，最大值是255
  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  return pixels[3];
}
```
**问题：** 为什么在 `onmousedown` 事件中要 执行下面的代码？
```js
gl.uniform1i(u_PickedFace, 0);  // 通过设置u_PickedFace 为0, 来将表面标号写入a分量
  draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix);
```
回答：在点击鼠标后，通过设置 `u_PickedFace` 为 `0`, 来将表面编号号写入a分量。
这样在下次绘制物体的时候才能将物体绘制成选中的颜色。这样也能保证没有选中的面都能绘制称原来的颜色。

```js
if(u_PickedFace == 0) { // 将表面编号存入 alpha 分量
    v_Color = vec4(color, a_Face/255.0);
  } else {
    v_Color = vec4(color, a_Color.a);
  }
```


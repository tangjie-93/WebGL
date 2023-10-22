## 1.概念
指的是使用`WebGL`渲染三维图形，然后将渲染结果作为纹理贴到另一个三维物体上去。实际上就是将渲染结果作为纹理使用。
## 2.祯缓冲区对象和渲染缓冲区对象
默认情况下，`WebGL`在颜色缓冲区中进行绘图，在开启隐藏面消除功能时，还会使用到深度缓冲区。绘制的结果图像是存储在颜色缓冲区中的。

**祯缓冲对象**可以用来代替颜色缓冲区或者深蹲缓冲区。绘制在祯缓冲区的对象并不会直接显示在`canvas`上，我们可以先对祯缓冲区中的内容进行一些处理再显示，或者是直接使用其中的内容作为纹理图像。在祯缓冲区中进行绘制的过程称之为**离屏绘制**。

模型的绘制工作并不是直接发生在祯缓冲区中的，而是发生在祯缓冲区所关联的对象上。祯缓冲区中有三种关联对象：**颜色关联对象**，**深度关联对系那个**，**模版关联对象**，分别用来替代颜色缓冲区，深度缓冲区和模版缓冲区。

每个关联对象有可以是两种类型的；**纹理对象**和**渲染缓冲区对象**。纹理对象存储了纹理图像，一般是作为颜色关联对象关联到祯缓冲区对象，随后`WebGL`就可以在纹理对象中绘图了。渲染缓冲区对象表示一种更加通用的绘图区域，可以向其中写入多种类型的数据。

## 3.如何实现渲染到纹理

如果我们想把`WebGL`中渲染出的图像作为纹理使用，那么就需要将纹理对象作为颜色关联对象关联到祯缓冲区对象上，然后在祯缓冲区进行绘制，此时颜色关联对像就代替了颜色缓冲区。如果我们需要进行隐藏面消除，我们就需要再创建一个渲染缓冲区对象来作为祯缓冲区的深度关联对象，来代替深度缓冲区。

需要实现上面的效果，需要执行下面的8个步骤。
#### 1.创建祯缓冲区对像
```js
// Create a frame buffer object (FBO)
framebuffer = gl.createFramebuffer();
if (!framebuffer) {
console.log('Failed to create frame buffer object');
return error();
}
```
#### 2.创建纹理对像并设置其尺寸和参数
```js
// Create a texture object and set its size and parameters
texture = gl.createTexture(); // Create a texture object
if (!texture) {
    console.log('Failed to create texture object');
    return error();
}
gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the object to target
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
framebuffer.texture = texture; // Store the texture object
```
#### 3.创建渲染缓冲区对像
```js
// Create a renderbuffer object and Set its size and parameters
depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
if (!depthBuffer) {
    console.log('Failed to create renderbuffer object');
    return error();
}
```
#### 4.绑定渲染缓冲区对象并设置其尺寸
```js
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
```
#### 5.将祯缓冲区的颜色关联对象指定为一个纹理对象
```js
 // Attach the texture and the renderbuffer object to the FBO
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

```
#### 6.将祯缓冲区的深度关联对象指定为一个渲染缓冲区对象
```js
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
```
#### 7.检查祯缓冲区是否正确配置
```js
 // Check if FBO is configured correctly
  var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (gl.FRAMEBUFFER_COMPLETE !== e) {
    console.log('Frame buffer object is incomplete: ' + e.toString());
    return error();
  }
  ...
  // Unbind the buffer object
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

```
#### 8.在祯缓冲区中进行绘制
```js
function draw(gl, canvas, fbo, plane, cube, angle, texture, viewProjMatrix, viewProjMatrixFBO) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);              // Change the drawing destination to FBO
  gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); // Set a viewport for FBO

  gl.clearColor(0.2, 0.2, 0.4, 1.0); // Set clear color (the color is slightly changed)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear FBO

  drawTexturedCube(gl, gl.program, cube, angle, texture, viewProjMatrixFBO);   // Draw the cube
    // 切换绘制目标为颜色缓冲区
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);        // Change the drawing destination to color buffer
  gl.viewport(0, 0, canvas.width, canvas.height);  // Set the size of viewport back to that of <canvas>

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the color buffer

  drawTexturedPlane(gl, gl.program, plane, angle, fbo.texture, viewProjMatrix);  // Draw the plane
}
```
[具体的demo地址](./index.html)

渲染效果如下所示

<img width=200 src='../../../images/渲染到纹理.png'>
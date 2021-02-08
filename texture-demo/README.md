## 纹理贴图
简单的所就是将 `png、jpg` 等格式图片显示在 `WebGL` 三维场景中。例如往三维模型上贴商标。

在着色器中图片的坐标称为**纹理坐标**，图片称为**纹理图像**，图片上的一个像素称为**纹素**，一个纹素就是一个 `RGB` 或者`RGBA`值。把整个图片看成一个平面区域，用一个二维`UV`坐标可以描述每一个纹素的位置。下图来源于网络。

<img src="../images/webgl-UV.png" alt="暂无图片" />

上图展示了 **纹理坐标** 和 **顶点坐标** 的对应关系。在纹理坐标系统中左下角是坐标原点 `(0,0)`。顶点坐标在顶点着色器中经过光栅化处理后得到片元数据，纹理坐标在光栅化过程中会进行插值计算，得到一系列的纹理坐标数据，纹理坐标会按照一定的规律对应纹理图像上的纹素，内插得到的片元纹理坐标会传递给片元着色器。

在片元着色器中利用插值得到的坐标数据可以抽取纹理图像中的纹素，将抽取的纹素逐个赋值给光栅化顶点坐标得到的片元。

**顶点着色器代码**
```js
attribute vec4 a_Position;//顶点位置坐标
attribute vec2 a_TexCoord;//纹理坐标
varying vec2 v_TexCoord;//插值后纹理坐标
void main() {
  //顶点坐标apos赋值给内置变量gl_Position
  gl_Position = a_Position;
  //纹理坐标插值计算
  v_TexCoord = a_TexCoord;
}
```
**片元着色器代码**
```js
/所有float类型数据的精度是highp
precision highp float;
// 接收插值后的纹理坐标
varying vec2 v_TexCoord;
// 纹理图片像素数据
uniform sampler2D u_Sampler;
void main() {
  // 采集纹素，逐片元赋值像素值
  gl_FragColor = texture2D(u_Sampler,v_TexCoord);
}
```

## 彩色图转灰度图

### 亮度

灰度图颜色只有黑白两色，**灰度图颜色分量只有光亮度这一个分量**，黑色相当于没有光照，白色相当于最大光照强度。简单的说，`RGB` 分量越大，灰度图就越接近白色，具体的计算公式如下所示，`RGB`的系数之和为1，这样可以保证计算结果不会超过`WebGL`颜色分量默认的最大值1。
```js
亮度=0.3*R+0.5*G+0.2*B;
```
这里将彩色图转换为灰度图就需要在片元着色器中进行处理了。
```js
 //浮点数设置为中等精度
precision mediump float;
uniform sampler2D u_Texture;
varying vec2 v_Uv;
void main() {
  //采集纹素
  vec4 texture = texture2D(u_Sampler,v_Uv);
  //计算RGB三个分量光能量之和，也就是亮度
  float luminance = 0.3*texture.r+0.5*texture.g+0.2*texture.b;
  //逐片元赋值，RGB相同均为亮度值，用黑白两色表达图片的明暗变化
  gl_FragColor = vec4(luminance,luminance,luminance,1.0);
}
```

## 透明度融合
比如源颜色像素值是 `(R1,G1,B1,A1)`,目标颜色像素值是 `(R2,G2,B2,A2)`，融合后的像素值计算方法如下：
```js
R3 = R1 x A1 + R2 x (1 - A1)

R3 = G1 x A1 + G2 x (1 - A1)

R3 = B1 x A1 + B2 x (1 - A1)
```
如果后绘制的面不透明，相当于 `A1`等于1，代入上面的公式 `1 - A1` 就表示0，也就是说先绘制面的像素值被完全覆盖；如果后绘制的面完全透明，`A1` 是0，那么 `R1 x A1` 结果就是0， 也就是说绘制的面无论它是什么颜色，融合后的像素值就是后面物体的像素，也就是说后绘制的三角面你看不到它的存在。
```js
/**
 * 渲染管线α融合功能单元配置
 **/
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
```
## 1、什么是GLSL？

`GLSL` 的中文意思是 `OpenGL` 着色语言，英文全称是 `OpenGL Shading Language`，它是用来在 `OpenGL` 编写 **着色器程序** 的语言。

#### 1、着色器程序

着色器程序是在显卡（GPU）上运行的简短程序，代替 **`GPU`固定渲染管线** 的一部分，使 GPU 渲染过程中的某些部分允许开发者通过编程进行控制。**着色器程序允许我们通过编程来控制 `GPU` 的渲染。**

#### 2、渲染管线流程图

<img src="./images/webgl-渲染管线.png" alt="暂无数据" />

+ `uniform`数据和顶点缓存区
是`javascript`中传入的数据。
+ 顶点着色器
将接收到的顶点信息，绘制成对应的坐标。
+ 图元装配阶段
是将顶点数据装配成指定**图元类型**。如点、线、三角形。
+ 光栅化阶段
将图元内部区域用空像素填充。
+ 片元着色器
为图元内部的像素填充颜色信息。

## 1、内置变量
|  内置变量   | 含义  | 值数据类型
|  ----  | ----  | ----
| gl_PointSize  | 点渲染模式，正方形点区域渲染像素大小 | float
| gl_Position  | 顶点位置坐标 | vec4
| gl_FragColor  | 片元颜色值 | vec4
| gl_FragCoord  | 片元坐标，单位像素 | vec2
| gl_PointCoord  | 点渲染模式对应点像素坐标 | vec2
### 1、gl_PointSize
内置变量 `gl_PointSize` 主要是用来设置顶点渲染出来的方形点像素大小。值是一般是在绘制函数 `gl.drawArrays()` 绘制模式是点模式 `gl.POINTS` 的时候使用。
```js
void main() {
  //给内置变量gl_PointSize赋值像素大小，注意值是浮点数
  gl_PointSize=10.0;
}

//绘制函数绘制模式：点gl.POINTS
/*
gl.POINTS表示绘制类型，0表示从第1个数据开始绘制，4表示绘制4个点
*/
gl.drawArrays(gl.POINTS,0,4);
```
### 2、gl_Position
`gl_Position` 内置变量表示最终传入片元着色器片元化要使用的顶点位置坐标。如果有多个顶点，每个顶点都要执行一遍顶点着色器主函数`main` 中的程序。
```js
attribute a_posotion;
void main(){
    //逐顶点处理数据
    gl_Position = apos;
}
```
**顶点传递数据**
```js
const aposLocation = gl.getAttribLocation(program,'a_posotion');
//类型数组构造函数Float32Array创建顶点数组
const data=new Float32Array([0.5,0.5,-0.5,0.5,-0.5,-0.5,0.5,-0.5]);
//创建缓冲区对象
const buffer=gl.createBuffer();
//绑定缓冲区对象,激活buffer
gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
//顶点数组data数据传入缓冲区
gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
//缓冲区中的数据按照一定的规律传递给位置变量apos
gl.vertexAttribPointer(aposLocation,2,gl.FLOAT,false,0,0);
//允许数据传递(这句代码放在能获取到aposLocation的任意位置都可以)
gl.enableVertexAttribArray(aposLocation);
```
### 3、gl_FragColor
`gl_FragColor` 内置变量主要用来设置片元像素的颜色，出现的位置是片元着色器语言的 `main` 函数中。包含 4 个分量 `(R, G, B, A)`，各个颜色分量的取值范围是`【0，1】`，也不同于我们常规颜色的`【0，255】`取值范围，所以当我们给 `gl_FragColor` 赋值时，也需要对其进行转换。平常我们所采用的颜色值`（R, G, B, A）`，对应的转换公式为： `(R值/255，G值/255，B值/255，A值/1）`。
```js
  void main() {
    // 设置片元颜色为红色
    gl_FragColor = vec4(1.0,1.0,0.0,1.0);
  }
```
**纹理采样**
```js
// 接收插值后的纹理坐标
varying vec2 v_TexCoord;
// 纹理图片像素数据
uniform sampler2D u_Sampler;
void main() {
  // 采集纹素，逐片元赋值像素值
  gl_FragColor = texture2D(u_Sampler,v_TexCoord);
}
```
### 4、gl_PointCoord
渲染点片元坐标。一个顶点渲染为一个正方形区域，每个正方形区域以正方向区域的左上角建立一个直角坐标系，然后使用内置变量`gl_PointCoord` 描述正方形区域中像素或者说片元的坐标，比如正方形区域的左上角坐标是 `(0.0,0.0`),正方形区域几何中心坐标是 `(0.5,0.5)`，右下角坐标是`(1.0,1.0)`。 图片来源于网络

<img src="./images/PointCoord.png" />

**`gl_PointCoord` 在片元着色器中的应用** 
```js
precision lowp float;
void main(){
    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
    //根据距离设置片元
    if(r < 0.5){
        // 正方形区域片元距离几何中心半径小于0.5，像素颜色设置红色
        gl_FragColor = vec4(1.0,0.0,0.0,1.0);
    }else {
        // 正方形区域距离几何中心半径不小于0.5的片元剪裁舍弃掉：
        discard;
    }
}
```
下面是使用 `gl_pointCoord`裁剪成 **圆形** 的图片和没有被裁减的 **正方形** 的图片对比情况。
<div style='text-align:center'>
<img src="./images/PointCoord-正方形.png" width='300' /><img src="./images/PointCoord-圆形.png" width='300' />
</div>

### 5、gl_FragCoord
内置变量 `gl_FragCoord` 表示 `WebGL` 在 `canvas` 画布上渲染的所有片元或者说像素的坐标。坐标原点是 `canvas` 画布的左上角，水平向右方向是 `x` 轴正向，竖直向下方向为 `y` 轴正方向。，`gl_FragCoord` 坐标的单位是像素，`gl_FragCoord` 的数据类型是`vec2`, 通过 `gl_FragCoord.x`、`gl_FragCoord.y` 可以分别访问片元坐标的纵横坐标。

**`gl_FragCoord` 在片元着色器中的应用** 
```js
void main(){
    // 根据片元的x坐标，来设置片元的像素值
    if(gl_FragCoord.x < 200.0){
        //默认为 canvas原来的颜色
    }
    else if (gl_FragCoord.x < 250.0) {
        // canvas画布上[0,300)之间片元像素值设置
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else if (gl_FragCoord.x <= 300.0) {

        // canvas画布上(300,400]之间片元像素值设置 绿色
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    } else {
        // canvas画布上(400,500]之间片元像素值设置 蓝色
        gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
    }
}
```
结果如下图所示：
<img src="./images/gl_FragCoord.png" width='400' />



## 2、attribute和uniform以及varying的区别
`attribute` 和 `uniform` 关键字的目的主要是为了 `javascript` 语言可以通过相关的WebGL API把一些数据传递给着色器。而`varying` 主要是将顶点着色器中的数据传递给片元着色器。
| 变量类型 | 数据传递方向 | 作用
| ---- | ---- | ----
| attribute  | 从js脚本中传递到顶点着色器 | 在顶点着色器中声明跟顶点相关的数据
| uniform  | 从js脚本中传递到顶点、片元着色器 | 在着色器中声明非顶点数据(如光源位置数据、方向数据、矩阵数据)
| varying  | 从顶点着色器传递到片元着色器 | 在顶点着色器中声明需要差值计算的顶点数据

`varying`数据，需要同时在顶点着色器和片元着色器中声明。`varying` 类型变量主要是为了完成顶点着色器和片元着色器之间的数据传递和插值计算
**在顶点着色器**
```js
attribute vec4 a_color;// attribute声明顶点颜色变量
varying vec4 v_color;//varying声明顶点颜色插值后变量
void main() {
  //顶点颜色插值计算
  v_color = a_color;
}
```
**片元着色器**
```js
// 接收顶点着色器中v_color数据
varying vec4 v_color;
void main() {
  // 插值后颜色数据赋值给对应的片元
  gl_FragColor = v_color;
}
```

## 3、enable
用于启用各种功能。功能由参数决定。与 `disable` 相对应。`disable` 是用来关闭的。两个函数参数取值是一至的。参数主要有以下这些：

```js
gl.DEPTH_TEST：启用深度测试。
根据坐标的远近自动隐藏被遮住的图形
gl.CULL_FACE：启用隐藏图形材料的面
gl.BLEND：激活片元的颜色融合计算
```


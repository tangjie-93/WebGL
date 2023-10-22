## 1.视点和视线
三维物体跟二维物体的显著区别就是，三维物体具有深度，也就是 `z` 轴。我们最终把三维场景绘制到屏幕上，并以一个观察者的身份去看待三维场景。为了定义一个观察者。我们需要考虑以下两点：
+ 观察方向，也就是观察者自己在什么位置，在看场景的那一部分。
+ 可视距离，也就是观察者能看多远。

三维世界中，我们将观察者的位置称之为**视点**，从视点出发沿着观察方向的射线我们称之为**视线**。在 `WebGL`系统中，默认情况下，视点位于原点`(0,0,0)`,视线为`z`轴负半轴，指向屏幕内部的方向。

## 2.视点、观察目标和上方向
+ **视点**：观察者所在的三维空间位置，视线的起点，一般用`Pe（ex,ey,ez）` 来表示。
+ **观察目标点**：被观察的目标所在的点，视线从视点出发，穿过目标点并继续延伸。只有同时知道观察目标点和视点，才能算出视线方向。观察目标点的坐标一般用`T(tx,ty,tz)`表示。
+ **上方向**：最终绘制在屏幕上的影像中的向上的方向,也成为相机上方方向。因为观察者还是可以以视线为旋转轴的，如果旋转旋转轴观察者看到的场景也会偏移。上方向一般用`upDirection(ux,uy,uz)`表示。

在`WebGL`中，我们可以用上面三个矢量创建一个**视图矩阵**

视图矩阵的目的是改变观察者看到的三维场景。本质上其实还是将三维场景里面的模型进行的移动操作。

实际上，**根据自定义的观察者状态，绘制观察者看到的景象**与**使用默认的观察状态，对三维对象进行平移、旋转等变换，再绘制观察者看到的景象**这两种行为是等价的。
下面我们将推导一下**视图矩阵**的计算过程。

一般情况下我们是通过求解观察坐标系到世界坐标系的观察矩阵之后，通过**逆矩阵**的方式求出 世界坐标系到观察坐标系的**视图矩阵**。


我们可以通过逆矩阵的方式来

#### 1.相机坐标系原点在世界坐标系中的位置为 `Pe(ex,ey,ez)`。
#### 2.求解相机坐标系的基向量在世界坐标系中的表示
从相机位置看像目标位置的方向称为观察方向，观察方向可以看做相机坐标系的 Z 轴方向，那么世界坐标系的 **Z轴基向量方向**可以这样求出：

```js
zAxis = Pe - T 
      =(ex-tx,ey-ty,ez-tz)  
```
有了 `Z` 轴方向向量 `zAxis`和临时 `Y` 轴 方向 `upDirection`，我们就可以利用向量叉乘来计算 X 轴方向了。
```js
xAxis = zAxis x upDirection
```
计算出 `X` 轴方向之后，我们需要将 `xAxis` 和 `zAxis` 归一化，得到它们的基向量,要求一遍 `Y` 轴的方向向量。

因为 `upDirection` 是我们一开始假想的，只是为了求解 `X` 轴方向，`upDirection` 和 `zAxis` 不一定是垂直关系。

仍然利用向量叉乘求解 Y 轴方向：
```js
yAxis=zAxis×xAxis
```
将 `xAxis(xx, xy, xz)、yAxis(yx, yy, yz)、zAxis(zx, zy, zz)`以及相机位置 `Pe(ex, ey, ez)` 代入矩阵变换框架，可以求得相机坐标系变换到世界坐标系的矩阵，称之为**相机矩阵**。
<img src='../../images/相机矩阵.png'>

通过对相机矩阵，求逆矩阵就可以得到我们的**视图矩阵**。

下面是**相机矩阵**算法实现。
#### 1. 求出`Z` 轴基向量，即观察方向：
```js
function lookAt(cameraPosition, target, upDirection){
    const zAxis  = (Vector3.subtractVectors(cameraPosition, target)).normalize();
}
```
#### 2. 根据 `zAxis` 和 `upDireciton` 求出 `X` 轴基向量：
```js
const xAxis = (Vector3.cross(upDirection, zAxis)).normalize();
```
#### 3. 处理 `zAxis` 和 `upDirection` 平行的情况：
```js
if(xAxis.length() == 0){
    if (Math.abs(upDirection.z == 1)) {
      zAxis.x += 0.0001;
    } else {
      zAxis.z += 0.0001;
    }
    zAxis.normalize();
    xAxis = Vector3.cross(upDirection, zAxis).normalize();
}
```

#### 4.根据 zAxis 和 xAxis ，重新计算Y轴基向量 yAxis：
```js
const yAxis = (Vector3.cross(zAxis, xAxis)).normalize();
```
#### 5.相机矩阵的实现
也就是**相机坐标系**的坐标通过🈶️乘该矩阵可以到其在**世界坐标系**下的坐标。
```js
function lookAt(cameraPosition, target, up) {
    const zAxis = normalize(
        subtractVectors(cameraPosition, target));
    const xAxis = normalize(cross(up, zAxis));
    const yAxis = normalize(cross(zAxis, xAxis));
 
    return new Float32Array([
       xAxis[0], xAxis[1], xAxis[2], 0,
       yAxis[0], yAxis[1], yAxis[2], 0,
       zAxis[0], zAxis[1], zAxis[2], 0,
       cameraPosition[0],
       cameraPosition[1],
       cameraPosition[2],
       1,
    ]);
}
```
#### 6.观察矩阵的实现
对相机矩阵求逆，就可以得到视图矩阵了，世界坐标系下的坐标通过右乘该矩阵，就可以得到其在相机坐标系下的坐标。
```js
const cameraMatrix = matrix.lookAt(cameraPosition, target, upDirection);
const viewMatrix = matrix.inverse(cameraMatrix);
```
下面是推导过程中用到的一些基本方法
+ 归一化
```js
function normalize(v) {
  const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // 确定不会除以 0
  if (length > 0.00001) {
    return [v[0] / length, v[1] / length, v[2] / length];
  } else {
    return [0, 0, 0];
  }
}
```
+ 向量相减
```js
function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
```
+ 向量的叉乘
```js
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]];
}
```

**参考文档**
[相机矩阵的推导](https://juejin.cn/book/6844733755580481543/section/6844733755941191694)
[WebGL三维相机](https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-3d-camera.html)


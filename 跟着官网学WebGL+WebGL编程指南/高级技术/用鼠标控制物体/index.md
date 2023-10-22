通过监听鼠标的移动情况来创建旋转矩阵，更新模型视图投影矩阵，并对顶点坐标进行变换。
## 1.如何实现物体旋转
在**鼠标左键按下时**记录鼠标的初始坐标，然后在**鼠标移动**的时候用当前坐标减去初始坐标，获得鼠标的位移，然后根据这个位移来计算旋转矩阵。
具体实现过程如下面代码所示。
主要看鼠标事件的代码实现过程。
```js
function initEventHandlers(canvas, currentAngle) {
  let dragging = false;         // Dragging or not
  let lastX = -1, lastY = -1;   // Last position of the mouse
  // 鼠标按下的事件
  canvas.onmousedown = function(ev) {   // Mouse is pressed
    const x = ev.clientX, y = ev.clientY;
    // Start dragging if a moue is in <canvas>
    const rect = ev.target.getBoundingClientRect();
    // 判断鼠标位置是否在canvas内部
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
      lastX = x; lastY = y;
      dragging = true;
    }
  };
  // 鼠标释放事件
  canvas.onmouseup = function(ev) { dragging = false;  }; // Mouse is released
  // 鼠标移动事件
  canvas.onmousemove = function(ev) { // Mouse is moved
    const x = ev.clientX, y = ev.clientY;
    if (dragging) {
      // 旋转缩放因子
      const factor = 100/canvas.height; // The rotation ratio
      const dx = factor * (x - lastX);
      const dy = factor * (y - lastY);
      // Limit x-axis rotation angle to -90 to 90 degrees
      // 限制x轴的旋转角度
      currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
      currentAngle[1] = currentAngle[1] + dx;
    }
    lastX = x, lastY = y;
  };
}

```
具体的`demo`地址为 `./demo/index-限制x轴的旋转角度.html` 。
上面的例子有一定的缺陷，就是它在`x`轴的旋转角度范围为`-90~90`,超过这个范围，旋转行为就会异常。

下面我们用四元数的方式来实现模型的旋转，并且保证物体选轴后才会去绘制模型。下面是监听鼠标事件主要的实现代码。
```js
let lastMouseX = 0, lastMouseY = 0;
let offsetX = 0, offsetY = 0;
let mousedown = false;
function rotate(gl, canvas, program) {
    let lastQ = new Quaternion();
    let currentQ = new Quaternion();
    canvas.addEventListener('mousedown', (event) => {
        mousedown = true;
        const { clientX, clientY } = event;
        lastMouseX = clientX;
        lastMouseY = clientY;
        canvas.addEventListener('mousemove', (event) => {
            if (!mousedown) return;
            const { clientX, clientY } = event;
            offsetX = (clientX - lastMouseX);
            offsetY = (clientY - lastMouseY);
            let l = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
            if (l == 0) {
                return;
            }
            let tempQ = Quaternion.fromRotation(
                { x: offsetY / l, y: offsetX / l, z: 0 },
                l / 2
            );
            currentQ = Quaternion.multiplyQuaternions(tempQ, lastQ);
            mvp = Quaternion.makeRotationFromQuaternion(currentQ);
            render(gl, program);
        })
        canvas.addEventListener('mouseup', () => {
            mousedown = false;
            // matrix.cloneMatrix(mvp, lastMatrix);
            Object.assign(lastQ, currentQ);
        })
    })
}
```
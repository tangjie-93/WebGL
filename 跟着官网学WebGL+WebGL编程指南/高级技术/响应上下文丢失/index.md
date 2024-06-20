## 1.响应上下文丢失
`WebGL`使用了计算机的图形硬件，这部分资源是被操作系统管理的，由包括浏览器在内的多个应用程序共享。在某些特殊情况下，如另一个程序接管了图形硬件，或者是操作系统进入休眠，浏览器就会失去使用这些资源的权利，同时导致存储在硬件中的数据丢失，同时`WebGL`上下文就会丢失。
## 2.如何处理响应上下文丢失。
`WebGL`提供了两个事件来处理这种情况。上下文丢失事件`(webglcontextlost)`和上下文恢复事件`(webglcontextrestored)`。

当`WebGl`上下文丢失的时候,`gl`对象就会失效，在`gl`上面的所有操作也都会失效，当浏览器重置`WebGL`系统后，就会触发上下文恢复事件。

具体的代码如下所示。
```js
...
function main() {
  // Retrieve <canvas> element
  const canvas = document.getElementById('webgl');

  // Register event handler for context lost and context restored events
  canvas.addEventListener('webglcontextlost', contextLost, false);
  canvas.addEventListener('webglcontextrestored', function(ev) { start(canvas); }, false);

  start(canvas);   // Perform WebGL related processes
}
...
function contextLost(ev) { // Event Handler for context lost event
  cancelAnimationFrame(g_requestID); //  停止动画
  ev.preventDefault();  // 阻止默认行文
}
```
上下文丢失事件的响应函数只有短短的两行，一个是停止调用产生动画的函数，停止物体的绘制。第二个是阻止浏览器对该事件的默认处理行为。因为浏览器对于上下文丢失的默认处理行为是，不再触发上下文恢复行为。
[demo地址](./上下文丢失.html)
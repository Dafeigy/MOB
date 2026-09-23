# ParticleField 开发参考

本文档说明项目当前使用的 `ParticleField` Canvas 粒子组件，供后续页面开发、视觉调参和性能排查参考。

实现位置：

- [components/ui/particle-fields.tsx](../components/ui/particle-fields.tsx)
- 登录页使用：[app/login/page.tsx](../app/login/page.tsx)
- Waitlist 使用：[components/views/waitlist-view.tsx](../components/views/waitlist-view.tsx)

## 1. 组件定位

`ParticleField` 会读取一张源图片，将符合条件的像素转换为粒子，并在 Canvas 中持续绘制。粒子不是静态点阵，而是通过弹簧、阻尼、鼠标排斥和轻微漂移保持动态效果。

组件适合用于：

- 登录页或落地页背景视觉
- 实验性页面的主题插图
- 图片之间的柔和 morph 过渡
- 与键盘输入或表单提交关联的反馈动画

它是装饰性视觉组件，不承载业务数据，也不应作为信息传达的唯一渠道。

## 2. 最小用法

```tsx
import { ParticleField } from "@/components/ui/particle-fields"

<ParticleField
  src="/particle-brain.png"
  className="size-full"
/>
```

源图片应放在 `public/` 下，并通过绝对路径引用，例如：

```tsx
src="/particle-brain.png"
```

组件会自动填满父容器，因此父容器必须具有明确的宽度和高度。

## 3. Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | ---: | --- |
| `src` | `string` | 必填 | 源图片路径。变化时会触发粒子 morph。 |
| `sampleStep` | `number` | `3` | 图片采样间隔。越小粒子越密，计算量越大。 |
| `threshold` | `number` | `50` | 亮度阈值，范围约为 `0–255`。越大保留的像素越少。 |
| `renderScale` | `number` | `1` | 源图相对容器的缩放比例。大于 1 会放大并裁切，低于 1 会缩小。 |
| `dotSize` | `number` | `1.15` | 粒子基础半径，单位为设备像素。 |
| `mouseForce` | `number` | `90` | 鼠标排斥强度。 |
| `mouseRadius` | `number` | `110` | 鼠标影响半径，单位为 CSS 像素。 |
| `spring` | `number` | `0.035` | 粒子回到目标位置的弹簧强度。 |
| `damping` | `number` | `0.86` | 速度阻尼。越低越“粘”，越高越有惯性。 |
| `align` | `"center" \| "bottom"` | `"center"` | 粒子图形在容器中的垂直对齐方式。 |
| `color` | `string` | 白色 | `adaptToTheme=false` 时使用的颜色。 |
| `invert` | `boolean` | `false` | 是否采样暗像素而不是亮像素。 |
| `adaptToTheme` | `boolean` | `true` | 根据 `html.dark` 自动切换粒子颜色。 |
| `typingImpulseRef` | `MutableRefObject<number>` | 无 | 外部输入脉冲。组件每帧会自动衰减它。 |
| `denseParticles` | `boolean` | `false` | 保留所有超过阈值的像素，适合小尺寸固定图形。 |
| `maxParticles` | `number` | `24000` | 每次采样允许生成的最大粒子数。 |
| `className` | `string` | 无 | 应用到外层容器的 class。 |

## 4. 图片采样流程

采样发生在离屏 Canvas 中：

1. 根据容器尺寸和源图比例计算 `cover` 布局。
2. 根据 `sampleStep` 缩放到采样尺寸。
3. 读取每个采样像素的 RGBA 值。
4. 丢弃透明度低于 `200` 的像素。
5. 根据亮度和 `threshold` 丢弃不符合条件的像素。
6. 非 `denseParticles` 模式下，对中间亮度像素进行随机稀疏化。
7. 如果结果超过 `maxParticles`，使用 reservoir sampling 保持代表性并截断数量。

每个目标粒子会记录：

- 目标位置
- 粒子尺寸
- 透明度
- 当前坐标和速度
- 独立闪烁相位
- morph 时使用的弹簧抖动系数

## 5. 动画和交互机制

每一帧粒子会依次受到以下影响：

### 弹簧回位

粒子被拉回采样得到的目标位置：

```text
velocity += (origin - position) * spring * springJitter
```

### 阻尼

```text
velocity *= damping
```

### 鼠标排斥

鼠标进入组件后，半径范围内的粒子会被推开。鼠标离开时，粒子依靠弹簧力返回原位。

### 自然漂移和闪烁

每个粒子拥有独立 phase，通过正弦函数产生轻微漂移和透明度变化，避免所有粒子同步运动。

### 图片 morph

当 `src` 改变时：

- 现有粒子会随机匹配新的目标位置。
- 多余粒子会逐渐淡出并被移除。
- 新增粒子会在目标附近的随机环上生成，再弹簧聚拢。

这种随机配对可以避免粒子按照图片扫描顺序形成明显的斜向扫动。

## 6. 输入脉冲 API

组件提供三个辅助函数：

```tsx
import {
  bumpParticleTypingImpulse,
  pulseParticleSubmitImpulse,
  pulseParticleTypingImpulse,
} from "@/components/ui/particle-fields"
```

### 键盘输入

```tsx
const typingImpulse = useRef(0)

useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
    bumpParticleTypingImpulse(typingImpulse, event)
  }

  window.addEventListener("keydown", onKeyDown)
  return () => window.removeEventListener("keydown", onKeyDown)
}, [])

<ParticleField typingImpulseRef={typingImpulse} src="/particle-brain.png" />
```

`repeat`、`Tab`、`Escape` 以及带有 Meta/Ctrl/Alt 的快捷键不会产生脉冲。

### 表单提交

```tsx
pulseParticleSubmitImpulse(typingImpulse)
```

提交脉冲包含一次主脉冲和约 `120ms` 后的一次较弱跟随脉冲，效果类似柔和的“发射”。

## 7. 性能约束

Canvas 会对每个粒子执行物理计算和绘制，因此粒子数是最重要的性能因素。

推荐配置：

| 场景 | 建议 |
| --- | --- |
| 大面积背景 | `sampleStep={4}` 或 `5`，`maxParticles` 控制在 `12000–24000` |
| 小尺寸固定图形 | 可使用 `denseParticles`，但仍应保留 `maxParticles` |
| 低端设备或 Tauri WebView | 提高 `sampleStep`，降低 `dotSize` 和鼠标交互范围 |
| 主要展示静态图形 | 确保用户开启 reduced-motion 时不会持续运行 RAF |

当前实现已经包含：

- 粒子数量上限
- 页面不可见时暂停动画
- `prefers-reduced-motion` 支持
- resize 采样防抖
- Canvas DPR 上限为 `2`

## 8. 可访问性和主题

粒子是纯装饰内容，外层容器使用 `aria-hidden="true"`。页面的重要信息必须通过普通文本、语义 HTML 或可访问控件提供。

默认主题行为：

- `html.dark` 存在时使用浅色粒子。
- 非 dark 模式使用深色粒子。
- `adaptToTheme={false}` 时使用 `color` 指定的颜色。

组件会监听 `html` 的 class 变化，因此切换主题不会重新采样图片，只会改变绘制颜色。

## 9. Web 和 Tauri 使用注意事项

`ParticleField` 位于共享组件目录，可以被 Web App Router 页面和 Tauri Vite 页面共同使用。

新增使用位置时应确认：

1. 图片资源放在根目录 `public/`，不要只放在 Next 专属目录。
2. 父容器在 Web 和 Tauri 中都有实际高度。
3. 组件所在页面在两端都能通过各自路由访问。
4. 窄窗口下粒子图形不会遮挡主要内容。
5. 修改共享组件后同时运行 Web 和 Tauri 构建。

推荐验证命令：

```bash
npm run lint
npm run build
npm run desktop:build
```

## 10. 扩展时的注意事项

如果新增采样相关参数，需要同时完成三件事：

1. 添加到 `ParticleFieldProps`。
2. 使用 ref 传递给 Canvas effect，避免每次 render 拆除动画循环。
3. 加入采样参数 effect 的依赖，使当前图片重新生成目标粒子。

如果新增纯动画参数，只需通过 ref 在 render loop 中读取，不应导致 Canvas effect 重建。

修改动画调度时，要同时考虑：

- 页面隐藏和恢复
- `prefers-reduced-motion` 动态切换
- 图片异步加载完成后的首次绘制
- ResizeObserver 回调
- 组件卸载时取消 RAF 和解绑事件


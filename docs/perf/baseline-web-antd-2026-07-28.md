# web-antd 构建基线（2026-07-28）

> Phase 1 Task 10 交付。基于 `pnpm -F @vben/web-antd run build:analyze` 采集（rollup-plugin-visualizer，上游已集成）。作为后续 Bundle 优化的基线参照。

## 采集环境

- 日期：2026-07-28
- 命令：`pnpm -F @vben/web-antd run build:analyze`（`vite build --mode analyze`，`VITE_VISUALIZER=true`）
- 构建工具：Vite v8.0.10（rolldown 后端）
- 构建耗时：8m 27s
- visualizer 报告：`apps/web-antd/node_modules/.cache/visualizer/stats.html`（7.5 MB，不入库，本地查看）

## 总规模

| 指标         | 值    |
| ------------ | ----- |
| dist 总大小  | 30 MB |
| dist/js 大小 | 23 MB |
| JS chunk 数  | 1 936 |

## 大体积 chunk（>100 KB，优化重点）

| 语义名           | 体积 (KB) | 推测来源         |
| ---------------- | --------- | ---------------- |
| use-echarts      | 1 361.86  | echarts 图表     |
| index.es         | 1 064.09  | 待定位           |
| es               | 912.48    | 待定位           |
| utils            | 881.68    | 待定位           |
| router           | 874.83    | 路由聚合         |
| card-bubble      | 721.58    | IM 卡片气泡      |
| wx-video-play    | 642.82    | 微信视频播放     |
| gantt-chart      | 609.14    | 甘特图（dhtmlx） |
| right            | 581.45    | 待定位           |
| workflow-design  | 542.85    | 工作流设计器     |
| toolbar          | 528.94    | 工作流工具栏     |
| ProcessDesigner  | 516.36    | 流程设计器       |
| wx-voice-play    | 443.10    | 微信语音播放     |
| jse/index        | 404.03    | JS 表达式引擎    |
| basic            | 291.76    | 待定位           |
| vxe-table        | 235.05    | vxe-table        |
| preview-code     | 231.52    | 代码预览         |
| lib              | 211.55    | 待定位           |
| movecanvas       | 200.46    | 画布移动（bpmn） |
| src              | 196.07    | 待定位           |
| vuedraggable.umd | 176.93    | 拖拽             |
| request          | 153.55    | 请求封装         |
| use-vben-form    | 149.07    | 表单             |
| routes           | 144.47    | 路由             |
| form-create      | 138.09    | 动态表单         |
| auth             | 119.69    | 鉴权             |

> 语义名为去 hash 后的文件名；"待定位"项可在 stats.html 中按 chunk 查看模块构成。

## 构建警告

1. **INEFFECTIVE_DYNAMIC_IMPORT**：`src/views/im/home/store/groupRequestStore.ts` 同时被动态与静态 import → 动态导入失效，模块未拆入独立 chunk。需统一为单一导入方式。
2. **PLUGIN_TIMINGS**：插件耗时占比高 —— `unplugin-vue-i18n:resource`（56%）、`vite:tailwind-reference`（38%）。是构建慢（8m27s）的主因。

## Phase 2 优化方向（基线对照）

- echarts（1.36 MB）：按需引入 / tree-shake，或评估更轻量图表库。
- 微信视频/语音（card-bubble + wx-video-play + wx-voice-play ≈ 1.8 MB）：评估使用频率，低频路由懒加载或按需裁剪。
- 工作流/流程设计器（workflow-design + toolbar + ProcessDesigner + movecanvas ≈ 1.8 MB）：确认路由级懒加载。
- 甘特图 gantt-chart（609 KB）：dhtmlx-gantt 体积大，评估必要性。
- 统一 groupRequestStore 导入方式，消除 INEFFECTIVE_DYNAMIC_IMPORT。
- 构建提速：排查 i18n / tailwind 插件耗时（56% + 38%）。

## 复测方式

```bash
pnpm -F @vben/web-antd run build:analyze
# 打开 apps/web-antd/node_modules/.cache/visualizer/stats.html
```

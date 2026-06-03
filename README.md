# 🐰 兔兔-阿米娅 — Live2D 桌面宠物

基于 **Tauri v2 + PixiJS + Live2D Cubism 3.0** 的桌面宠物程序，角色为明日方舟「阿米娅」同人模型，支持表情切换和位置/大小自定义。

> 模型来源：Bilibili VTube Studio 模型「兔兔-阿米娅」

---
## ✨ 功能

- **透明悬浮窗口** — 无边框、始终置顶、点击穿透，角色悬浮在桌面最上层
- **Live2D 实时渲染** — 加载 `.model3.json`，支持物理模拟与呼吸动画
- **鼠标跟随** — 头部/眼睛跟随鼠标位置
- **拖拽移动** — 按住左键拖拽角色到屏幕任意位置
- **独立控制面板** — 模型与控制面板分离为两个窗口
  - **模型设置** Tab：缩放（0.2× ~ 3×）、水平偏移、垂直偏移、一键重置
  - **动画** Tab：18 个表情（生气/悲伤/害羞/震惊/饥饿/手持道具/特效标记），点击即切
- **设置持久化** — 大小和偏移通过 `localStorage` 保存，重启后保留

---

## 📦 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Tauri v2 |
| 前端 | TypeScript + Vite |
| 渲染引擎 | PixiJS v6 + pixi-live2d-display |
| Live2D 运行时 | Cubism Core for Web |
| 窗口通信 | Tauri 事件系统 (`emitTo` / `listen`) |

---

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) (MSVC toolchain)
- Windows 10+ 或 macOS

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/oawdji/desktop-pet.git
cd desktop-pet

# 2. 安装前端依赖
npm install

# 3. 开发模式启动
npx tauri dev
```

启动后会自动弹出两个窗口：
- **模型窗口**：透明悬浮的阿米娅
- **控制面板**：设置模型大小/位置 + 切换表情

---

## 📁 项目结构

```
desktop-pet/
├── index.html                 # 模型窗口页面
├── control.html               # 控制面板页面
├── src/
│   ├── main.ts                # 入口
│   ├── app.ts                 # 模型窗口逻辑（渲染 + 跟随 + 事件监听）
│   ├── control.ts             # 控制面板逻辑（Tab / 滑块 / 表情按钮）
│   └── style.css              # 全局样式
├── src-tauri/
│   ├── Cargo.toml             # Rust 依赖
│   ├── tauri.conf.json        # Tauri 窗口配置
│   ├── src/
│   │   ├── main.rs            # Rust 入口
│   │   └── lib.rs             # 创建控制面板窗口
│   └── icons/                 # 应用图标
├── public/
│   ├── live2dcubismcore.min.js  # Cubism Core 运行时
│   └── model/                   # 模型文件
│       ├── core/                # .model3.json / .moc3 / .physics3.json
│       ├── expressions/         # 18 个表情 (.exp3.json)
│       ├── motions/             # 6 个动画 (.motion3.json)
│       ├── textures/            # 贴图
│       ├── config/              # VTube / PrPrLive 配置
│       └── items/               # 物品挂载配置
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🎮 模型资源

| 类型 | 数量 | 说明 |
|------|------|------|
| 表情 | 18 个 | 生气 / 悲伤 / 害羞×3 / 悲伤脸 / 震惊脸 / 饥饿嘴 / 手持×3 / 特效×6 / 脱外套 |
| 动画 | 6 个 | 庆祝 / 脱衣服 / 键盘 / 音乐 / 武器 / 重置 |

---

## 🚧 项目进度 & 路线图

> 项目目前处于 **框架搭建完成** 阶段，后续将持续迭代。

| 阶段 | 内容 | 状态 |
|------|------|------|
| ✅ 基础框架 | Tauri v2 + PixiJS + Live2D 渲染、透明悬浮窗口、拖拽、鼠标跟随 | 已完成 |
| ✅ 表情系统 | 18 个表情特效、独立控制面板 Tab 切换 | 已完成 |
| ✅ 模型设置 | 自定义大小、位置偏移、持久化存储 | 已完成 |
| 🚧 LLM 接入 | 接入大语言模型，实现文本对话功能 | 开发中 |
| 🔜 语音版 | 语音识别 (ASR) + 语音合成 (TTS) 交互 | 后续另开版本 |

### 关于语音功能

市面上大多数桌宠内存占用较高（通常 200MB+）。本项目定位**轻量级**桌面宠物，当前版本保持极简体积（打包后约 5MB，运行时 ~50MB）。语音识别和语音输出需要引入额外的模型或服务，会使体积和内存显著增加，因此计划在后续**单独开设一个带语音的版本**，主版本专注于轻量体验。

---

## 📝 开发说明

控制面板通过 Tauri 事件系统与模型窗口通信：

```typescript
// 控制面板 → 模型窗口
import { getCurrentWindow } from '@tauri-apps/api/window';
getCurrentWindow().emitTo('main', 'pet:expr', 'emote-shy');

// 模型窗口监听
appWindow.listen('pet:expr', ({ payload }) => {
  model.expression(payload);
});
```

---

## 📄 License

MIT

模型文件下载链接https://www.aplaybox.com/details/model/XieIXWh6Noz1，仅供学习交流使用，感谢作者大大。
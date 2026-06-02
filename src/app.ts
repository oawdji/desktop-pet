/**
 * 兔兔-阿米娅 桌面宠物
 * 模型窗口（透明悬浮）
 * Live2D 渲染 | 鼠标跟随 | 拖拽移动
 *
 * 控制面板为独立窗口 control.html，通过 Tauri 事件与本窗口通信：
 * - pet:settings      { scale, offsetX, offsetY }
 * - pet:expr          string (expression name)
 * - pet:expr-clear    void
 */
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display/cubism4';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

// =====================================================
//  1. 持久化设置
// =====================================================
type PetSettings = { scale: number; offsetX: number; offsetY: number };

function loadSettings(): PetSettings {
  const raw = localStorage.getItem('pet-settings');
  if (raw) return JSON.parse(raw) as PetSettings;
  return { scale: 1, offsetX: 0, offsetY: 0 };
}

function saveSettings(s: PetSettings) {
  localStorage.setItem('pet-settings', JSON.stringify(s));
}

// =====================================================
//  2. 初始化 PixiJS
// =====================================================
const W = 400;
const H = 500;

const app = new PIXI.Application({
  width: W,
  height: H,
  transparent: true,
  backgroundAlpha: 0,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.getElementById('app')!.appendChild(app.view as HTMLCanvasElement);
Live2DModel.registerTicker(PIXI.Ticker);
// 移除右键所有功能：禁用默认右键菜单
document.addEventListener('contextmenu', (e) => e.preventDefault());

// =====================================================
//  5. 加载模型
// =====================================================
;(async () => {
  console.log('[Pet] 加载模型中...');

  let model: Live2DModel;
  try {
    model = await Live2DModel.from('model/core/兔兔-阿米娅.model3.json');
  } catch (err) {
    console.error('[Pet] 模型加载失败:', err);
    document.getElementById('app')!.innerHTML =
      '<div style="color:white;padding:20px;text-align:center;font-family:sans-serif">' +
      '模型加载失败<br/><small>请确认 public/model/ 目录完整</small></div>';
    return;
  }

  console.log('[Pet] 模型加载成功!', model.width, 'x', model.height);

  // Canvas origin
  const raw = (model as any).internalModel;
  const cInfo = raw?.coreModel?._canvasInfo ?? raw?.canvasInfo;
  const ox0 = (cInfo?.CanvasOriginX ?? 0);
  const oy0 = (cInfo?.CanvasOriginY ?? 0);

  // 初始缩放计算
  const baseScale = Math.min((W * 0.9) / (model.width || 1000), (H * 0.85) / (model.height || 1000));

  model.anchor.set(0.5, 0.5);
  app.stage.addChild(model);

  // =====================================================
  //  6. 设置应用（来自 localStorage / 控制面板窗口）
  // =====================================================
  const applySettingsToModel = (s: PetSettings) => {
    const sc = baseScale * s.scale;
    model.scale.set(sc);
    model.x = W / 2 - ox0 * sc + s.offsetX;
    model.y = H / 2 - oy0 * sc + s.offsetY;
  };

  // 初始应用
  applySettingsToModel(loadSettings());

  // 控制面板推送设置
  await listen<PetSettings>('pet:settings', (event) => {
    const s = event.payload;
    saveSettings(s);
    applySettingsToModel(s);
  });

  // 控制面板触发表情
  await listen<string>('pet:expr', (event) => {
    try {
      model.expression(event.payload);
    } catch {
      /* ignore */
    }
  });
  await listen('pet:expr-clear', () => {
    try {
      (model as any).expression();
    } catch {
      /* ignore */
    }
  });

  // =====================================================
  //  7. 鼠标事件
  // =====================================================
  let mX = W / 2, mY = H / 2;
  document.addEventListener('mousemove', (e) => { mX = e.clientX; mY = e.clientY; });

  app.view.addEventListener('mousedown', async (e) => {
    if ((e as MouseEvent).button === 0) {
      try { await appWindow.startDragging(); } catch {}
    }
  });

  // =====================================================
  //  8. 主循环
  // =====================================================
  const core = (model.internalModel.coreModel as any);
  app.ticker.add(() => {
    if (!core?.setParameterValueById) return;
    const c = (v: number, l: number, h: number) => v < l ? l : v > h ? h : v;
    const nx = c(((mX - W / 2) / (W / 2)) * 1.2, -1, 1);
    const ny = c(((mY - H / 2) / (H / 2)) * 1.2, -1, 1);
    core.setParameterValueById('ParamAngleX', nx * 30);
    core.setParameterValueById('ParamAngleY', -ny * 20);
    core.setParameterValueById('ParamAngleZ', nx * 10);
    core.setParameterValueById('PARAM_BREATH', Math.sin(Date.now() / 2000) * 0.5 + 0.5);
  });

  console.log('[Pet] ✅ 兔兔-阿米娅已就绪');
})();

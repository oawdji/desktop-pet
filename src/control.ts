/**
 * 控制面板窗口（独立窗口）
 * 两个 Tab：模型设置 / 动画（表情、手持、特效）
 */
import { emitTo } from '@tauri-apps/api/event';

type PetSettings = { scale: number; offsetX: number; offsetY: number };
const SETTINGS_KEY = 'pet-settings';

const EMOTE_ITEMS: Record<string, Array<{ file: string; label: string }>> = {
  '😠 表情': [
    { file: 'emote-angry', label: '生气' },
    { file: 'emote-sad', label: '悲伤' },
    { file: 'emote-shy', label: '害羞' },
    { file: 'emote-shy2', label: '害羞2' },
    { file: 'emote-shy3', label: '害羞3' },
    { file: 'face-sad', label: '悲伤脸' },
    { file: 'face-shock', label: '震惊脸' },
    { file: 'mouth-hungry', label: '饥饿嘴' },
  ],
  '🖐 手持': [
    { file: 'hand-rice', label: '拿米饭' },
    { file: 'hand-trumpt', label: '拿喇叭' },
    { file: 'hand-pot', label: '拿壶' },
  ],
  '✨ 特效': [
    { file: 'mark-flower', label: '小花花' },
    { file: 'mark-exceting', label: '兴奋' },
    { file: 'mark-sweat', label: '汗珠' },
    { file: 'mark-shock', label: '震惊特效' },
    { file: 'mark-bang', label: '砰!' },
    { file: 'mark-music', label: '音符' },
  ],
};

function loadSettings(): PetSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return { scale: 1, offsetX: 0, offsetY: 0 };
  try {
    return JSON.parse(raw) as PetSettings;
  } catch {
    return { scale: 1, offsetX: 0, offsetY: 0 };
  }
}

function saveSettings(s: PetSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

async function pushSettingsToModel(s: PetSettings) {
  await emitTo<PetSettings>('main', 'pet:settings', s);
}

async function playExpr(file: string) {
  await emitTo<string>('main', 'pet:expr', file);
}

async function clearExpr() {
  await emitTo('main', 'pet:expr-clear');
}

function $(sel: string, root: Document | HTMLElement = document) {
  const el = root.querySelector(sel);
  if (!el) throw new Error(`Element not found: ${sel}`);
  return el as HTMLElement;
}

function render() {
  const root = document.getElementById('control-root')!;
  root.innerHTML = `
    <div class="ctrl">
      <div class="ctrl-header">
        <div class="ctrl-title">控制面板</div>
      </div>
      <div class="ctrl-tabs">
        <button class="ctrl-tab active" data-tab="settings" type="button">模型设置</button>
        <button class="ctrl-tab" data-tab="emotes" type="button">动画</button>
      </div>
      <div class="ctrl-pages">
        <div class="ctrl-page" data-page="settings"></div>
        <div class="ctrl-page hidden" data-page="emotes"></div>
      </div>
    </div>
  `;

  const pageSettings = root.querySelector('[data-page="settings"]') as HTMLDivElement;
  const pageEmotes = root.querySelector('[data-page="emotes"]') as HTMLDivElement;

  pageSettings.innerHTML = `
    <div class="ctrl-section">
      <div class="ctrl-row">
        <div class="ctrl-row-label">大小 <span id="v-scale" class="ctrl-val">1</span></div>
        <input id="s-scale" type="range" min="0.2" max="3" step="0.05" />
      </div>
      <div class="ctrl-row">
        <div class="ctrl-row-label">水平偏移 <span id="v-x" class="ctrl-val">0</span></div>
        <input id="s-x" type="range" min="-150" max="150" step="1" />
      </div>
      <div class="ctrl-row">
        <div class="ctrl-row-label">垂直偏移 <span id="v-y" class="ctrl-val">0</span></div>
        <input id="s-y" type="range" min="-150" max="150" step="1" />
      </div>
      <div class="ctrl-actions">
        <button id="btn-reset" type="button">重置</button>
      </div>
      <div class="ctrl-hint">拖动滑块实时生效；设置会自动保存。</div>
    </div>
  `;

  pageEmotes.innerHTML = `
    <div class="ctrl-section">
      <div class="ctrl-actions">
        <button id="btn-clear" type="button">清除表情</button>
      </div>
      <div id="emote-container" class="ctrl-emote-container"></div>
    </div>
  `;

  const emoteContainer = pageEmotes.querySelector('#emote-container') as HTMLDivElement;
  for (const [groupName, items] of Object.entries(EMOTE_ITEMS)) {
    const g = document.createElement('div');
    g.className = 'ctrl-group';
    g.innerHTML = `<div class="ctrl-group-title">${groupName}</div>`;
    const grid = document.createElement('div');
    grid.className = 'ctrl-grid';
    items.forEach((it) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ctrl-chip';
      b.textContent = it.label;
      b.dataset.file = it.file;
      grid.appendChild(b);
    });
    g.appendChild(grid);
    emoteContainer.appendChild(g);
  }

  // tabs
  const tabSettings = root.querySelector('[data-tab="settings"]') as HTMLButtonElement;
  const tabEmotes = root.querySelector('[data-tab="emotes"]') as HTMLButtonElement;
  const setActive = (tab: 'settings' | 'emotes') => {
    tabSettings.classList.toggle('active', tab === 'settings');
    tabEmotes.classList.toggle('active', tab === 'emotes');
    pageSettings.classList.toggle('hidden', tab !== 'settings');
    pageEmotes.classList.toggle('hidden', tab !== 'emotes');
  };
  tabSettings.onclick = () => setActive('settings');
  tabEmotes.onclick = () => setActive('emotes');

  // settings bindings
  const sScale = pageSettings.querySelector('#s-scale') as HTMLInputElement;
  const sX = pageSettings.querySelector('#s-x') as HTMLInputElement;
  const sY = pageSettings.querySelector('#s-y') as HTMLInputElement;
  const vScale = pageSettings.querySelector('#v-scale') as HTMLSpanElement;
  const vX = pageSettings.querySelector('#v-x') as HTMLSpanElement;
  const vY = pageSettings.querySelector('#v-y') as HTMLSpanElement;
  const btnReset = pageSettings.querySelector('#btn-reset') as HTMLButtonElement;

  const syncUi = (s: PetSettings) => {
    sScale.value = String(s.scale);
    sX.value = String(s.offsetX);
    sY.value = String(s.offsetY);
    vScale.textContent = String(s.scale);
    vX.textContent = String(s.offsetX);
    vY.textContent = String(s.offsetY);
  };

  const update = (patch: Partial<PetSettings>) => {
    const cur = loadSettings();
    const next: PetSettings = { ...cur, ...patch };
    saveSettings(next);
    syncUi(next);
    void pushSettingsToModel(next);
  };

  const init = loadSettings();
  syncUi(init);
  void pushSettingsToModel(init);

  sScale.oninput = () => update({ scale: parseFloat(sScale.value) });
  sX.oninput = () => update({ offsetX: parseFloat(sX.value) });
  sY.oninput = () => update({ offsetY: parseFloat(sY.value) });
  btnReset.onclick = () => update({ scale: 1, offsetX: 0, offsetY: 0 });

  // emotes
  emoteContainer.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t?.tagName !== 'BUTTON') return;
    const file = (t as HTMLButtonElement).dataset.file;
    if (!file) return;
    void playExpr(file);
  });
  (pageEmotes.querySelector('#btn-clear') as HTMLButtonElement).onclick = () => void clearExpr();
}

render();


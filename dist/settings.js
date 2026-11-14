import { DEFAULT_SETTINGS, normalizeSettings } from './audio-engine.js';
import { SOUND_PACKS, MUSIC_STYLES } from './synthesis.js';
export const SETTINGS_KEY = 'little-stone-settings-v1';
const AUDIO_SELECTION_REVISION = 'b3-v1';
export function readSettings(legacySound=false){
  try {
    const saved=localStorage.getItem(SETTINGS_KEY);
    if(saved){
      const parsed=JSON.parse(saved);
      if(parsed&&typeof parsed==='object'){
        const settings=normalizeSettings(parsed);
        // Apply the chosen release soundtrack once; preserve all other preferences.
        if(parsed._audioSelectionRevision!==AUDIO_SELECTION_REVISION){
          settings.soundPack=DEFAULT_SETTINGS.soundPack;
          settings.musicStyle=DEFAULT_SETTINGS.musicStyle;
          writeSettings(settings);
        }
        return settings;
      }
    }
  }catch{}
  return normalizeSettings({...DEFAULT_SETTINGS,muted:!legacySound});
}
export function writeSettings(settings){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify({...normalizeSettings(settings),_audioSelectionRevision:AUDIO_SELECTION_REVISION}));return true;}catch{return false;}}
export function settingsContent(s){
  const slider=(id,label)=>`<label class="volume-row"><span>${label}</span><input data-pref="${id}" aria-label="${label}" type="range" min="0" max="100" value="${s[id]}"><output data-volume="${id}">${s[id]}%</output></label>`;
  const toggle=(id,label,detail)=>`<label class="setting-toggle"><span>${label}<small>${detail}</small></span><input data-pref="${id}" type="checkbox" ${s[id]?'checked':''}></label>`;
  const choices=(list,key,kind)=>list.map(item=>`<div class="audio-choice ${s[key]===item.id?'chosen':''}"><label><input type="radio" name="${key}" data-pref="${key}" value="${item.id}" ${s[key]===item.id?'checked':''}><span><small>${item.badge}</small><b>${item.name}</b><em>${item.description}</em></span></label><button class="audition-button" data-audition="${kind}" data-audio-id="${item.id}" aria-label="试听${item.name}">▶ 试听</button></div>`).join('');
  return `<div class="settings-intro"><p>先把世界调成喜欢的样子。设置即时生效，关闭后继续游戏。</p><a href="audio-lab.html" target="_blank" rel="noopener">打开完整试听室 ↗</a></div><div class="settings-tabs" role="tablist" aria-label="设置分类"><button role="tab" id="audioTab" aria-controls="audioPanel" aria-selected="true" data-settings-tab="audio">声音与音乐</button><button role="tab" id="displayTab" aria-controls="displayPanel" aria-selected="false" data-settings-tab="display" tabindex="-1">画面与操作</button><button role="tab" id="progressTab" aria-controls="progressPanel" aria-selected="false" data-settings-tab="progress" tabindex="-1">进度与存档</button></div>
  <section id="audioPanel" role="tabpanel" aria-labelledby="audioTab"><div class="settings-volume">${toggle('muted','全部静音','快捷键 M · 首次播放需要一次点击')}${slider('master','总音量')}${slider('music','背景音乐')}${slider('effects','动作音效')}${slider('ambience','环境声音')}</div><div class="settings-section-head"><h3>音效选哪一套？</h3><span>可随时更换，不影响进度</span></div><div class="audio-choices">${choices(SOUND_PACKS,'soundPack','sfx')}</div><div class="settings-section-head"><h3>让音乐慢慢流</h3><span>五处水岸，各有编曲和环境层</span></div><div class="audio-choices">${choices(MUSIC_STYLES,'musicStyle','music')}</div><div class="audition-status"><span id="auditionStatus" role="status">试听音效顺序：菜单 → 脚步 → 拾取 → 投掷 → 连漂 → 落水 → 改造 → 纪录</span><button id="stopAudition">■ 停止试听</button></div>${toggle('backgroundMute','离开游戏时静音','切换标签页后安静下来；返回时恢复')}</section>
  <section id="displayPanel" role="tabpanel" aria-labelledby="displayTab" hidden><div class="settings-volume">${toggle('reducedMotion','减少装饰动画','暂停飞鸟、萤光和天气飘动，保留必要的物理运动')}${toggle('trajectory','显示投掷轨迹','显示瞄准提示与石头飞行轨迹')}${toggle('hints','显示操作提示','显示河岸操作提示与小贴士')}<label class="setting-select"><span>默认水漂速度<small>慢放不改变模拟精度；音效同步变慢</small></span><select data-pref="playbackSpeed">${[1,.5,.25,.1].map(v=>`<option value="${v}" ${s.playbackSpeed===v?'selected':''}>${v}×</option>`).join('')}</select></label><label class="setting-select"><span>画面帧率<small>物理计算精度保持一致</small></span><select data-pref="renderRate"><option value="60" ${s.renderRate===60?'selected':''}>流畅 · 60 FPS</option><option value="30" ${s.renderRate===30?'selected':''}>省电 · 30 FPS</option></select></label><label class="setting-select"><span>蓄力操作<small>鼠标、触屏与空格均适用</small></span><select data-pref="chargeMode"><option value="hold" ${s.chargeMode==='hold'?'selected':''}>按住蓄力，松开投出</option><option value="toggle" ${s.chargeMode==='toggle'?'selected':''}>点击开始，再点投出</option></select></label></div><div class="controls-guide"><h3>随身操作卡</h3><p><kbd>W A S D</kbd> / <kbd>方向键</kbd> 散步　<kbd>E</kbd> 拾取与聊天</p><p><kbd>F</kbd> 按住镜头跟随，松开回到全景　<kbd>空格</kbd> 蓄力投掷　<kbd>Esc</kbd> 暂停 / 返回　<kbd>M</kbd> 静音</p><p>点击地面可以行走，点击石头可以自动靠近拾取。</p><button class="secondary" id="fullscreenBtn">⛶ 切换全屏</button></div></section><section id="progressPanel" role="tabpanel" aria-labelledby="progressTab" hidden><div class="settings-progress"><h3>给今天留一份纪念</h3><p>导出收藏、多亲本谱系与育种记录、量子态与投掷建议。重置会清空收藏、灵感与纪录，重新领取三块初始石头；声音和画面设置会保留。</p><div class="button-row"><button class="secondary" id="settingsExport">导出进度备份</button><button class="danger-button" id="resetProgress">重置游戏进度…</button></div><p class="farewell-note">石头们已经在准备联名挽留信了。</p></div></section><div class="settings-footer"><span id="preferenceStatus">设置独立保存，收藏不会受影响。</span><button id="resetPreferences">恢复默认设置</button></div>`;
}
export function bindSettings({get,set,audio,toast,rerender,onReset,onExport}){
  const root=document.querySelector('#modal');
  root.querySelectorAll('[data-pref]').forEach(input=>input.addEventListener('input',()=>{const key=input.dataset.pref;const value=input.type==='checkbox'?input.checked:input.type==='range'||['renderRate','playbackSpeed'].includes(key)?Number(input.value):input.value;set({...get(),[key]:value});const output=root.querySelector(`[data-volume="${key}"]`);if(output)output.textContent=value+'%';root.querySelectorAll('.audio-choice').forEach(c=>c.classList.toggle('chosen',c.querySelector('input').checked));}));
  root.querySelector('#resetProgress').onclick=onReset;root.querySelector('#settingsExport').onclick=onExport;
  const tabs=[...root.querySelectorAll('[data-settings-tab]')];
  const selectTab=button=>{for(const b of tabs){const active=b===button;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;root.querySelector('#'+b.dataset.settingsTab+'Panel').hidden=!active;}audio.stopPreview();};
  tabs.forEach((b,i)=>{b.onclick=()=>selectTab(b);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=tabs[e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];selectTab(next);next.focus();}};});
  root.querySelectorAll('[data-audition]').forEach(b=>b.onclick=async()=>{if(get().muted||get().master===0){toast('先关闭全部静音，并调高总音量，就能试听了。');return;}const ok=await audio.audition(b.dataset.audition,b.dataset.audioId);const label=document.querySelector('#auditionStatus');if(label)label.textContent=ok?`正在试听：${b.getAttribute('aria-label').slice(2)}。只试听，不会替你改变选择。`:'声音未能启动，请再次点击试听。';});
  root.querySelector('#stopAudition').onclick=()=>{audio.stopPreview();document.querySelector('#auditionStatus').textContent='试听已停止。点击选项名称可应用到游戏。';};
  root.querySelector('#fullscreenBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('当前浏览器不支持全屏，请使用浏览器的全屏功能。');}catch{toast('当前窗口不允许全屏，可在独立浏览器中打开。');}};
  root.querySelector('#resetPreferences').onclick=()=>{audio.stopPreview();set({...DEFAULT_SETTINGS,muted:get().muted});rerender();toast('已恢复声音、画面与操作默认值，保留当前静音状态。');};
}

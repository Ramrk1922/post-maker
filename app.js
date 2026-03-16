// ═══════════════════════════════════════════
//  POST MAKER — app.js
//  Peravurani News Post Creator
// ═══════════════════════════════════════════

// ─── COLOR PICKER ENGINE ───────────────────
const QUICK_COLORS = [
  '#ffffff','#000000','#f5c518','#ff6b35','#e53935','#ff4081',
  '#e040fb','#7c4dff','#00e5ff','#00bcd4','#69f0ae','#1b5e20',
  '#1a3a5c','#0d47a1','#880e4f','#bf360c','rgba(255,255,255,0.75)',
  '#cccccc','#8B0000','#212121'
];

function hsvToRgb(h, s, v) {
  const i = Math.floor(h / 60) % 6, f = h / 60 - Math.floor(h / 60);
  const p = v*(1-s), q = v*(1-f*s), t = v*(1-(1-f)*s);
  const map = [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]];
  return map[i].map(x => Math.round(x * 255));
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2,'0')).join('');
}

let activePopup = null;

function makeColorPicker(cid, label, initColor, onChange) {
  const wrap = document.getElementById(cid);
  if (!wrap) return;
  wrap.innerHTML = `
    <div class="cp-wrap">
      <div class="cp-sec">${label}</div>
      <div class="color-trigger" onclick="toggleSpectrum('${cid}')">
        <div class="ct-swatch" id="cts-${cid}" style="background:${initColor}"></div>
        <span class="ct-label">Choose color</span>
        <span class="ct-hex" id="cth-${cid}">${initColor}</span>
      </div>
      <div class="spectrum-popup" id="sp-${cid}">
        <canvas class="spec-canvas" id="sc-${cid}" width="210" height="130"></canvas>
        <canvas class="hue-bar"     id="hb-${cid}" width="210" height="14"></canvas>
        <div class="spec-swatches"  id="ss-${cid}"></div>
        <div class="spec-bottom">
          <div class="spec-preview" id="sprev-${cid}" style="background:${initColor}"></div>
          <input  class="spec-hex"  id="shex-${cid}"  value="${initColor}" oninput="onHexInput('${cid}')">
          <button class="spec-ok"                     onclick="closeSpectrum('${cid}')">OK</button>
        </div>
      </div>
    </div>`;

  // Quick swatches
  const ss = document.getElementById('ss-' + cid);
  QUICK_COLORS.forEach(c => {
    const d = document.createElement('div');
    d.className = 'spec-swatch';
    d.style.background = c;
    d.onclick = () => setPickerColor(cid, c, onChange);
    ss.appendChild(d);
  });

  // Hue bar
  const hbEl = document.getElementById('hb-' + cid);
  const hbCtx = hbEl.getContext('2d');
  const hg = hbCtx.createLinearGradient(0, 0, 210, 0);
  for (let i = 0; i <= 360; i += 30) hg.addColorStop(i/360, `hsl(${i},100%,50%)`);
  hbCtx.fillStyle = hg;
  hbCtx.fillRect(0, 0, 210, 14);

  window['_cp_' + cid] = { hue: 0, satX: 0.8, valY: 0.8, cur: initColor };
  drawSpec(cid, 0);

  document.getElementById('hb-' + cid).addEventListener('mousedown', e => onHue(e, cid, onChange));
  document.getElementById('hb-' + cid).addEventListener('mousemove', e => { if (e.buttons === 1) onHue(e, cid, onChange); });
  document.getElementById('sc-' + cid).addEventListener('mousedown', e => onSpec(e, cid, onChange));
  document.getElementById('sc-' + cid).addEventListener('mousemove', e => { if (e.buttons === 1) onSpec(e, cid, onChange); });
}

function drawSpec(cid, hue) {
  const sc = document.getElementById('sc-' + cid); if (!sc) return;
  const c = sc.getContext('2d'); const w = 210, h = 130;
  c.fillStyle = `hsl(${hue},100%,50%)`; c.fillRect(0,0,w,h);
  const wg = c.createLinearGradient(0,0,w,0);
  wg.addColorStop(0,'rgba(255,255,255,1)'); wg.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle = wg; c.fillRect(0,0,w,h);
  const bg = c.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,'rgba(0,0,0,0)'); bg.addColorStop(1,'rgba(0,0,0,1)');
  c.fillStyle = bg; c.fillRect(0,0,w,h);
  const st = window['_cp_' + cid];
  if (st) {
    const cx = st.satX * w, cy = (1 - st.valY) * h;
    c.beginPath(); c.arc(cx,cy,7,0,Math.PI*2);
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.arc(cx,cy,7,0,Math.PI*2);
    c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; c.stroke();
  }
}
function onHue(e, cid, cb) {
  const el = document.getElementById('hb-' + cid), r = el.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  const st = window['_cp_' + cid]; st.hue = Math.round(x * 360);
  drawSpec(cid, st.hue); updateHSV(cid, cb);
}
function onSpec(e, cid, cb) {
  const el = document.getElementById('sc-' + cid), r = el.getBoundingClientRect();
  const st = window['_cp_' + cid];
  st.satX = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  st.valY = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
  drawSpec(cid, st.hue); updateHSV(cid, cb);
}
function updateHSV(cid, cb) {
  const st = window['_cp_' + cid];
  const [r, g, b] = hsvToRgb(st.hue, st.satX, st.valY);
  const hex = rgbToHex(r, g, b); st.cur = hex;
  setPickerUI(cid, hex); if (cb) cb(hex);
}
function setPickerColor(cid, color, cb) {
  const st = window['_cp_' + cid]; if (st) st.cur = color;
  setPickerUI(cid, color); if (cb) cb(color);
}
function setPickerUI(cid, color) {
  const ids = ['shex','sprev','cts','cth'];
  ids.forEach(p => {
    const el = document.getElementById(p + '-' + cid); if (!el) return;
    if (p === 'shex') el.value = color;
    else if (p === 'cth') el.textContent = color;
    else el.style.background = color;
  });
}
function onHexInput(cid) {
  const v = document.getElementById('shex-' + cid).value;
  if (/^#[0-9a-f]{6}$/i.test(v)) {
    setPickerUI(cid, v);
    const key = Object.keys(CT).find(k => CT[k].cid === cid);
    if (key) { CT[key].val = v; drawPost(); }
  }
}
function toggleSpectrum(cid) {
  const popup = document.getElementById('sp-' + cid);
  if (activePopup && activePopup !== popup) activePopup.classList.remove('open');
  popup.classList.toggle('open');
  activePopup = popup.classList.contains('open') ? popup : null;
}
function closeSpectrum(cid) {
  document.getElementById('sp-' + cid).classList.remove('open');
  activePopup = null;
}
document.addEventListener('mousedown', e => {
  if (activePopup && !activePopup.contains(e.target) && !e.target.closest('.color-trigger')) {
    activePopup.classList.remove('open'); activePopup = null;
  }
});

// ─── COLOR TARGETS ──────────────────────────
const CT = {
  head:  { cid: 'cp-head',  label: 'Headline Color', val: '#ffffff' },
  sub:   { cid: 'cp-sub',   label: 'Subtext Color',  val: 'rgba(255,255,255,0.75)' },
  bg:    { cid: 'cp-bg',    label: 'Background',     val: '#1a3a5c' },
  accent:{ cid: 'cp-accent',label: 'Accent Color',   val: '#f5c518' },
  grad1: { cid: 'cp-grad1', label: 'Color 1',        val: '#1a3a5c' },
  grad2: { cid: 'cp-grad2', label: 'Color 2',        val: '#8B0000' },
  wm:    { cid: 'cp-wm',    label: 'Watermark Color',val: '#ffffff' },
};
function initCP() {
  Object.entries(CT).forEach(([k, {cid, label, val}]) => {
    makeColorPicker(cid, label, val, c => { CT[k].val = c; drawPost(); });
  });
}

// ─── GRADIENT PRESETS ───────────────────────
const GRAD_PRESETS = [
  {c1:'#1a3a5c',c2:'#0d1b2a',dir:'tb'}, {c1:'#8B0000',c2:'#2d0000',dir:'tb'},
  {c1:'#1b5e20',c2:'#003300',dir:'tb'}, {c1:'#4a148c',c2:'#12005e',dir:'tb'},
  {c1:'#e65100',c2:'#7f1900',dir:'tb'}, {c1:'#006064',c2:'#00212d',dir:'tb'},
  {c1:'#0d47a1',c2:'#1a237e',dir:'tb'}, {c1:'#880e4f',c2:'#3e0025',dir:'tb'},
  {c1:'#f5c518',c2:'#e65100',dir:'tb'}, {c1:'#00e5ff',c2:'#1a3a5c',dir:'tb'},
  {c1:'#1a3a5c',c2:'#8B0000',dir:'lr'}, {c1:'#212121',c2:'#4a148c',dir:'tl'},
  {c1:'#004d40',c2:'#1b5e20',dir:'tb'}, {c1:'#bf360c',c2:'#4a0000',dir:'tb'},
  {c1:'#263238',c2:'#006064',dir:'tl'}, {c1:'#1a237e',c2:'#880e4f',dir:'tr'},
];
function buildGradPresets() {
  const cont = document.getElementById('gradPresets');
  GRAD_PRESETS.forEach(g => {
    const el = document.createElement('div');
    el.className = 'grad-swatch';
    el.style.background = `linear-gradient(135deg,${g.c1},${g.c2})`;
    el.onclick = () => {
      setPickerColor('cp-grad1', g.c1, c => { CT.grad1.val = c; drawPost(); });
      setPickerColor('cp-grad2', g.c2, c => { CT.grad2.val = c; drawPost(); });
      document.getElementById('gradDir').value = g.dir;
      document.querySelectorAll('.grad-swatch').forEach(s => s.classList.remove('active'));
      el.classList.add('active'); drawPost();
    };
    cont.appendChild(el);
  });
}

// ─── COLLAPSIBLE SECTIONS ───────────────────
function toggleSection(id) {
  const body = document.getElementById(id);
  const arr  = document.getElementById('arr-' + id);
  body.classList.toggle('open');
  arr.classList.toggle('open');
}

// ─── BG MODE ────────────────────────────────
let bgMode = 'solid';
function setBgMode(mode, btn) {
  bgMode = mode;
  document.querySelectorAll('.bg-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.bg-section').forEach(s => s.classList.remove('active'));
  document.getElementById('bgs-' + mode).classList.add('active');
  drawPost();
}

// ─── APP STATE ──────────────────────────────
let headFont   = "'Noto Sans Tamil',sans-serif";
let textAlign  = 'left';
let boldHead   = true,  italicHead = false, showShadow  = true;
let showFooter = true,  showBar    = true,  showWm      = true;
let showReporter = true, showDate  = true;
let bgImg = null, logoImg = null, footerImg = null;
let canvasW = 1080, canvasH = 1080, scaleF = 0.5;
const canvas = document.getElementById('postCanvas');
const ctx    = canvas.getContext('2d');
let dragging = null, dragOffX = 0, dragOffY = 0;

// ─── INIT ───────────────────────────────────
function init() {
  document.getElementById('datetext').value = today();
  initCP();
  buildGradPresets();
  registerListeners();
  updateCanvasSize();
  drawPost();
}

function today() {
  return new Date().toLocaleDateString('ta-IN', { year:'numeric', month:'long', day:'numeric' });
}

function registerListeners() {
  ['heading','subtext','source','datetext','reporter','wmText'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawPost);
  });
  document.getElementById('gradDir').addEventListener('change', drawPost);
  document.getElementById('gradientStyle').addEventListener('change', drawPost);
  document.getElementById('logoUpload').addEventListener('change',   e => loadImg(e, 'logo'));
  document.getElementById('footerUpload').addEventListener('change', e => loadImg(e, 'footer'));
  document.getElementById('bgUpload').addEventListener('change',     e => loadImg(e, 'bg'));

  // Range inputs — all trigger drawPost via oninput in HTML
  document.querySelectorAll('input[type=range]').forEach(r => r.addEventListener('input', drawPost));
}

// ─── HELPERS ────────────────────────────────
function gv(id) { return parseFloat(document.getElementById(id).value); }
function gs(id) { return document.getElementById(id).value; }
function sync(id, vid)    { document.getElementById(vid).textContent = document.getElementById(id).value; }
function syncNum(id, vid) { document.getElementById(vid).textContent = document.getElementById(id).value; }
function setSlider(id, val) {
  const el = document.getElementById(id); if (!el) return;
  el.value = val;
  const v = document.getElementById(id + 'V'); if (v) v.textContent = val;
}

function switchTab(t) {
  const names = ['content','style','bg','position'];
  document.querySelectorAll('.tab').forEach((b, i) => b.classList.toggle('active', names[i] === t));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + t).classList.add('active');
}

function toggleOpt(tid, vn) {
  const el = document.getElementById(tid); el.classList.toggle('on');
  const v = el.classList.contains('on');
  if (vn === 'boldHead')   boldHead    = v;
  else if (vn === 'italicHead')  italicHead  = v;
  else if (vn === 'showShadow')  showShadow  = v;
  else if (vn === 'showFooter')  showFooter  = v;
  else if (vn === 'showBar')     showBar     = v;
  else if (vn === 'showWm')      showWm      = v;
  else if (vn === 'showReporter')showReporter= v;
  else if (vn === 'showDate')    showDate    = v;
  drawPost();
}

function onFontChange() {
  const sel = document.getElementById('fontSelect');
  const opt = sel.options[sel.selectedIndex];
  headFont = sel.value;
  const prev = document.getElementById('fontPreview');
  prev.style.fontFamily = sel.value;
  prev.textContent = opt.dataset.p || 'பெரவுராணி செய்தி';
  drawPost();
}

function setAlign(a) {
  textAlign = a;
  ['left','center','right'].forEach(x => document.getElementById('al-' + x).classList.toggle('active', x === a));
  drawPost();
}

function updateCanvasSize() {
  const maxW = Math.min(window.innerWidth - 310, 560);
  const maxH = Math.min(window.innerHeight - 100, 590);
  scaleF = Math.min(maxW / canvasW, maxH / canvasH, 1);
  canvas.width  = Math.round(canvasW * scaleF);
  canvas.height = Math.round(canvasH * scaleF);
  document.getElementById('canvasInfo').textContent = canvasW + ' × ' + canvasH + ' px';
}
function pickSize(el, w, h) {
  canvasW = w; canvasH = h;
  document.querySelectorAll('.size-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('customW').value = w;
  document.getElementById('customH').value = h;
  updateCanvasSize(); drawPost();
}
function applyCustomSize() {
  canvasW = Math.max(100, Math.min(4000, parseInt(document.getElementById('customW').value) || 1080));
  canvasH = Math.max(100, Math.min(4000, parseInt(document.getElementById('customH').value) || 1080));
  document.querySelectorAll('.size-card').forEach(c => c.classList.remove('active'));
  updateCanvasSize(); drawPost();
}
function loadImg(e, type) {
  const f = e.target.files[0]; if (!f) return;
  const img = new Image();
  img.onload = () => {
    if (type === 'bg') bgImg = img;
    else if (type === 'logo') logoImg = img;
    else if (type === 'footer') footerImg = img;
    drawPost();
  };
  img.src = URL.createObjectURL(f);
}

// ─── POSITION HELPERS ───────────────────────
function setWmPreset(p) {
  const pr = {
    'top-left':{x:2,y:2}, 'top-center':{x:50,y:2}, 'top-right':{x:98,y:2},
    'center':{x:50,y:50},
    'bottom-left':{x:2,y:96}, 'bottom-center':{x:50,y:96}, 'bottom-right':{x:98,y:96}
  }[p];
  setSlider('wmX', pr.x); setSlider('wmY', pr.y); drawPost();
}
function resetWm() {
  setSlider('wmX', 98); setSlider('wmY', 2);
  setSlider('wmSize', 11); setSlider('wmOpacity', 35); setSlider('wmRot', 0);
  drawPost();
}
function resetPos(which) {
  if (which === 'head') { setSlider('headX', 0); setSlider('headY', 0); }
  else { setSlider('subX', 0); setSlider('subY', 0); }
  drawPost();
}
function resetAllPos() {
  ['headX','headY','subX','subY','infoX','infoY'].forEach(id => setSlider(id, 0));
  drawPost();
}

// ─── DRAG ───────────────────────────────────
function getHBX() { return textAlign === 'center' ? canvasW/2 : textAlign === 'right' ? canvasW-40 : 42; }
function getHBY() { return (canvasH - (showFooter ? gv('footerH') : 0)) * 0.32; }

canvas.addEventListener('mousedown', e => {
  const r = canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
  const mxR = mx / scaleF, myR = my / scaleF;
  const wCX = (gv('wmX')/100 * canvasW) * scaleF, wCY = (gv('wmY')/100 * canvasH) * scaleF;
  if (Math.abs(mx - wCX) < 60 && Math.abs(my - wCY) < 22) {
    dragging = 'wm'; dragOffX = mxR/canvasW*100 - gv('wmX'); dragOffY = myR/canvasH*100 - gv('wmY');
  } else if (Math.abs(mxR - getHBX()) < 300 && Math.abs(myR - getHBY()) < gv('headSize') * 2) {
    dragging = 'head'; dragOffX = mxR - gv('headX'); dragOffY = myR - gv('headY');
  } else {
    dragging = 'sub'; dragOffX = mxR - gv('subX'); dragOffY = myR - gv('subY');
  }
});
canvas.addEventListener('mousemove', e => {
  if (!dragging) return;
  const r = canvas.getBoundingClientRect(), mxR = (e.clientX - r.left)/scaleF, myR = (e.clientY - r.top)/scaleF;
  if (dragging === 'wm') {
    setSlider('wmX', Math.round(Math.max(0, Math.min(100, mxR/canvasW*100 - dragOffX))));
    setSlider('wmY', Math.round(Math.max(0, Math.min(100, myR/canvasH*100 - dragOffY))));
  } else if (dragging === 'head') {
    setSlider('headX', Math.round(mxR - dragOffX)); setSlider('headY', Math.round(myR - dragOffY));
  } else {
    setSlider('subX', Math.round(mxR - dragOffX)); setSlider('subY', Math.round(myR - dragOffY));
  }
  drawPost();
});
canvas.addEventListener('mouseup',    () => { dragging = null; });
canvas.addEventListener('mouseleave', () => { dragging = null; });

// Touch
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0], r = canvas.getBoundingClientRect();
  const mx = t.clientX - r.left, my = t.clientY - r.top;
  const mxR = mx/scaleF, myR = my/scaleF;
  const wCX = (gv('wmX')/100 * canvasW) * scaleF, wCY = (gv('wmY')/100 * canvasH) * scaleF;
  if (Math.abs(mx - wCX) < 60 && Math.abs(my - wCY) < 22) {
    dragging = 'wm'; dragOffX = mxR/canvasW*100 - gv('wmX'); dragOffY = myR/canvasH*100 - gv('wmY');
  } else if (Math.abs(mxR - getHBX()) < 300 && Math.abs(myR - getHBY()) < gv('headSize') * 2) {
    dragging = 'head'; dragOffX = mxR - gv('headX'); dragOffY = myR - gv('headY');
  } else {
    dragging = 'sub'; dragOffX = mxR - gv('subX'); dragOffY = myR - gv('subY');
  }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  if (!dragging) return; e.preventDefault();
  const t = e.touches[0], r = canvas.getBoundingClientRect();
  const mxR = (t.clientX - r.left)/scaleF, myR = (t.clientY - r.top)/scaleF;
  if (dragging === 'wm') {
    setSlider('wmX', Math.round(Math.max(0, Math.min(100, mxR/canvasW*100 - dragOffX))));
    setSlider('wmY', Math.round(Math.max(0, Math.min(100, myR/canvasH*100 - dragOffY))));
  } else if (dragging === 'head') {
    setSlider('headX', Math.round(mxR - dragOffX)); setSlider('headY', Math.round(myR - dragOffY));
  } else {
    setSlider('subX', Math.round(mxR - dragOffX)); setSlider('subY', Math.round(myR - dragOffY));
  }
  drawPost();
}, { passive: false });
canvas.addEventListener('touchend', () => { dragging = null; });
window.addEventListener('resize', () => { updateCanvasSize(); drawPost(); });

// ─── DRAW HELPERS ───────────────────────────
function wrapLines(c, txt, mW) {
  const words = txt.split(' '); let ln = '', lines = [];
  for (let w of words) {
    const t = ln + w + ' ';
    if (c.measureText(t).width > mW && ln) { lines.push(ln.trim()); ln = w + ' '; }
    else ln = t;
  }
  if (ln) lines.push(ln.trim());
  return lines;
}
function wrapML(c, txt, mW) {
  return txt.split('\n').flatMap(r => r.trim() ? wrapLines(c, r, mW) : ['']);
}

function makeBgGradient(w, h) {
  const c1 = CT.grad1.val, c2 = CT.grad2.val, dir = gs('gradDir');
  let g;
  if (dir === 'radial') {
    g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.7);
  } else {
    const dirs = { tb:[w/2,0,w/2,h], lr:[0,h/2,w,h/2], tl:[0,0,w,h], tr:[w,0,0,h] };
    const [x1,y1,x2,y2] = dirs[dir] || dirs.tb;
    g = ctx.createLinearGradient(x1, y1, x2, y2);
  }
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  return g;
}

function drawBg(w, mH) {
  if (bgMode === 'photo' && bgImg) {
    ctx.save();
    ctx.filter = `brightness(${gv('bgBright')/100}) blur(${gv('bgBlur')}px)`;
    ctx.drawImage(bgImg, 0, 0, w, mH);
    ctx.filter = 'none'; ctx.restore();
    const dim = gv('bgDim') / 100, grad = gs('gradientStyle');
    if (grad === 'bottom') {
      const g = ctx.createLinearGradient(0, mH*0.3, 0, mH);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${Math.min(dim+0.3,0.95)})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, mH);
    } else if (grad === 'top') {
      const g = ctx.createLinearGradient(0, 0, 0, mH*0.6);
      g.addColorStop(0, `rgba(0,0,0,${Math.min(dim+0.3,0.95)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, mH);
    } else if (grad === 'full') {
      ctx.fillStyle = `rgba(0,0,0,${dim})`; ctx.fillRect(0, 0, w, mH);
    }
  } else if (bgMode === 'gradient') {
    ctx.fillStyle = makeBgGradient(w, mH); ctx.fillRect(0, 0, w, mH);
  } else {
    ctx.fillStyle = CT.bg.val; ctx.fillRect(0, 0, w, mH);
  }
}

function drawWM(w, h, s) {
  if (!showWm) return;
  const wt = gs('wmText'); if (!wt) return;
  const xp = gv('wmX')/100, yp = gv('wmY')/100;
  const sz = gv('wmSize'), op = gv('wmOpacity')/100, rot = gv('wmRot') * Math.PI / 180;
  ctx.save();
  ctx.translate(xp * w, yp * h); ctx.rotate(rot);
  ctx.globalAlpha = op; ctx.fillStyle = CT.wm.val;
  ctx.font = `${Math.round(sz * s)}px ${headFont}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = xp < 0.33 ? 'left' : xp > 0.66 ? 'right' : 'center';
  ctx.fillText(wt, 0, 0);
  ctx.restore(); ctx.globalAlpha = 1;
}

function drawInfoBar(w, mH, s, src, dt, rep, iSz, iX, iY) {
  const ac = CT.accent.val, iy = mH - 22*s + iY;
  ctx.textBaseline = 'alphabetic';
  if (showBar) {
    ctx.fillStyle = ac; ctx.font = `bold ${Math.round(iSz*s)}px ${headFont}`;
    ctx.textAlign = 'left'; ctx.fillText(src, 20*s + iX, iy);
  }
  if (showDate) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = `${Math.round(iSz*s)}px sans-serif`;
    ctx.textAlign = 'right'; ctx.fillText(dt, w - 20*s + iX, iy);
  }
  if (showReporter && rep) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = `${Math.round((iSz-1)*s)}px ${headFont}`;
    ctx.textAlign = 'left'; ctx.fillText(rep, 20*s + iX, iy - 16*s);
  }
  ctx.textAlign = 'left';
}

// ─── MAIN DRAW ──────────────────────────────
function drawPost() {
  const s = scaleF, w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h); ctx.filter = 'none';
  const ac = CT.accent.val, hc = CT.head.val, sc = CT.sub.val;
  const fH = showFooter ? Math.round(gv('footerH') * s) : 0, mH = h - fH;

  drawBg(w, mH);

  // Footer
  if (showFooter) {
    if (footerImg) { ctx.drawImage(footerImg, 0, mH, w, fH); }
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, mH, w, fH);
      ctx.fillStyle = ac; ctx.font = `bold ${Math.round(11*s)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('PROMOTION SPACE — upload in Style → Footer', w/2, mH + fH/2);
    }
    ctx.fillStyle = ac; ctx.fillRect(0, mH, w, 3*s);
  }

  const hdg = gs('heading'), sub = gs('subtext'), src = gs('source');
  const dt  = gs('datetext'),  rep = gs('reporter');
  const hSz = gv('headSize'), sSz = gv('subSize'), iSz = gv('infoSize');
  const hX = gv('headX')*s, hY = gv('headY')*s;
  const sX = gv('subX')*s,  sY = gv('subY')*s;
  const iX = gv('infoX')*s, iY = gv('infoY')*s;
  const twp = gv('textWidth')/100, lSz = gv('logoSize')*s;
  const op  = gv('textOpacity')/100, lh  = gv('lineHeight')/100;
  const fs  = (italicHead ? 'italic ' : '') + (boldHead ? 'bold ' : '');

  if (showShadow) { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6*s; }
  else ctx.shadowBlur = 0;

  // Accent bars
  if (showBar) { ctx.fillStyle = ac; ctx.fillRect(0, mH-6*s, w, 6*s); ctx.fillRect(0, 0, w, 5*s); }
  ctx.fillStyle = ac; ctx.fillRect(28*s + hX, mH*0.32 + hY, 5*s, mH*0.42);

  // Headline
  const mxW = w * twp - 60*s;
  ctx.fillStyle = hc; ctx.globalAlpha = op;
  ctx.font = `${fs}${Math.round(hSz*s)}px ${headFont}`;
  ctx.textBaseline = 'top'; ctx.textAlign = textAlign;
  const tx = textAlign === 'center' ? w/2 + hX : textAlign === 'right' ? w - 40*s + hX : 42*s + hX;
  const lines = wrapLines(ctx, hdg, mxW), hLH = hSz * s * lh;
  lines.forEach((l, i) => ctx.fillText(l, tx, mH*0.32 + hY + i*hLH));

  // Subtext
  const defSY = mH*0.32 + hY + lines.length * hLH + 12*s;
  ctx.font = `${Math.round(sSz*s)}px ${headFont}`; ctx.fillStyle = sc;
  const stx = textAlign === 'center' ? w/2 + sX : textAlign === 'right' ? w - 40*s + sX : 42*s + sX;
  wrapML(ctx, sub, mxW).forEach((l, i) => ctx.fillText(l, stx, defSY + sY + i * sSz*s*1.3));

  ctx.globalAlpha = 1;
  drawInfoBar(w, mH, s, src, dt, rep, iSz, iX, iY);
  ctx.shadowBlur = 0;

  // Logo
  if (logoImg) {
    ctx.save(); ctx.beginPath();
    ctx.arc(20*s + lSz/2, 20*s + lSz/2, lSz/2, 0, Math.PI*2);
    ctx.clip(); ctx.drawImage(logoImg, 20*s, 20*s, lSz, lSz); ctx.restore();
  }

  drawWM(w, h, s);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

// ─── DOWNLOAD ───────────────────────────────
function downloadPost() {
  const rw = canvasW, rh = canvasH;
  const origS = scaleF, origW = canvas.width, origH = canvas.height;
  canvas.width = rw; canvas.height = rh; scaleF = 1;

  const hdg = gs('heading'), sub = gs('subtext'), src = gs('source');
  const dt  = gs('datetext'),  rep = gs('reporter');
  const hSz = gv('headSize'), sSz = gv('subSize'), iSz = gv('infoSize');
  const hX  = gv('headX'),  hY  = gv('headY');
  const sX  = gv('subX'),   sY  = gv('subY');
  const iX  = gv('infoX'),  iY  = gv('infoY');
  const twp = gv('textWidth')/100, lSz = gv('logoSize');
  const op  = gv('textOpacity')/100, lh  = gv('lineHeight')/100;
  const fs  = (italicHead ? 'italic ' : '') + (boldHead ? 'bold ' : '');
  const ac  = CT.accent.val, hc = CT.head.val, sc = CT.sub.val;

  ctx.clearRect(0, 0, rw, rh);
  const fH = showFooter ? gv('footerH') : 0, mH = rh - fH;

  drawBg(rw, mH);
  if (showFooter) {
    if (footerImg) ctx.drawImage(footerImg, 0, mH, rw, fH);
    else { ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, mH, rw, fH); }
    ctx.fillStyle = ac; ctx.fillRect(0, mH, rw, 3);
  }
  if (showShadow) { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6; } else ctx.shadowBlur = 0;
  if (showBar) { ctx.fillStyle = ac; ctx.fillRect(0, mH-6, rw, 6); ctx.fillRect(0, 0, rw, 5); }
  ctx.fillStyle = ac; ctx.fillRect(28 + hX, mH*0.32 + hY, 5, mH*0.42);

  const mxW = rw * twp - 60;
  ctx.fillStyle = hc; ctx.globalAlpha = op;
  ctx.font = `${fs}${hSz}px ${headFont}`; ctx.textBaseline = 'top'; ctx.textAlign = textAlign;
  const tx = textAlign === 'center' ? rw/2 + hX : textAlign === 'right' ? rw - 40 + hX : 42 + hX;
  const lines = wrapLines(ctx, hdg, mxW), hLH = hSz * lh;
  lines.forEach((l, i) => ctx.fillText(l, tx, mH*0.32 + hY + i*hLH));

  const defSY = mH*0.32 + hY + lines.length * hLH + 12;
  ctx.font = `${sSz}px ${headFont}`; ctx.fillStyle = sc;
  const stx = textAlign === 'center' ? rw/2 + sX : textAlign === 'right' ? rw - 40 + sX : 42 + sX;
  wrapML(ctx, sub, mxW).forEach((l, i) => ctx.fillText(l, stx, defSY + sY + i * sSz * 1.3));

  ctx.globalAlpha = 1;
  drawInfoBar(rw, mH, 1, src, dt, rep, iSz, iX, iY);
  ctx.shadowBlur = 0;

  if (logoImg) {
    ctx.save(); ctx.beginPath();
    ctx.arc(20 + lSz/2, 20 + lSz/2, lSz/2, 0, Math.PI*2);
    ctx.clip(); ctx.drawImage(logoImg, 20, 20, lSz, lSz); ctx.restore();
  }
  drawWM(rw, rh, 1);

  const link = document.createElement('a');
  link.download = 'post.png'; link.href = canvas.toDataURL('image/png'); link.click();

  canvas.width = origW; canvas.height = origH; scaleF = origS;
  drawPost();
}

// ─── START ──────────────────────────────────
init();

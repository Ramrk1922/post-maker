function drawPost() {
  const s = scaleF, w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h); 
  ctx.filter = 'none';

  const ac = CT.accent.val, hc = CT.head.val, sc = CT.sub.val;
  const fH = showFooter ? Math.round(gv('footerH') * s) : 0;
  const mH = h - fH;

  drawBg(w, mH);

  // Footer
  if (showFooter) {
    if (footerImg) {
      ctx.drawImage(footerImg, 0, mH, w, fH);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, mH, w, fH);
    }

    ctx.fillStyle = ac;
    ctx.fillRect(0, mH, w, 3*s);
  }

  const hdg = gs('heading');
  const sub = gs('subtext');
  const src = gs('source');
  const dt  = gs('datetext');
  const rep = gs('reporter');

  const hSz = gv('headSize');
  const sSz = gv('subSize');
  const iSz = gv('infoSize');

  const hX = gv('headX')*s;
  const hY = gv('headY')*s;
  const sX = gv('subX')*s;
  const sY = gv('subY')*s;

  const iX = gv('infoX')*s;
  const iY = gv('infoY')*s;

  const twp = gv('textWidth')/100;
  const lSz = gv('logoSize')*s;

  const op  = gv('textOpacity')/100;
  const lh  = gv('lineHeight')/100;

  const fs = (italicHead ? 'italic ' : '') + (boldHead ? 'bold ' : '');

  if (showShadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6*s;
  } else {
    ctx.shadowBlur = 0;
  }

  // Accent top + bottom bars
  if (showBar) {
    ctx.fillStyle = ac;
    ctx.fillRect(0, mH-6*s, w, 6*s);
    ctx.fillRect(0, 0, w, 5*s);
  }

  // Headline settings
  const mxW = w * twp - 60*s;

  ctx.fillStyle = hc;
  ctx.globalAlpha = op;

  ctx.font = `${fs}${Math.round(hSz*s)}px ${headFont}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = textAlign;

  const tx =
    textAlign === 'center'
      ? w/2 + hX
      : textAlign === 'right'
      ? w - 40*s + hX
      : 42*s + hX;

  // Accent square near headline
  ctx.fillStyle = ac;
  ctx.fillRect(tx - 14*s, mH*0.32 + hY - 6*s, 8*s, 8*s);

  ctx.fillStyle = hc;

  const lines = wrapLines(ctx, hdg, mxW);
  const hLH = hSz * s * lh;

  lines.forEach((l, i) => {
    ctx.fillText(l, tx, mH*0.32 + hY + i*hLH);
  });

  // Subtext
  const defSY = mH*0.32 + hY + lines.length * hLH + 12*s;

  ctx.font = `${Math.round(sSz*s)}px ${headFont}`;
  ctx.fillStyle = sc;

  const stx =
    textAlign === 'center'
      ? w/2 + sX
      : textAlign === 'right'
      ? w - 40*s + sX
      : 42*s + sX;

  wrapML(ctx, sub, mxW).forEach((l, i) => {
    ctx.fillText(l, stx, defSY + sY + i * sSz*s*1.3);
  });

  ctx.globalAlpha = 1;

  drawInfoBar(w, mH, s, src, dt, rep, iSz, iX, iY);

  ctx.shadowBlur = 0;

  // Logo
  if (logoImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(20*s + lSz/2, 20*s + lSz/2, lSz/2, 0, Math.PI*2);
    ctx.clip();
    ctx.drawImage(logoImg, 20*s, 20*s, lSz, lSz);
    ctx.restore();
  }

  drawWM(w, h, s);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

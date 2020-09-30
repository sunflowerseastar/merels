import libraryApl from 'apl';

// copied directly from https://gitlab.com/n9n/apl, no changes
export const fmt = (x) => {
  // as array of strings
  const t = typeof x;
  if (x === null) return ['null'];
  if (t === 'undefined') return ['undefined'];
  if (t === 'string') return [x];
  if (t === 'number') {
    const r = [fmtNum(x)];
    r.al = 1;
    return r;
  }
  if (t === 'function') return ['#procedure'];
  if (!x.isA) return ['' + x];
  if (!x.a.length) return [''];
  if (!x.s.length) return fmt(x.a[0]);
  // {t:type(0=chr,1=num,2=nst),w:width,h:height,lm:leftMargin,rm:rightMargin,bm:bottomMargin,al:align(0=lft,1=rgt)}
  const nr = prd(x.s.slice(0, -1)),
    nc = x.s[x.s.length - 1],
    rows = Array(nr),
    cols = Array(nc);
  for (let i = 0; i < nr; i++) rows[i] = { h: 0, bm: 0 };
  for (let i = 0; i < nc; i++) cols[i] = { t: 0, w: 0, lm: 0, rm: 0 };
  let g = Array(nr); // grid
  for (let i = 0; i < nr; i++) {
    const r = rows[i],
      gr = (g[i] = Array(nc)); // gr:grid row
    for (let j = 0; j < nc; j++) {
      const c = cols[j],
        u = x.a[nc * i + j],
        b = fmt(u); // b:box
      r.h = Math.max(r.h, b.length);
      c.w = Math.max(c.w, b[0].length);
      c.t = Math.max(
        c.t,
        typeof u === 'string' && u.length === 1 ? 0 : u.isA ? 2 : 1
      );
      gr[j] = b;
    }
  }
  let step = 1;
  for (let d = x.s.length - 2; d > 0; d--) {
    step *= x.s[d];
    for (let i = step - 1; i < nr - 1; i += step) rows[i].bm++;
  }
  for (let j = 0; j < nc; j++) {
    const c = cols[j];
    if (j < nc - 1 && (c.t !== cols[j + 1].t || c.t)) c.rm++;
    if (c.t === 2) {
      c.lm++;
      c.rm++;
    }
  }
  const a = []; // result
  for (let i = 0; i < nr; i++) {
    const r = rows[i];
    for (let j = 0; j < nc; j++) {
      const c = cols[j],
        t = g[i][j],
        d = c.w - t[0].length,
        lft = ' '.repeat(c.lm + !!t.al * d),
        rgt = ' '.repeat(c.rm + !t.al * d);
      for (let k = 0; k < t.length; k++) t[k] = lft + t[k] + rgt;
      const btm = ' '.repeat(t[0].length);
      for (let h = r.h + r.bm - t.length; h > 0; h--) t.push(btm);
    }
    const nk = r.h + r.bm;
    for (let k = 0; k < nk; k++) {
      let s = '';
      for (let j = 0; j < nc; j++) s += g[i][j][k];
      a.push(s);
    }
  }
  return a;
};

export const aplToJs = (aplResult) => {
  return fmt(aplResult)[0]
    .split(' ')
    .map((x) => parseInt(x) || 0);
};

const apl = (input) => aplToJs(libraryApl(input));

const boardsToGridInput = ({ b, w }) => `
pb1←1 0 0 1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 1 0 0 1
pb2←0 0 0 0 0 0 0 0 1 0 1 0 1 0 0 0 0 0 0 0 0 0 1 0 1 0 1 0 0 0 0 0 0 0 0 0 1 0 1 0 1 0 0 0 0 0 0 0 0
pb3←0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 0 0 0 0 1 1 1 0 0 0 0 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
s1←{9↑⍵}
s2←{9↑9↓⍵}
s3←{18↓⍵}

w←${w}
ws1←pb1 \\ (s1 w)
ws2←pb2 \\ (s2 w)
ws3←pb3 \\ (s3 w)

combinedwhite ← ws1 ∨ ws2 ∨ ws3

b←${b}
bs1←pb1 \\ (s1 b)
bs2←pb2 \\ (s2 b)
bs3←pb3 \\ (s3 b)

combinedblack ← bs1 ∨ bs2 ∨ bs3
combinedblack ← 2× ¨ combinedblack

finalboard ← combinedwhite ∨ combinedblack
`;

export const boardsToGridArray = (boards) => apl(boardsToGridInput(boards));

export const aplPlacePiece = (board, aplIndex) =>
  apl(`b ← ${board} \n b[${aplIndex}] ← 1`);

export const aplRemovePiece = (board, aplIndex) =>
  apl(`b ← ${board} \n b[${aplIndex}] ← 0`);

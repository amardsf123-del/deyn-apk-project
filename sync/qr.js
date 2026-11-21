// Minimal QR Code generator (byte mode, error correction M, versions 1-14, auto mask). Output: array of rows of 0/1.
const EC = { // [ecCodewordsPerBlock, [[count, dataCodewords], ...]] for level M
  1: [10, [[1, 16]]], 2: [16, [[1, 28]]], 3: [26, [[1, 44]]], 4: [18, [[2, 32]]], 5: [24, [[2, 43]]], 6: [16, [[4, 27]]], 7: [18, [[4, 31]]], 8: [22, [[2, 38], [2, 39]]],
  9: [22, [[3, 36], [2, 37]]], 10: [26, [[4, 43], [1, 44]]], 11: [30, [[1, 50], [4, 51]]], 12: [22, [[6, 36], [2, 37]]], 13: [22, [[8, 37], [1, 38]]], 14: [24, [[4, 40], [5, 41]]] };
const ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50], 11: [6, 30, 54], 12: [6, 32, 58], 13: [6, 34, 62], 14: [6, 26, 46, 66] };
const EXP = new Array(512), LOG = new Array(256);
(() => { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
const mul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
function rsGen(n) { let g = [1]; for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return g; }
function rsEnc(data, n) { const g = rsGen(n), res = new Array(n).fill(0); for (const d of data) { const f = d ^ res[0]; res.shift(); res.push(0); if (f) for (let i = 0; i < n; i++) res[i] ^= mul(g[i + 1], f); } return res; }
const capacity = v => EC[v][1].reduce((a, [c, d]) => a + c * d, 0);
export function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  let v = 1; for (; v <= 14; v++) { const bits = 4 + (v < 10 ? 8 : 16) + bytes.length * 8; if (Math.ceil(bits / 8) <= capacity(v)) break; }
  if (v > 14) throw new Error('QR payload too long');
  const bits = []; const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
  const cap = capacity(v) * 8; for (let i = 0; i < 4 && bits.length < cap; i++) bits.push(0); while (bits.length % 8) bits.push(0);
  for (let p = 0xec; bits.length < cap; p ^= 0xec ^ 0x11) put(p, 8);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  const [ecn, groups] = EC[v], blocks = []; let pos = 0;
  for (const [cnt, dc] of groups) for (let i = 0; i < cnt; i++) { const d = data.slice(pos, pos + dc); pos += dc; blocks.push({ d, e: rsEnc(d, ecn) }); }
  const out = []; const maxd = Math.max(...blocks.map(b => b.d.length));
  for (let i = 0; i < maxd; i++) for (const b of blocks) if (i < b.d.length) out.push(b.d[i]);
  for (let i = 0; i < ecn; i++) for (const b of blocks) out.push(b.e[i]);
  const size = 17 + 4 * v, M = Array.from({ length: size }, () => new Array(size).fill(null));
  const setF = (r, c, val) => { if (r >= 0 && c >= 0 && r < size && c < size) M[r][c] = val; };
  const finder = (r, c) => { for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) { const on = (i >= 0 && i <= 6 && (j === 0 || j === 6)) || (j >= 0 && j <= 6 && (i === 0 || i === 6)) || (i >= 2 && i <= 4 && j >= 2 && j <= 4); setF(r + i, c + j, on ? 1 : 0); } };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) { setF(6, i, i % 2 === 0 ? 1 : 0); setF(i, 6, i % 2 === 0 ? 1 : 0); }
  const al = ALIGN[v]; for (const r of al) for (const c of al) { if ((r === 6 && c === 6) || (r === 6 && c === al[al.length - 1]) || (c === 6 && r === al[al.length - 1])) continue; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) setF(r + i, c + j, Math.max(Math.abs(i), Math.abs(j)) !== 1 ? 1 : 0); }
  setF(size - 8, 8, 1);
  const reserved = M.map(row => row.map(x => x !== null));
  for (let i = 0; i < 9; i++) { reserved[8][i] = true; reserved[i][8] = true; } for (let i = 0; i < 8; i++) { reserved[8][size - 1 - i] = true; reserved[size - 1 - i][8] = true; }
  if (v >= 7) { for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { reserved[i][size - 11 + j] = true; reserved[size - 11 + j][i] = true; } }
  const fill = (mask) => {
    const B = M.map(r => r.slice()); let bi = 0, up = true;
    const bitsOut = []; out.forEach(b => { for (let i = 7; i >= 0; i--) bitsOut.push((b >> i) & 1); });
    for (let c = size - 1; c > 0; c -= 2) { if (c === 6) c = 5; for (let k = 0; k < size; k++) { const r = up ? size - 1 - k : k; for (let cc = c; cc >= c - 1; cc--) { if (reserved[r][cc]) continue; let bit = bi < bitsOut.length ? bitsOut[bi++] : 0; const m = [(r + cc) % 2 === 0, r % 2 === 0, cc % 3 === 0, (r + cc) % 3 === 0, (Math.floor(r / 2) + Math.floor(cc / 3)) % 2 === 0, (r * cc) % 2 + (r * cc) % 3 === 0, ((r * cc) % 2 + (r * cc) % 3) % 2 === 0, ((r + cc) % 2 + (r * cc) % 3) % 2 === 0][mask]; B[r][cc] = bit ^ (m ? 1 : 0); } } up = !up; }
    // format info (EC level M = 00)
    let fmt = (0 << 3) | mask, rem = fmt; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537); const bitsF = ((fmt << 10) | rem) ^ 0x5412;
    for (let i = 0; i < 15; i++) { const bit = (bitsF >> i) & 1; if (i < 6) B[i][8] = bit; else if (i < 8) B[i + 1][8] = bit; else B[size - 15 + i][8] = bit; if (i < 8) B[8][size - 1 - i] = bit; else if (i < 9) B[8][15 - i] = bit; else B[8][15 - i - 1] = bit; }
    B[size - 8][8] = 1;
    if (v >= 7) { let r2 = v; for (let i = 0; i < 12; i++) r2 = (r2 << 1) ^ ((r2 >> 11) * 0x1f25); const vi = (v << 12) | r2; for (let i = 0; i < 18; i++) { const bit = (vi >> i) & 1, a = Math.floor(i / 3), b = i % 3 + size - 11; B[a][b] = bit; B[b][a] = bit; } }
    return B;
  };
  const penalty = B => { let p = 0; for (let r = 0; r < size; r++) { let run = 1; for (let c = 1; c < size; c++) { if (B[r][c] === B[r][c - 1]) { run++; if (c === size - 1 && run >= 5) p += run - 2; } else { if (run >= 5) p += run - 2; run = 1; } } } for (let c = 0; c < size; c++) { let run = 1; for (let r = 1; r < size; r++) { if (B[r][c] === B[r - 1][c]) { run++; if (r === size - 1 && run >= 5) p += run - 2; } else { if (run >= 5) p += run - 2; run = 1; } } } for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) if (B[r][c] === B[r][c + 1] && B[r][c] === B[r + 1][c] && B[r][c] === B[r + 1][c + 1]) p += 3; let dark = 0; B.forEach(r => r.forEach(x => dark += x)); p += Math.floor(Math.abs(dark * 100 / (size * size) - 50) / 5) * 10; return p; };
  let best = null, bp = Infinity; for (let m = 0; m < 8; m++) { const B = fill(m); const p = penalty(B); if (p < bp) { bp = p; best = B; } }
  return best;
}
export function qrSvg(text, px = 4) {
  const B = qrMatrix(text), n = B.length, q = 4, S = (n + 2 * q) * px; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (B[r][c]) d += `M${(c + q) * px} ${(r + q) * px}h${px}v${px}h${-px}z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="100%" shape-rendering="crispEdges"><rect width="${S}" height="${S}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

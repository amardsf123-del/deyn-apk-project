import { qrSvg } from './qr.js'; import fs from 'node:fs';
import { makeOffer } from './session.js';
const samples = ['hello', 'DEYN', 'x'.repeat(100), 'DEYNPAIR1:' + 'A'.repeat(180), makeOffer({ did: 'a'.repeat(32), idpub: 'B'.repeat(44), ip: '192.168.100.200', port: 48021, now: 1 }).text, 'ع'.repeat(30), 'y'.repeat(300)];
samples.forEach((s, i) => fs.writeFileSync('/tmp/qr' + i + '.svg', qrSvg(s, 8)));
fs.writeFileSync('/tmp/qr_samples.json', JSON.stringify(samples));

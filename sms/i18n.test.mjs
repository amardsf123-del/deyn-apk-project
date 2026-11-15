import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('./i18n.js', import.meta.url), 'utf8');
const match = source.match(/function dialectFr\(d\) \{[\s\S]*?\n  \}/);
assert.ok(match, 'dialectFr must exist in the French localization runtime');
const dialectFr = vm.runInNewContext('(' + match[0] + ')', { Math, Number, String });

const cases = [
  [5, '500 centimes'],
  [10, '1 mille'],
  [500, '50 mille'],
  [500.5, '50 mille et 50 centimes'],
  [10000, '1 million de centimes'],
  [14250, '1 million et 425 mille'],
  [15000, '1 million et demi de centimes'],
  [20000, '2 millions de centimes'],
  [0, '']
];
for (const [amount, expected] of cases) {
  assert.equal(dialectFr(amount), expected, 'French amount formatting for ' + amount + ' DA');
}
console.log('French amount formatting: centimes, mille, million(s), mixed remainders and zero passed');

import assert from 'node:assert/strict';

// Exercise deployed route wiring, not only the framework-independent handlers.
// Initialize a local D1 database before running this; never target production.
const base = new URL(process.argv[2] || 'http://127.0.0.1:8787');
assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Use a local Worker preview URL');
const labels = { agent: 'codex', campaign: 'organic', creative: 'none' };
const post = (path, body, browser = true, extra = {}) => fetch(new URL(path, base), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(browser ? { Origin: base.origin } : {}), ...extra },
  body: JSON.stringify(body),
  redirect: 'manual',
  signal: AbortSignal.timeout(10_000),
});

const event = { ...labels, event: 'setup_copy' };
assert.equal((await post('/api/launch-event', event)).status, 204, 'event route must reach local D1');
assert.equal((await post('/api/launch-event', event, false)).status, 403, 'event requires same-origin browser request');
assert.equal((await post('/api/launch-event', event, true, { DNT: '1' })).status, 403, 'DNT remains respected');
assert.equal((await post('/api/install-receipt', { ...labels, consent: false })).status, 400, 'receipt requires consent');
const receipt = await post('/api/install-receipt', { ...labels, consent: true });
assert.equal(receipt.status, 200, 'receipt route must reach local D1');
assert.equal(receipt.headers.get('cache-control'), 'no-store');
const { token } = await receipt.json();
assert.match(token, /^[0-9a-f-]{36}$/);
assert.equal((await post('/api/install-confirmation', { token })).status, 403, 'browser cannot redeem CLI receipt');
for (let i = 0; i < 2; i++) {
  assert.equal((await post('/api/install-confirmation', { token }, false)).status, 204, 'confirmation and retry must reach local D1');
}
console.log('PASS: all three Worker API routes use local D1; origin, DNT, consent, receipt, and confirmation responses remain intact.');

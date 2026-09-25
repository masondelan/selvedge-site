import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { browserEvent, confirmInstall, measuredCommand } from '../src/lib/measurement.mjs';

function database() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../migrations/0001_launch_metrics.sql', import.meta.url), 'utf8'));
  const db = {
    prepare(query) {
      return { bind(...values) { return { run() {
        return { meta: { changes: Number(sql.prepare(query).run(...values).changes) } };
      } }; } };
    },
    async batch(statements) {
      sql.exec('BEGIN');
      try { const result = statements.map(s => s.run()); sql.exec('COMMIT'); return result; }
      catch (error) { sql.exec('ROLLBACK'); throw error; }
    },
  };
  return { db, sql };
}
const labels = { agent: 'codex', campaign: 'agents-sep26', creative: 'revisit' };
function request(body, browser = true, extra = {}) {
  return new Request('https://selvedge.sh/api/test', { method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(browser ? { Origin: 'https://selvedge.sh' } : {}), ...extra },
    body: JSON.stringify(body),
  });
}

test('fixed labels persist counts; browser-only install forgery and unbounded input are rejected', async () => {
  const { db, sql } = database();
  for (let i = 0; i < 2; i++) assert.equal((await browserEvent(request({ ...labels, event: 'setup_copy' }), db)).status, 204);
  assert.equal(sql.prepare('SELECT count FROM daily_events').get().count, 2);
  for (const body of [{ ...labels, event: 'install_completed' }, { ...labels, event: 'setup_copy', campaign: 'untrusted' }, null]) {
    assert.equal((await browserEvent(request(body), db)).status, 400);
  }
  assert.equal((await browserEvent(request({ ...labels, event: 'setup_copy' }, false), db)).status, 403);
  assert.equal((await browserEvent(request({ ...labels, event: 'setup_copy' }, true, { DNT: '1' }), db)).status, 403);
  assert.equal((await browserEvent(request({ x: 'a'.repeat(600) }), db)).status, 413);
  assert.equal((await browserEvent(request({ ...labels, event: 'setup_copy' }), null)).status, 503);
  sql.close();
});

test('explicit consent, expiring receipt, success count and replay protection use transactional SQL', async () => {
  const { db, sql } = database();
  assert.equal((await browserEvent(request(labels), db, true)).status, 400);
  assert.equal((await browserEvent(request({ ...labels, consent: true }, true, { DNT: '1' }), db, true)).status, 403);
  const issued = await browserEvent(request({ ...labels, consent: true }), db, true);
  assert.equal(issued.status, 200);
  const { token } = await issued.json();
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM daily_events').get().n, 0);
  assert.equal((await confirmInstall(request({ token }), db)).status, 403);
  for (let i = 0; i < 2; i++) assert.equal((await confirmInstall(request({ token }, false), db)).status, 204);
  assert.deepEqual({ ...sql.prepare('SELECT event, count, campaign, creative FROM daily_events').get() }, {
    event: 'install_completed', count: 1, campaign: 'agents-sep26', creative: 'revisit',
  });
  sql.prepare('UPDATE install_receipts SET expires_at = 0').run();
  assert.equal((await confirmInstall(request({ token }, false), db)).status, 410);
  await browserEvent(request({ ...labels, consent: true }), db, true);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM install_receipts WHERE token = ?').get(token).n, 0);
  assert.equal((await confirmInstall(request({ token: crypto.randomUUID() }, false), db)).status, 410);
  assert.equal((await confirmInstall(request({ token: 'invalid' }, false), db)).status, 400);
  sql.close();
});

test('August labels work and storage failure does not report success', async () => {
  const { db, sql } = database();
  assert.equal((await browserEvent(request({ ...labels, campaign: 'aug26_test', creative: 'argument', event: 'landing_view' }), db)).status, 204);
  const broken = { prepare() { throw new Error('unavailable'); } };
  assert.equal((await browserEvent(request({ ...labels, event: 'activation_reported' }), broken)).status, 503);
  sql.close();
});

test('receipt issuance has a daily ceiling', async () => {
  const { db, sql } = database();
  sql.prepare(`WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<2000)
    INSERT INTO install_receipts SELECT CAST(x AS TEXT), ?, 'codex', 'organic', 'none', ?, 0 FROM n`)
    .run(new Date().toISOString().slice(0, 10), Math.floor(Date.now() / 1000) + 100);
  assert.equal((await browserEvent(request({ ...labels, consent: true }), db, true)).status, 429);
  sql.close();
});

test('shell receipt runs only after successful install/version and never blocks setup on a network failure', () => {
  const dir = mkdtempSync(join(tmpdir(), 'selvedge-receipt-'));
  try {
    for (const name of ['uv', 'selvedge', 'curl']) {
      writeFileSync(join(dir, name), `#!/bin/sh\necho "${name} $1" >> "$TRACE"\ncase "${name} $1" in\n'uv tool') exit "\${UV_EXIT:-0}";;\n'selvedge --version') exit "\${VERSION_EXIT:-0}";;\n'curl --fail') exit "\${CURL_EXIT:-0}";;\nesac\n`, { mode: 0o755 });
    }
    const command = measuredCommand('codex', crypto.randomUUID());
    for (const [env, expected] of [
      [{}, ['uv tool', 'selvedge --version', 'curl --fail', 'selvedge setup']],
      [{ UV_EXIT: '1' }, ['uv tool']],
      [{ VERSION_EXIT: '1' }, ['uv tool', 'selvedge --version']],
      [{ CURL_EXIT: '28' }, ['uv tool', 'selvedge --version', 'curl --fail', 'selvedge setup']],
    ]) {
      const trace = join(dir, 'trace'); writeFileSync(trace, '');
      spawnSync('/bin/sh', ['-c', command], { env: { PATH: dir, TRACE: trace, ...env } });
      assert.deepEqual(readFileSync(trace, 'utf8').trim().split('\n'), expected);
    }
    assert.throws(() => measuredCommand('codex; false', crypto.randomUUID()));
    assert.throws(() => measuredCommand('codex', '$(false)'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

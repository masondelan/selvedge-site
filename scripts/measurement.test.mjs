import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { browserEvent, confirmInstall, measuredCommand } from '../src/lib/measurement.mjs';
import { campaignLabels, placementCampaigns } from '../src/lib/campaigns.mjs';

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

test('DevHunt browser alias sends only the canonical label to event and optional receipt endpoints', async () => {
  const { db, sql } = database();
  const canonical = { agent: 'codex', ...campaignLabels('?utm_campaign=launch_2026_10_06') };
  assert.equal((await browserEvent(request({ ...canonical, event: 'landing_view' }), db)).status, 204);
  assert.equal((await browserEvent(request({ ...canonical, consent: false }), db, true)).status, 400);
  const issued = await browserEvent(request({ ...canonical, consent: true }), db, true);
  assert.equal(issued.status, 200);
  const { token } = await issued.json();
  assert.equal((await confirmInstall(request({ token }, false), db)).status, 204);
  assert.deepEqual(sql.prepare('SELECT DISTINCT campaign FROM daily_events').all().map(row => row.campaign), ['placement-devhunt']);
  assert.equal(sql.prepare('SELECT campaign FROM install_receipts').get().campaign, 'placement-devhunt');
  // Raw endpoint clients cannot create a second label for the same alias.
  assert.equal((await browserEvent(request({ ...canonical, campaign: 'launch_2026_10_06', event: 'landing_view' }), db)).status, 400);
  assert.equal((await browserEvent(request({ ...canonical, campaign: 'launch_2026_10_06', consent: true }), db, true)).status, 400);
  sql.close();
});

test('all fixed placements retain attribution across optional confirmation and separate recall reports', async () => {
  const { db, sql } = database();
  for (const campaign of Object.keys(placementCampaigns)) {
    const placement = { ...labels, campaign };
    const november = campaign === 'placement-reddit-nov26';
    assert.equal((await browserEvent(request({ ...placement, event: 'landing_view', agent: 'none' }), db)).status, november ? 400 : 204);
    for (const consent of [undefined, false]) {
      assert.equal((await browserEvent(request({ ...placement, consent }), db, true)).status, 400);
    }
    assert.equal((await browserEvent(request({ ...placement, consent: true }, true, { DNT: '1' }), db, true)).status, 403);
    const issued = await browserEvent(request({ ...placement, consent: true }), db, true);
    assert.equal(issued.status, 200);
    const { token } = await issued.json();
    assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM daily_events WHERE campaign=? AND event='install_completed'").get(campaign).n, 0);
    assert.equal((await confirmInstall(request({ token }, false, { DNT: '1' }), db)).status, 403);
    for (let i = 0; i < 2; i++) assert.equal((await confirmInstall(request({ token }, false), db)).status, 204);
    assert.equal((await browserEvent(request({ ...placement, event: 'activation_reported', ...(november ? { consent: true } : {}) }), db)).status, 204);
    assert.deepEqual(sql.prepare('SELECT event, agent, count FROM daily_events WHERE campaign=? ORDER BY event').all(campaign).map(row => ({ ...row })), [
      { event: 'activation_reported', agent: 'codex', count: 1 },
      { event: 'install_completed', agent: 'codex', count: 1 },
      ...(november ? [] : [{ event: 'landing_view', agent: 'none', count: 1 }]),
    ]);
  }
  const before = sql.prepare('SELECT COUNT(*) AS n FROM install_receipts').get().n;
  assert.equal((await browserEvent(request({ ...labels, campaign: 'placement-unlisted', consent: true }), db, true)).status, 400);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM install_receipts').get().n, before);
  sql.close();
});

test('placement report reads event totals without changing data or attributing historical campaigns', () => {
  const { sql } = database();
  const insert = sql.prepare('INSERT INTO daily_events (day,event,agent,campaign,creative,count) VALUES (?,?,?,?,?,?)');
  for (const [event, agent, campaign, creative, count] of [
    ['landing_view', 'none', 'placement-tensorblock', 'none', 5],
    ['landing_view', 'none', 'placement-tensorblock', 'revisit', 2],
    ['install_completed', 'codex', 'placement-tensorblock', 'none', 3],
    ['activation_reported', 'codex', 'placement-tensorblock', 'none', 1],
    ['landing_view', 'none', 'agents-sep26', 'none', 9],
    ['landing_view', 'none', 'organic', 'none', 4],
  ]) insert.run('2026-10-08', event, agent, campaign, creative, count);
  const before = sql.prepare('SELECT total_changes() AS n').get().n;
  const report = sql.prepare(readFileSync(new URL('./placement-metrics.sql', import.meta.url), 'utf8')).all().map(row => ({ ...row }));
  assert.deepEqual(report, [
    { day: '2026-10-08', placement_campaign: 'placement-tensorblock', agent: 'codex', tagged_page_view_events: 0, prompt_copy_events: 0, setup_copy_events: 0, install_or_upgrade_confirmations: 3, recalled_decision_self_reports: 1 },
    { day: '2026-10-08', placement_campaign: 'placement-tensorblock', agent: 'none', tagged_page_view_events: 7, prompt_copy_events: 0, setup_copy_events: 0, install_or_upgrade_confirmations: 0, recalled_decision_self_reports: 0 },
  ]);
  assert.equal(sql.prepare('SELECT total_changes() AS n').get().n, before);
  sql.close();
});

test('November stores only explicitly requested confirmations and recall reports, never automatic events', async () => {
  const { db, sql } = database();
  const automaticEvents = ['landing_view', 'start_click', 'demo_click', 'agent_select', 'install_copy', 'setup_copy', 'prompt_copy', 'agent_docs'];
  for (const creative of ['decision-reasons', 'rejected-approaches', 'switch-tools', 'none', 'revisit']) {
    const reddit = { agent: 'codex', campaign: 'placement-reddit-nov26', creative };
    const before = sql.prepare('SELECT total_changes() AS n').get().n;
    for (const event of automaticEvents) {
      for (const consent of [undefined, false, true]) {
        assert.equal((await browserEvent(request({ ...reddit, event, consent }), db)).status, 400);
      }
    }
    for (const consent of [undefined, false, 'true', 1, [], {}]) {
      assert.equal((await browserEvent(request({ ...reddit, consent }), db, true)).status, 400);
      assert.equal((await browserEvent(request({ ...reddit, event: 'activation_reported', consent }), db)).status, 400);
    }
    for (const headers of [{ DNT: '1' }, { Origin: 'https://other.example' }]) {
      assert.equal((await browserEvent(request({ ...reddit, event: 'activation_reported', consent: true }, true, headers), db)).status, 403);
      assert.equal((await browserEvent(request({ ...reddit, consent: true }, true, headers), db, true)).status, 403);
    }
    for (const invalid of [{ campaign: 'placement-reddit-nov27' }, { creative: `${creative}-extra` }]) {
      assert.equal((await browserEvent(request({ ...reddit, ...invalid, event: 'activation_reported', consent: true }), db)).status, 400);
      assert.equal((await browserEvent(request({ ...reddit, ...invalid, consent: true }), db, true)).status, 400);
    }
    assert.equal((await browserEvent(request({ ...reddit, agent: 'none', consent: true }), db, true)).status, 400);
    assert.equal((await browserEvent(request({ ...reddit, event: 'install_completed' }), db)).status, 400);
    assert.equal(sql.prepare('SELECT total_changes() AS n').get().n, before, 'rejected requests must not write events or receipts');

    const issued = await browserEvent(request({ ...reddit, consent: true }), db, true);
    assert.equal(issued.status, 200);
    const { token } = await issued.json();
    assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM daily_events WHERE creative=?').get(creative).n, 0, 'preparation must not count as installation or recall');
    assert.deepEqual({ ...sql.prepare('SELECT agent, campaign, creative FROM install_receipts WHERE token=?').get(token) }, reddit);
    const prepared = sql.prepare('SELECT total_changes() AS n').get().n;
    for (const event of automaticEvents) {
      assert.equal((await browserEvent(request({ ...reddit, event, consent: true }), db)).status, 400);
    }
    assert.equal(sql.prepare('SELECT total_changes() AS n').get().n, prepared, 'receipt preparation must not authorize automatic events');
    assert.equal((await confirmInstall(request({ token }), db)).status, 403);
    assert.equal((await confirmInstall(request({ token }, false, { DNT: '1' }), db)).status, 403);
    for (let i = 0; i < 2; i++) assert.equal((await confirmInstall(request({ token }, false), db)).status, 204);
    assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM daily_events WHERE creative=? AND event='activation_reported'").get(creative).n, 0, 'confirmation must not imply recall');
    assert.equal((await browserEvent(request({ ...reddit, event: 'activation_reported', consent: true }), db)).status, 204);
    assert.deepEqual(sql.prepare('SELECT event, agent, campaign, creative, count FROM daily_events WHERE creative=? ORDER BY event').all(creative).map(row => ({ ...row })), [
      { ...reddit, event: 'activation_reported', count: 1 },
      { ...reddit, event: 'install_completed', count: 1 },
    ]);
    sql.prepare('UPDATE install_receipts SET expires_at = 0 WHERE token=?').run(token);
    assert.equal((await confirmInstall(request({ token }, false), db)).status, 410);
    assert.equal((await confirmInstall(request({ token: 'invalid' }, false), db)).status, 400);
    assert.equal((await confirmInstall(request({ token: crypto.randomUUID() }, false), db)).status, 410);
  }
  assert.equal((await browserEvent(request({ agent: 'none', campaign: 'placement-reddit-nov26', creative: 'none', event: 'activation_reported', consent: true }), db)).status, 204, 'a voluntary recall report does not require a setup preset');
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM daily_events WHERE event NOT IN ('install_completed', 'activation_reported')").get().n, 0);
  sql.close();
});

test('rejected November events never access D1, even when D1 is unavailable', async () => {
  const forbidden = { prepare() { assert.fail('denied event reached D1'); }, batch() { assert.fail('denied event reached D1'); } };
  for (const db of [forbidden, null]) {
    for (const event of ['landing_view', 'start_click', 'demo_click', 'agent_select', 'install_copy', 'setup_copy', 'prompt_copy', 'agent_docs', 'install_completed']) {
      assert.equal((await browserEvent(request({ agent: 'none', campaign: 'placement-reddit-nov26', creative: 'none', event, consent: true }), db)).status, 400);
    }
    assert.equal((await browserEvent(request({ agent: 'none', campaign: 'placement-reddit-nov26', creative: 'none', event: 'activation_reported' }), db)).status, 400);
  }
});

test('new November creative labels cannot be written under historical or organic campaigns', async () => {
  const forbidden = { prepare() { assert.fail('invalid creative/campaign pair reached D1'); }, batch() { assert.fail('invalid creative/campaign pair reached D1'); } };
  for (const campaign of ['organic', 'agents-sep26', 'aug26_test', ...Object.keys(placementCampaigns).filter(value => value !== 'placement-reddit-nov26')]) {
    for (const creative of ['decision-reasons', 'rejected-approaches', 'switch-tools']) {
      const body = { agent: 'codex', campaign, creative, consent: true };
      for (const event of ['setup_copy', 'activation_reported']) assert.equal((await browserEvent(request({ ...body, event }), forbidden)).status, 400);
      assert.equal((await browserEvent(request(body), forbidden, true)).status, 400);
    }
  }
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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { track } from '../src/lib/launch-events.ts';

function browser(t, search, doNotTrack = '0') {
  for (const [name, value] of Object.entries({ location: { search }, navigator: { doNotTrack } })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true });
    t.after(() => descriptor ? Object.defineProperty(globalThis, name, descriptor) : delete globalThis[name]);
  }
  return t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }));
}

test('November tracking makes zero requests except a deliberately submitted recall report', async t => {
  const fetch = browser(t, '');
  for (const creative of ['decision-reasons', 'rejected-approaches', 'switch-tools', 'none', 'revisit', 'untrusted']) {
    location.search = `?utm_campaign=placement-reddit-nov26&utm_content=${creative}`;
    const before = fetch.mock.callCount();
    for (const event of ['landing_view', 'start_click', 'demo_click', 'agent_select', 'install_copy', 'setup_copy', 'prompt_copy', 'agent_docs', 'install_completed']) {
      for (const consent of [undefined, false, true]) assert.equal(await track(event, 'codex', consent), false);
    }
    for (const consent of [undefined, false, 'true', 1, [], {}]) assert.equal(await track('activation_reported', 'none', consent), false);
    assert.equal(fetch.mock.callCount(), before, 'automatic/invalid-consent events must not reach fetch');

    assert.equal(await track('activation_reported', 'none', true), true);
    assert.equal(fetch.mock.callCount(), before + 1);
    const [url, options] = fetch.mock.calls.at(-1).arguments;
    assert.equal(url, '/api/launch-event');
    assert.equal(options.credentials, 'omit');
    assert.deepEqual(JSON.parse(options.body), {
      event: 'activation_reported', agent: 'none', campaign: 'placement-reddit-nov26',
      creative: creative === 'untrusted' ? 'none' : creative, consent: true,
    });
    assert.equal(await track('setup_copy', 'codex', true), false, 'a recall submission does not grant continuing consent');
    assert.equal(fetch.mock.callCount(), before + 1);
  }
});

test('DNT suppresses even an explicitly requested November report', async t => {
  const fetch = browser(t, '?utm_campaign=placement-reddit-nov26&utm_content=switch-tools', '1');
  assert.equal(await track('activation_reported', 'codex', true), false);
  assert.equal(fetch.mock.callCount(), 0);
});

test('legacy event payloads and network-failure behavior remain unchanged', async t => {
  const fetch = browser(t, '');
  for (const campaign of ['organic', 'agents-sep26', 'aug26_test', 'placement-tensorblock']) {
    location.search = `?utm_campaign=${campaign}&utm_content=revisit`;
    for (const [event, consent] of [['setup_copy', undefined], ['activation_reported', true]]) {
      assert.equal(await track(event, 'codex', consent), true);
      assert.deepEqual(JSON.parse(fetch.mock.calls.at(-1).arguments[1].body), { event, agent: 'codex', campaign, creative: 'revisit' });
    }
  }
  fetch.mock.mockImplementation(async () => { throw new Error('offline'); });
  assert.equal(await track('setup_copy', 'codex'), false);
});

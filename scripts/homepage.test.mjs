import test from 'node:test';
import assert from 'node:assert/strict';
import { legacyDestination } from '../src/data/homepage.mjs';

test('old setup campaigns retain selected agent and attribution at the new setup location', () => {
  assert.equal(
    legacyDestination('#choose-your-agent', '?utm_campaign=agents-sep26&utm_content=next-agent&agent=codex'),
    '/start/quickstart/?utm_campaign=agents-sep26&utm_content=next-agent&agent=codex#choose-your-agent',
  );
  assert.equal(legacyDestination('#try-the-demo'), '/start/quickstart/#install');
});

test('ordinary homepage anchors stay on the homepage; unknown input cannot become a redirect', () => {
  for (const hash of ['', '#_top', '#setup-prompt', '#unknown', 'https://example.com']) {
    assert.equal(legacyDestination(hash), null);
  }
});

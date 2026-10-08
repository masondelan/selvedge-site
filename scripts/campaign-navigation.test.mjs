import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campaigns, campaignLabels, placementCampaigns } from '../src/lib/campaigns.mjs';
import { campaignLink, initializeCampaignPage } from '../src/lib/campaign-navigation.mjs';
import { legacyDestination } from '../src/data/homepage.mjs';

const origin = 'https://selvedge.sh';
const tagged = `${origin}/?utm_campaign=placement-tensorblock&utm_content=revisit&private=never-copy`;

function documentWithLinks(hrefs) {
  const links = hrefs.map(value => {
    const attributes = new Map(typeof value === 'string' ? [['href', value]] : Object.entries(value));
    const link = {
      getAttribute: name => attributes.get(name),
      hasAttribute: name => attributes.has(name),
      setAttribute: (name, value) => attributes.set(name, value),
      closest: () => link,
    };
    return link;
  });
  const listeners = new Map();
  return { querySelectorAll: () => links, links,
    addEventListener: (event, callback) => listeners.set(event, callback),
    dispatch: (event, target) => listeners.get(event)?.({ target }),
  };
}

test('placement campaign allowlist is shared, bounded and rejects arbitrary query labels', () => {
  assert.equal(Object.keys(placementCampaigns).length, 19);
  for (const campaign of [...Object.keys(placementCampaigns), 'agents-sep26', 'aug26_test', 'organic']) {
    assert.ok(campaigns.has(campaign));
    assert.deepEqual(campaignLabels(`?utm_campaign=${campaign}&utm_content=revisit`), { campaign, creative: 'revisit' });
  }
  for (const search of ['', '?utm_campaign=placement-future', '?utm_campaign=Placement-tensorblock', '?utm_source=placement-tensorblock', '?utm_campaign=https://private.example/path']) {
    assert.deepEqual(campaignLabels(search), { campaign: 'organic', creative: 'none' });
  }
  assert.deepEqual(campaignLabels('?utm_campaign=placement-cline&utm_campaign=placement-devhunt&utm_content=arbitrary'), {
    campaign: 'placement-cline', creative: 'none',
  });
});

test('same-origin setup and verification links retain target state and only carry fixed source labels', () => {
  for (const href of ['/start/quickstart/?agent=codex#install', `${origin}/start/quickstart/?agent=codex#install`, '//selvedge.sh/start/quickstart/?agent=codex#install']) {
    const result = new URL(campaignLink(href, tagged), origin);
    assert.equal(result.pathname, '/start/quickstart/');
    assert.equal(result.hash, '#install');
    assert.deepEqual(Object.fromEntries(result.searchParams), { agent: 'codex', utm_campaign: 'placement-tensorblock', utm_content: 'revisit' });
  }
  const quickstart = new URL(campaignLink('/start/quickstart/#install', tagged), origin);
  const guide = new URL(campaignLink('../../guides/mcp-setup/', quickstart), origin);
  const verification = new URL(campaignLink('/guides/verify-first-decision', guide), origin);
  const returned = new URL(campaignLink('/start/quickstart/?agent=claude-code#choose-your-agent', verification), origin);
  for (const url of [quickstart, guide, verification, returned]) {
    assert.equal(url.searchParams.get('utm_campaign'), 'placement-tensorblock');
    assert.equal(url.searchParams.get('utm_content'), 'revisit');
    assert.equal(url.searchParams.has('private'), false);
  }
  assert.equal(returned.searchParams.get('agent'), 'claude-code');
  assert.equal(returned.hash, '#choose-your-agent');
  const explicit = '/start/quickstart/?utm_campaign=agents-sep26&utm_content=argument#install';
  assert.equal(campaignLink(explicit, tagged), explicit);
  assert.equal(campaignLink('/start/quickstart/', `${origin}/?utm_campaign=untrusted&utm_content=revisit`), '/start/quickstart/');
  assert.equal(campaignLink('/start/quickstart/', `${origin}/?utm_campaign=placement-cline&utm_content=untrusted`), '/start/quickstart/?utm_campaign=placement-cline');
});

test('the published DevHunt alias becomes a canonical placement on home and direct quickstart visits', () => {
  const events = [];
  for (const pathname of ['/', '/start/quickstart/']) {
    const url = `${origin}${pathname}?utm_campaign=launch_2026_10_06&utm_content=revisit`;
    const page = documentWithLinks(['/start/quickstart/?agent=codex#install', '/guides/verify-first-decision/']);
    const track = (event, agent) => events.push({ event, agent, ...campaignLabels(new URL(url).search) });
    initializeCampaignPage(page, url, '0', track);
    initializeCampaignPage(page, url, '0', track);
    assert.equal(page.links[0].getAttribute('href'), '/start/quickstart/?agent=codex&utm_campaign=placement-devhunt&utm_content=revisit#install');
    assert.equal(page.links[1].getAttribute('href'), '/guides/verify-first-decision/?utm_campaign=placement-devhunt&utm_content=revisit');
  }
  assert.deepEqual(events, Array.from({ length: 2 }, () => ({ event: 'landing_view', agent: 'none', campaign: 'placement-devhunt', creative: 'revisit' })));
  assert.equal(campaigns.has('launch_2026_10_06'), false);
  for (const campaign of ['launch_2026_10_07', 'LAUNCH_2026_10_06', 'launch_2026_10_06-extra']) {
    assert.equal(campaignLabels(`?utm_campaign=${campaign}`).campaign, 'organic');
  }
  initializeCampaignPage(documentWithLinks([]), `${origin}/?utm_campaign=launch_2026_10_06`, '1', () => assert.fail('DNT must suppress alias events'));
});

test('external, fragment, API, download and non-navigation links stay untouched', () => {
  for (const href of ['', '#install', ' #install', 'https://github.com/masondelan/selvedge', '//other.example/start/', 'mailto:hello@example.com', 'javascript:void(0)', 'data:text/plain,hello', '/api/install-receipt', '/api', '/llms.txt', '/sitemap-index.xml', '/image.svg', 'https://user:password@selvedge.sh/start/quickstart/']) {
    assert.equal(campaignLink(href, tagged), href);
  }
  const page = documentWithLinks([{ href: '/download/', download: '' }]);
  initializeCampaignPage(page, tagged, '0', () => {});
  assert.equal(page.links[0].getAttribute('href'), '/download/');
});

test('links added later by search retain labels on ordinary, middle-click and context-menu navigation', () => {
  const page = documentWithLinks([]);
  const events = [];
  initializeCampaignPage(page, tagged, '0', (...args) => events.push(args));
  for (const event of ['click', 'auxclick', 'contextmenu']) {
    const link = documentWithLinks(['/guides/verify-first-decision/#save']).links[0];
    page.dispatch(event, link);
    assert.equal(link.getAttribute('href'), '/guides/verify-first-decision/?utm_campaign=placement-tensorblock&utm_content=revisit#save');
    page.dispatch(event, {});
    const external = documentWithLinks(['https://example.com/']).links[0];
    page.dispatch(event, external);
    assert.equal(external.getAttribute('href'), 'https://example.com/');
  }
  assert.deepEqual(events, [['landing_view', 'none']]);
});

test('tagged homepage, direct quickstart and verification count at most once per document', () => {
  const events = [];
  for (const pathname of ['/', '/start/quickstart/', '/guides/verify-first-decision/']) {
    const page = documentWithLinks(['/start/quickstart/#install', '#local']);
    const url = `${origin}${pathname}?utm_campaign=placement-tensorblock`;
    const track = (...args) => events.push(args);
    initializeCampaignPage(page, url, '0', track);
    initializeCampaignPage(page, url, '0', track);
    assert.equal(page.links[0].getAttribute('href'), '/start/quickstart/?utm_campaign=placement-tensorblock#install');
    assert.equal(page.links[1].getAttribute('href'), '#local');
  }
  assert.deepEqual(events, Array.from({ length: 3 }, () => ['landing_view', 'none']));
});

test('older launch campaigns retain homepage-only landing semantics, including their legacy redirects', () => {
  for (const campaign of ['agents-sep26', 'aug26_test']) {
    for (const [path, expected] of [['/', 1], ['/#choose-your-agent', 1], ['/start/quickstart/', 0], ['/guides/verify-first-decision/', 0]]) {
      const url = new URL(path, origin);
      url.searchParams.set('utm_campaign', campaign);
      const events = [];
      initializeCampaignPage(documentWithLinks([]), url, '0', (...args) => events.push(args));
      assert.equal(events.length, expected, `${campaign} on ${path}`);
    }
  }
});

test('unknown and organic pages, DNT and transient legacy redirects do not emit page-view events', () => {
  for (const [url, dnt] of [[origin, '0'], [`${origin}/?utm_campaign=untrusted`, '0'], [`${origin}/?utm_campaign=organic`, '0'], [tagged, '1'], [`${tagged}#choose-your-agent`, '0']]) {
    const page = documentWithLinks(['/start/quickstart/#install']);
    const events = [];
    initializeCampaignPage(page, url, dnt, (...args) => events.push(args));
    assert.deepEqual(events, []);
    assert.equal(page.links[0].getAttribute('href'), '/start/quickstart/#install');
  }
  const destination = legacyDestination('#choose-your-agent', '?utm_campaign=placement-tensorblock');
  const events = [];
  initializeCampaignPage(documentWithLinks([]), new URL(destination, origin), '0', (...args) => events.push(args));
  assert.deepEqual(events, [['landing_view', 'none']]);
});

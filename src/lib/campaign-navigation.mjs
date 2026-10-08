import { campaignLabels, placementCampaigns } from './campaigns.mjs';
import { legacyDestination } from '../data/homepage.mjs';

/** Carry only fixed labels to same-origin documentation pages, retaining the target's state. */
export function campaignLink(href, pageUrl) {
  if (!href || href.trim().startsWith('#')) return href;
  try {
    const current = new URL(pageUrl);
    const { campaign, creative } = campaignLabels(current.search);
    if (campaign === 'organic') return href;
    const target = new URL(href, current);
    if (!['http:', 'https:'].includes(target.protocol) || target.origin !== current.origin
      || target.username || target.password || /^\/api(?:\/|$)/.test(target.pathname)
      || target.pathname.split('/').pop().includes('.') || target.searchParams.has('utm_campaign')) return href;
    target.searchParams.set('utm_campaign', campaign);
    if (creative !== 'none' && !target.searchParams.has('utm_content')) target.searchParams.set('utm_content', creative);
    return target.pathname + target.search + target.hash;
  } catch { return href; }
}

const initializedPages = new WeakSet();

/** One tagged page-view attempt per document, without visitor or session state. */
export function initializeCampaignPage(page, pageUrl, doNotTrack, track) {
  if (initializedPages.has(page)) return;
  initializedPages.add(page);
  if (doNotTrack === '1') return;
  const current = new URL(pageUrl);
  const { campaign } = campaignLabels(current.search);
  if (campaign === 'organic') return;
  const placement = Object.hasOwn(placementCampaigns, campaign);
  // New placements count the destination of immediate legacy homepage redirects.
  if (placement && current.pathname === '/' && legacyDestination(current.hash, current.search)) return;
  const tagLink = link => {
    if (!link || link.hasAttribute('download')) return;
    const href = link.getAttribute('href');
    const tagged = campaignLink(href, current);
    if (tagged !== href) link.setAttribute('href', tagged);
  };
  for (const link of page.querySelectorAll('a[href]')) tagLink(link);
  // Search results are added after initialization. Tag before navigation, including
  // opening a result in another tab, without observing or storing search text.
  for (const event of ['click', 'auxclick', 'contextmenu']) {
    page.addEventListener(event, interaction => tagLink(interaction.target?.closest?.('a[href]')), true);
  }
  // Existing launch campaigns retain their historical homepage-only metric.
  if (placement || current.pathname === '/') void track('landing_view', 'none');
}

// No cookies or visitor identifiers. Funnel events are not verified installs.
import { campaigns, creatives } from './measurement.mjs';
export function getCampaign(): string {
  const value = new URLSearchParams(location.search).get('utm_campaign') || '';
  return campaigns.has(value) ? value : 'organic';
}
export function getCreative(): string {
  const value = new URLSearchParams(location.search).get('utm_content') || '';
  return creatives.has(value) ? value : 'none';
}
export async function track(event: string, agent: string): Promise<boolean> {
  if (navigator.doNotTrack === '1') return false;
  try {
    const response = await fetch('/api/launch-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, agent, campaign: getCampaign(), creative: getCreative() }),
      keepalive: true, credentials: 'omit',
    });
    return response.ok;
  } catch { return false; }
}

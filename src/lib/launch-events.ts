// No cookies or visitor identifiers. Funnel events are not verified installs.
import { campaignLabels } from './campaigns.mjs';
export function getCampaign(): string {
  return campaignLabels(location.search).campaign;
}
export function getCreative(): string {
  return campaignLabels(location.search).creative;
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

// No cookies or visitor identifiers. Funnel events are not verified installs.
import { browserEventAllowed, campaignLabels } from './campaigns.mjs';
export function getCampaign(): string {
  return campaignLabels(location.search).campaign;
}
export function getCreative(): string {
  return campaignLabels(location.search).creative;
}
export async function track(event: string, agent: string, consent = false): Promise<boolean> {
  if (navigator.doNotTrack === '1') return false;
  const labels = campaignLabels(location.search);
  if (!browserEventAllowed(labels.campaign, event, consent)) return false;
  try {
    const response = await fetch('/api/launch-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, agent, ...labels,
        ...(labels.campaign === 'placement-reddit-nov26' && consent === true ? { consent: true } : {}),
      }),
      keepalive: true, credentials: 'omit',
    });
    return response.ok;
  } catch { return false; }
}

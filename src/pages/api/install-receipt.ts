import type { APIRoute } from 'astro';
import { browserEvent } from '../../lib/measurement.mjs';
export const prerender = false;
export const POST: APIRoute = ({ request, locals }) => browserEvent(request, locals.runtime.env.LAUNCH_METRICS, true);

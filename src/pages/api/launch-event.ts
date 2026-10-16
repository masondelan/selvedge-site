import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { browserEvent } from '../../lib/measurement.mjs';
export const prerender = false;
export const POST: APIRoute = ({ request }) => browserEvent(request, env.LAUNCH_METRICS);

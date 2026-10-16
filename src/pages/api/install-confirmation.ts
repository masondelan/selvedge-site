import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { confirmInstall } from '../../lib/measurement.mjs';
export const prerender = false;
export const POST: APIRoute = ({ request }) => confirmInstall(request, env.LAUNCH_METRICS);

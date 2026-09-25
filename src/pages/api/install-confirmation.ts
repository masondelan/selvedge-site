import type { APIRoute } from 'astro';
import { confirmInstall } from '../../lib/measurement.mjs';
export const prerender = false;
export const POST: APIRoute = ({ request, locals }) => confirmInstall(request, locals.runtime.env.LAUNCH_METRICS);

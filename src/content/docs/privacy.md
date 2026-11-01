---
title: Website privacy
description: Anonymous website counts and optional install confirmations.
---

Except for the November 2026 Reddit campaign described below, the website records anonymous interaction events: page views from recognized campaign or placement links, setup and demo clicks, selected agent, copied setup prompts and commands, documentation clicks, and optional “saved and recalled a decision” confirmations.

Stored daily counts contain only the UTC day, event type, selected agent, fixed campaign and creative labels, and total count. They use no cookies, persistent visitor IDs, advertising pixels or browser fingerprinting. They contain no project files, decisions, chat contents, email addresses or contact details. Browsers sending Do Not Track are excluded.

Recognized labels in a link's `utm_campaign` and `utm_content` parameters can carry through same-origin documentation links. We do not infer a placement from referrers or record referrers. For automatically measured placement labels, each tagged page load can count once; visiting another page or reloading can count again. Older launch campaigns count homepage views only. These are page-view events, not unique visitors or person-level conversion rates. A tagged link can be shared elsewhere, so its label is not proof of where a visitor found it. Untagged visits cannot be assigned to an earlier directory submission.

The older DevHunt URL label `launch_2026_10_06` is recognized as `placement-devhunt` for new placement events. This does not reassign stored historical counts.

Daily aggregate counts are stored in Cloudflare D1. We do not store request headers or IP addresses in these counts. Cloudflare also processes normal website requests and operational logs to serve and protect the site. See [Cloudflare’s privacy policy](https://www.cloudflare.com/privacypolicy/).

Copied prompts and commands are expressions of interest, not confirmed installations. Copying the homepage prompt does not send it to an AI service; you choose where to paste it. The optional success button is a self-reported outcome; it does not inspect your machine.

## November 2026 Reddit campaign

Links labeled `placement-reddit-nov26` retain their fixed campaign and creative labels for the optional install/upgrade confirmation and voluntary recall report only. They send no automatic page-view, click, agent-selection or copy events; the server rejects those events for this campaign. Deliberately submitting the recall button sends the selected setup preset, if any, and fixed campaign/creative labels with a boolean consent flag that the server checks but does not store. It does not enable subsequent collection. Do Not Track also suppresses these optional reports.

This campaign has no collected site-visit denominator. A zero page-view count means those views were not collected, not that nobody visited. Optional confirmations and recall reports do not establish unique new users, retention or a person-level conversion rate. Other campaigns' existing automatic measurement remains unchanged; this campaign-specific boundary does not make all website measurement opt-in.

## Optional install confirmation

The agent setup flow offers a separate optional command for bash and zsh. Preparing it creates a random one-use receipt code, stored with the day, selected agent and fixed campaign/creative labels. Running it sends that code to `selvedge.sh` only after `uv tool install --upgrade selvedge` and `selvedge --version` succeed. The subsequent agent setup is separate: an install confirmation does not prove successful configuration, a first saved decision, or continued use.

Each code can increase the install count once. It expires after seven days; expired receipt records are removed when the next code is issued. Only daily aggregate counts remain after cleanup. The code is not a machine identifier and is not reused for ongoing tracking. Repeat installs or upgrades using a new code can count again, so these are voluntary install/upgrade confirmations, not unique people or new users. Anyone can call the public endpoint; a receipt is not independent proof of an installation.

The regular install command sends no confirmation. Browsers with Do Not Track enabled cannot prepare the optional command. A confirmation network failure does not prevent agent setup. No data is sent to Reddit, and these counts are not Reddit-attributed conversions.

The local Selvedge product is separate from website events. Its optional usage telemetry remains off by default. See [the product documentation](https://github.com/masondelan/selvedge).

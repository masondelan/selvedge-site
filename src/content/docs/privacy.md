---
title: Website privacy
description: Anonymous website counts and optional install confirmations.
---

The website records anonymous interaction events: visits from our campaign, setup and demo clicks, selected agent, copied commands, documentation clicks, and optional “saved and recalled a decision” confirmations.

Each interaction event contains only its type, the selected agent, and fixed campaign and creative labels. Daily counts use no cookies, persistent visitor IDs, advertising pixels or browser fingerprinting. They contain no project files, decisions, chat contents, email addresses or contact details. Browsers sending Do Not Track are excluded.

Daily aggregate counts are stored in Cloudflare D1. We do not store request headers or IP addresses in these counts. Cloudflare also processes normal website requests and operational logs to serve and protect the site. See [Cloudflare’s privacy policy](https://www.cloudflare.com/privacypolicy/).

Copied commands are expressions of interest, not confirmed installations. The optional success button is a self-reported outcome; it does not inspect your machine.

## Optional install confirmation

The agent setup flow offers a separate optional command for bash and zsh. Preparing it creates a random one-use receipt code, stored with the day, selected agent and fixed campaign/creative labels. Running it sends that code to `selvedge.sh` only after `uv tool install --upgrade selvedge` and `selvedge --version` succeed. The subsequent agent setup is separate: an install confirmation does not prove successful configuration, a first saved decision, or continued use.

Each code can increase the install count once. It expires after seven days; expired receipt records are removed when the next code is issued. Only daily aggregate counts remain after cleanup. The code is not a machine identifier and is not reused for ongoing tracking. Repeat installs or upgrades using a new code can count again, so these are voluntary install/upgrade confirmations, not unique people or new users. Anyone can call the public endpoint; a receipt is not independent proof of an installation.

The regular install command sends no confirmation. Browsers with Do Not Track enabled cannot prepare the optional command. A confirmation network failure does not prevent agent setup. No data is sent to Reddit, and these counts are not Reddit-attributed conversions.

The local Selvedge product is separate from website events. Its optional usage telemetry remains off by default. See [the product documentation](https://github.com/masondelan/selvedge).

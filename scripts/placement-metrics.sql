-- Private, read-only operational report via authenticated Wrangler.
-- New tagged links only: there is no retroactive attribution of earlier submissions.
-- Each tagged document load is a page-view event; navigation and reloads count again.
-- These are not unique visitors, new users, or person-level conversion rates.
SELECT day, campaign AS placement_campaign, agent,
  SUM(CASE WHEN event = 'landing_view' THEN count ELSE 0 END) AS tagged_page_view_events,
  SUM(CASE WHEN event = 'prompt_copy' THEN count ELSE 0 END) AS prompt_copy_events,
  SUM(CASE WHEN event = 'setup_copy' THEN count ELSE 0 END) AS setup_copy_events,
  SUM(CASE WHEN event = 'install_completed' THEN count ELSE 0 END) AS install_or_upgrade_confirmations,
  SUM(CASE WHEN event = 'activation_reported' THEN count ELSE 0 END) AS recalled_decision_self_reports
FROM daily_events
WHERE campaign LIKE 'placement-%'
GROUP BY day, campaign, agent
ORDER BY day DESC, campaign, agent;

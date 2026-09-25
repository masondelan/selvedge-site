-- Private operational report via authenticated Wrangler, never a public endpoint.
SELECT day, campaign, creative,
  SUM(CASE WHEN event = 'landing_view' THEN count ELSE 0 END) AS landing_views,
  SUM(CASE WHEN event = 'setup_copy' THEN count ELSE 0 END) AS setup_copies,
  SUM(CASE WHEN event = 'install_completed' THEN count ELSE 0 END) AS install_or_upgrade_confirmations,
  SUM(CASE WHEN event = 'activation_reported' THEN count ELSE 0 END) AS saved_and_recalled_self_reports
FROM daily_events
GROUP BY day, campaign, creative
ORDER BY day DESC, campaign, creative;

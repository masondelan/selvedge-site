CREATE TABLE daily_events (
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  agent TEXT NOT NULL,
  campaign TEXT NOT NULL,
  creative TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(day, event, agent, campaign, creative)
);
CREATE TABLE install_receipts (
  token TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  agent TEXT NOT NULL,
  campaign TEXT NOT NULL,
  creative TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  confirmed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX receipt_expiry ON install_receipts(expires_at);
CREATE INDEX receipt_day ON install_receipts(day);

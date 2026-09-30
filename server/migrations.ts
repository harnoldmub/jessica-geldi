import { pool } from "./db";

export async function ensureApplicationSchema() {
  await pool.query(`
    ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS invited_count integer NOT NULL DEFAULT 1;
    ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS invited_ceremony_choice varchar(100);
    ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS allergies text;
    ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS notes text;
    ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS party varchar(20) NOT NULL DEFAULT 'commun';
    ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS country varchar(2);
    ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS city varchar(120);
    ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS responded_at timestamp;
    ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
    UPDATE rsvp_responses
      SET invited_count = GREATEST(invited_count, guest_count)
      WHERE invited_count < guest_count;
    UPDATE rsvp_responses
      SET invited_ceremony_choice = ceremony_choice
      WHERE invited_ceremony_choice IS NULL;
    ALTER TABLE rsvp_responses ALTER COLUMN invited_ceremony_choice SET DEFAULT 'civil';
    CREATE TABLE IF NOT EXISTS site_settings (
      id integer PRIMARY KEY DEFAULT 1,
      value jsonb NOT NULL,
      revision integer NOT NULL DEFAULT 1,
      published boolean NOT NULL DEFAULT true,
      updated_at timestamp DEFAULT now()
    );
  `);
}

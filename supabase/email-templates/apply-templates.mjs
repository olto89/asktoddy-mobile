#!/usr/bin/env node
/**
 * Apply AskToddy branded auth email templates to a Supabase project via the
 * Management API (no CLI / DB password needed).
 *
 * Usage:
 *   SUPABASE_PAT=sbp_xxx node apply-templates.mjs <project-ref>
 *
 *   staging ref: iezmuqawughmwsxlqrim
 *   prod ref:    rdlnlvtfwzntxiyugcuk
 *
 * Revoke the PAT afterwards (dashboard → account → tokens).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ref = process.argv[2];
const pat = process.env.SUPABASE_PAT;

if (!ref || !pat) {
  console.error('Usage: SUPABASE_PAT=sbp_xxx node apply-templates.mjs <project-ref>');
  process.exit(1);
}

const confirmation = readFileSync(join(__dirname, 'confirmation.html'), 'utf8');
const recovery = readFileSync(join(__dirname, 'recovery.html'), 'utf8');

const body = {
  mailer_subjects_confirmation: 'Confirm your AskToddy account',
  mailer_templates_confirmation_content: confirmation,
  mailer_subjects_recovery: 'Reset your AskToddy password',
  mailer_templates_recovery_content: recovery,
};

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${pat}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error(`❌ Failed (${res.status}):`, await res.text());
  process.exit(1);
}
console.log(`✅ Applied confirmation + recovery templates to ${ref}`);

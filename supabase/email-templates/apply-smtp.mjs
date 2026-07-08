#!/usr/bin/env node
/**
 * Configure custom SMTP for a Supabase project via the Management API, so auth
 * emails send from asktoddy.co.uk (through Resend) instead of Supabase's shared,
 * rate-limited sender.
 *
 * PREREQ: the sending domain/subdomain must already be VERIFIED in Resend
 * (DKIM CNAMEs added, SPF merged with ImprovMX, return-path set). See
 * PRODUCTION_CUTOVER.md step 7b + the asktoddy-domain-email memory.
 *
 * Usage (defaults are Resend's):
 *   SUPABASE_PAT=sbp_xxx \
 *   SMTP_PASS=<resend-api-key> \
 *   SMTP_SENDER=no-reply@send.asktoddy.co.uk \
 *   node apply-smtp.mjs <project-ref>
 *
 * Optional overrides:
 *   SMTP_HOST (default smtp.resend.com)
 *   SMTP_PORT (default 465)
 *   SMTP_USER (default resend)
 *   SMTP_SENDER_NAME (default "AskToddy")
 *   SMTP_RATE_LIMIT (emails/hour; only set if provided)
 *
 *   staging ref: iezmuqawughmwsxlqrim
 *   prod ref:    rdlnlvtfwzntxiyugcuk
 *
 * Revoke the PAT afterwards. SMTP_PASS is the Resend API key — treat as a secret.
 */
const ref = process.argv[2];
const pat = process.env.SUPABASE_PAT;
const pass = process.env.SMTP_PASS;
const sender = process.env.SMTP_SENDER;

if (!ref || !pat || !pass || !sender) {
  console.error('Required: SUPABASE_PAT, SMTP_PASS, SMTP_SENDER, and <project-ref>.');
  console.error('Usage: SUPABASE_PAT=.. SMTP_PASS=.. SMTP_SENDER=.. node apply-smtp.mjs <ref>');
  process.exit(1);
}

const body = {
  smtp_host: process.env.SMTP_HOST || 'smtp.resend.com',
  smtp_port: Number(process.env.SMTP_PORT || 465),
  smtp_user: process.env.SMTP_USER || 'resend',
  smtp_pass: pass,
  smtp_admin_email: sender,
  smtp_sender_name: process.env.SMTP_SENDER_NAME || 'AskToddy',
};
if (process.env.SMTP_RATE_LIMIT) {
  body.rate_limit_email_sent = Number(process.env.SMTP_RATE_LIMIT);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error(`❌ Failed (${res.status}):`, await res.text());
  process.exit(1);
}
console.log(`✅ Custom SMTP configured on ${ref} — sending as "${body.smtp_sender_name}" <${sender}> via ${body.smtp_host}`);

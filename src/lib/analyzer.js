/**
 * Domain-Content Validator — analysis engine.
 *
 * Pure logic only: no DOM, no chrome.* APIs, no network. Everything in this
 * module is a deterministic function of its inputs so it can be unit-tested
 * in Node without loading the extension.
 *
 * SCAFFOLD: the heuristics below define the shape of the engine and give
 * working baseline behavior. Replace them with the shipped v0.0.1 detection
 * logic when the production source is imported.
 */

export const RISK = Object.freeze({
  SAFE: 'safe',
  CAUTION: 'caution',
  DANGER: 'danger'
});

/** Score thresholds. Higher score = more suspicious. */
const THRESHOLDS = Object.freeze({
  caution: 30,
  danger: 60
});

/** Public suffixes handled as two-label TLDs when deriving a registrable domain. */
const COMPOUND_TLDS = new Set(['co.uk', 'co.jp', 'com.au', 'com.br', 'co.nz', 'co.in', 'com.mx']);

/** Phrases that commonly accompany credential and payment fraud. */
const URGENCY_PATTERNS = [
  /\baccount (?:will be |has been )?(?:suspend|clos|lock|disabl)/i,
  /\bwithin (?:24|48|72) hours\b/i,
  /\bimmediate(?:ly)? (?:action|attention|response)\b/i,
  /\bfinal (?:notice|warning|reminder)\b/i,
  /\bverify your (?:account|identity|information)\b/i
];

const CREDENTIAL_PATTERNS = [
  /\b(?:confirm|update|verify|re-?enter) your (?:password|login|credentials|payment|billing)\b/i,
  /\bsign in (?:here|now|below) to\b/i,
  /\bwire transfer\b/i,
  /\bgift card\b/i
];

/**
 * Reduce a hostname to its registrable domain: mail.corp.example.co.uk -> example.co.uk
 * @param {string} host
 * @returns {string}
 */
export function registrableDomain(host) {
  const labels = String(host || '').toLowerCase().trim().replace(/\.$/, '').split('.');
  if (labels.length <= 2) return labels.join('.');
  const lastTwo = labels.slice(-2).join('.');
  return COMPOUND_TLDS.has(lastTwo) ? labels.slice(-3).join('.') : lastTwo;
}

/**
 * Pull the domain out of an address, tolerating "Display Name <a@b.com>" form.
 * @param {string} address
 * @returns {string|null}
 */
export function senderDomain(address) {
  const match = /<?([^\s<>@]+)@([^\s<>]+?)>?$/.exec(String(address || '').trim());
  return match ? registrableDomain(match[2]) : null;
}

/**
 * Brand-like tokens referenced in the body: capitalized words, and the
 * registrable domains of any hostnames the message mentions.
 * @param {string} body
 * @returns {{ brands: string[], domains: string[] }}
 */
export function extractClaims(body) {
  const text = String(body || '');
  const brands = [...new Set((text.match(/\b[A-Z][a-zA-Z]{2,}\b/g) || []).map((w) => w.toLowerCase()))];
  const domains = [...new Set(
    (text.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi) || []).map((h) => registrableDomain(h))
  )];
  return { brands, domains };
}

/**
 * How well does the sending domain agree with what the body claims?
 * Returns 0 (no agreement) to 1 (strong agreement).
 * @param {string|null} domain
 * @param {{ brands: string[], domains: string[] }} claims
 * @returns {number}
 */
export function correlationScore(domain, claims) {
  if (!domain) return 0;
  const stem = domain.split('.')[0];
  if (claims.domains.includes(domain)) return 1;
  if (claims.brands.includes(stem)) return 0.8;
  if (claims.domains.some((d) => d.split('.')[0] === stem)) return 0.6;
  if (claims.brands.some((b) => b.includes(stem) || stem.includes(b))) return 0.4;
  return 0;
}

/**
 * Links whose visible text points somewhere other than their href.
 * @param {Array<{ text: string, href: string }>} links
 * @returns {Array<{ text: string, href: string }>}
 */
export function mismatchedLinks(links = []) {
  return links.filter((link) => {
    const shown = /(?:[a-z0-9-]+\.)+[a-z]{2,}/i.exec(String(link.text || ''));
    if (!shown) return false;
    try {
      return registrableDomain(shown[0]) !== registrableDomain(new URL(link.href).hostname);
    } catch {
      return false;
    }
  });
}

/**
 * Analyze one message.
 * @param {{ sender: string, subject?: string, body?: string, links?: Array }} message
 * @returns {{ risk: string, score: number, correlation: number, reasons: string[] }}
 */
export function analyzeMessage(message = {}) {
  const domain = senderDomain(message.sender);
  const haystack = `${message.subject || ''}\n${message.body || ''}`;
  const claims = extractClaims(haystack);
  const correlation = correlationScore(domain, claims);
  const reasons = [];
  let score = 0;

  if (!domain) {
    score += 40;
    reasons.push('The sender address could not be parsed into a valid domain.');
  } else if (correlation === 0 && (claims.brands.length || claims.domains.length)) {
    score += 45;
    reasons.push(`The message references organizations unrelated to the sending domain "${domain}".`);
  } else if (correlation < 0.6) {
    score += 20;
    reasons.push(`The sending domain "${domain}" only loosely matches what the message claims to be about.`);
  }

  if (URGENCY_PATTERNS.some((re) => re.test(haystack))) {
    score += 20;
    reasons.push('The message uses urgency or threat language typical of phishing.');
  }

  if (CREDENTIAL_PATTERNS.some((re) => re.test(haystack))) {
    score += 25;
    reasons.push('The message asks for credentials, payment, or account verification.');
  }

  const mismatches = mismatchedLinks(message.links);
  if (mismatches.length) {
    score += 25;
    reasons.push(`${mismatches.length} link(s) display one destination but point to another.`);
  }

  score = Math.min(100, score);
  const risk = score >= THRESHOLDS.danger ? RISK.DANGER
    : score >= THRESHOLDS.caution ? RISK.CAUTION
      : RISK.SAFE;

  return { risk, score, correlation, reasons };
}

/**
 * Stable, non-reversible identifier for a message. Used as a cache key so no
 * message content is ever persisted.
 * @param {{ sender?: string, subject?: string, body?: string }} message
 * @returns {string}
 */
export function fingerprint(message = {}) {
  const input = `${message.sender || ''}|${message.subject || ''}|${(message.body || '').slice(0, 512)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

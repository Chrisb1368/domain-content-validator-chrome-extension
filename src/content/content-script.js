/**
 * Domain-Content Validator — content script.
 *
 * The only module that touches page DOM. It watches the open message, extracts
 * sender/subject/body/links, hands them to the service worker, and renders the
 * inline alert. Provider-specific selectors live in ADAPTERS so supporting a
 * new webmail client means adding selectors, not rewriting logic.
 */

const BANNER_ID = 'dcv-alert-banner';
const DEBOUNCE_MS = 400;

const ADAPTERS = [
  {
    host: /mail\.google\.com$/,
    container: '.adn.ads',
    sender: '.gD, span[email]',
    senderAttr: 'email',
    subject: 'h2.hP',
    body: '.a3s'
  },
  {
    host: /outlook\.(live|office|office365)\.com$/,
    container: '[role="main"] [aria-label*="message body" i], .ReadingPaneContent',
    sender: '[data-lpc-hover-target-id], span[title*="@"]',
    senderAttr: 'title',
    subject: '[role="heading"]',
    body: '[aria-label*="message body" i]'
  },
  {
    host: /mail\.yahoo\.com$/,
    container: '[data-test-id="message-view-body"]',
    sender: '[data-test-id="message-from"] span[title*="@"]',
    senderAttr: 'title',
    subject: '[data-test-id="message-subject"]',
    body: '[data-test-id="message-view-body-content"]'
  }
];

const STYLES = `
  #${BANNER_ID}{font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    border-radius:10px;padding:12px 14px;margin:10px 0;display:flex;gap:12px;align-items:flex-start;
    border:1px solid transparent}
  #${BANNER_ID}[data-risk="caution"]{background:#FEF7E0;border-color:#F9AB00;color:#5C3C00}
  #${BANNER_ID}[data-risk="danger"]{background:#FCE8E6;border-color:#D93025;color:#7F1D1B}
  #${BANNER_ID} .dcv-title{font-weight:600;margin:0 0 4px}
  #${BANNER_ID} ul{margin:0;padding-left:18px}
  #${BANNER_ID} button{margin-left:auto;background:none;border:0;cursor:pointer;
    font-size:18px;line-height:1;color:inherit;opacity:.6}
  #${BANNER_ID} button:hover{opacity:1}
`;

const TITLES = {
  caution: 'This message looks inconsistent',
  danger: 'This message may be a phishing attempt'
};

function adapterForHost() {
  return ADAPTERS.find((a) => a.host.test(location.hostname)) || null;
}

function readText(root, selector) {
  const el = root.querySelector(selector) || document.querySelector(selector);
  return el ? el.innerText.trim() : '';
}

function readSender(root, adapter) {
  const el = root.querySelector(adapter.sender) || document.querySelector(adapter.sender);
  if (!el) return '';
  return (el.getAttribute(adapter.senderAttr) || el.innerText || '').trim();
}

function readLinks(root) {
  return [...root.querySelectorAll('a[href^="http"]')].slice(0, 100).map((a) => ({
    text: a.innerText.trim(),
    href: a.href
  }));
}

function injectStyles() {
  if (document.getElementById(`${BANNER_ID}-styles`)) return;
  const style = document.createElement('style');
  style.id = `${BANNER_ID}-styles`;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

function clearBanner() {
  document.getElementById(BANNER_ID)?.remove();
}

function renderBanner(container, verdict) {
  clearBanner();
  if (verdict.risk === 'safe' || verdict.dismissed || !verdict.reasons?.length) return;
  injectStyles();

  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.dataset.risk = verdict.risk;
  banner.setAttribute('role', 'alert');

  const content = document.createElement('div');
  const title = document.createElement('p');
  title.className = 'dcv-title';
  title.textContent = TITLES[verdict.risk];
  const list = document.createElement('ul');
  verdict.reasons.forEach((reason) => {
    const li = document.createElement('li');
    li.textContent = reason;
    list.appendChild(li);
  });
  content.append(title, list);

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.textContent = '×';
  dismiss.setAttribute('aria-label', 'Dismiss warning');
  dismiss.addEventListener('click', () => {
    clearBanner();
    chrome.runtime.sendMessage({ type: 'DISMISS_ALERT', payload: { fingerprint: verdict.fingerprint } });
  });

  banner.append(content, dismiss);
  container.prepend(banner);
}

async function evaluateOpenMessage() {
  const adapter = adapterForHost();
  if (!adapter) return;
  const container = document.querySelector(adapter.container);
  if (!container) {
    clearBanner();
    return;
  }

  const payload = {
    sender: readSender(container, adapter),
    subject: readText(container, adapter.subject),
    body: readText(container, adapter.body),
    links: readLinks(container)
  };
  if (!payload.sender || !payload.body) return;

  try {
    const response = await chrome.runtime.sendMessage({ type: 'ANALYZE_MESSAGE', payload });
    if (response?.payload) renderBanner(container, response.payload);
  } catch {
    // Service worker asleep or extension reloading; the next mutation retries.
  }
}

let timer;
const observer = new MutationObserver(() => {
  clearTimeout(timer);
  timer = setTimeout(evaluateOpenMessage, DEBOUNCE_MS);
});

observer.observe(document.body, { childList: true, subtree: true });
evaluateOpenMessage();

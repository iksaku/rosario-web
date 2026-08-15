
/* eslint-disable */
// PROTOTYPE — throwaway (wayfinder ticket #30). Do not ship.
// Floating bottom pill: ◀ / label / ▶, cycles ?variant=A|B|C, ←/→ keys.

const VARIANTS = [
  { key: 'A', name: 'Refined handbook' },
  { key: 'B', name: 'Progressive focus' },
  { key: 'C', name: 'Guided tally' },
];

class PrototypeSwitcher extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  current() {
    const v = new URLSearchParams(location.search).get('variant') ?? 'A';
    return VARIANTS.some((x) => x.key === v) ? v : 'A';
  }

  go(delta) {
    const i = VARIANTS.findIndex((v) => v.key === this.current());
    const next = VARIANTS[(i + delta + VARIANTS.length) % VARIANTS.length];
    const url = new URL(location.href);
    url.searchParams.set('variant', next.key);
    history.replaceState(null, '', url);
    this.render();
    // Re-render the page body for the new variant
    document.dispatchEvent(new CustomEvent('prototype:variant', { detail: next.key }));
  }

  render() {
    const cur = VARIANTS.find((v) => v.key === this.current());
    this.innerHTML = '';
    const bar = document.createElement('div');
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Prototype variant switcher');
    bar.style.cssText = `position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);
      z-index:9999;display:flex;align-items:center;gap:.25rem;background:#111;color:#fff;
      border-radius:9999px;padding:.35rem .5rem;box-shadow:0 8px 24px rgba(0,0,0,.35);
      font:600 13px/1 system-ui,sans-serif`;
    const btn = (label, delta, aria) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.setAttribute('aria-label', aria);
      b.style.cssText = `all:unset;cursor:pointer;width:48px;height:48px;display:grid;
        place-items:center;border-radius:9999px;color:#fff;font-size:20px`;
      b.onmouseenter = () => (b.style.background = 'rgba(255,255,255,.15)');
      b.onmouseleave = () => (b.style.background = 'transparent');
      b.onclick = () => this.go(delta);
      return b;
    };
    bar.append(
      btn('◀', -1, 'Variant anterior'),
      Object.assign(document.createElement('span'), {
        textContent: `${cur.key} — ${cur.name}`,
      }),
      btn('▶', 1, 'Variant siguiente'),
    );
    this.style.setProperty('color-scheme', 'light dark');
    this.append(bar);
    document.title = `PROTOTIPO ${cur.key} — ${cur.name}`;
  }
}

if (typeof document !== 'undefined' && !customElements.get('prototype-switcher')) {
  customElements.define('prototype-switcher', PrototypeSwitcher);
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && (t.matches('input, textarea, [contenteditable]') || t.closest('prototype-switcher'))) return;
    if (e.key === 'ArrowLeft') document.querySelector('prototype-switcher')?.['go']?.(-1);
    if (e.key === 'ArrowRight') document.querySelector('prototype-switcher')?.['go']?.(1);
  });
}
export const prototypeVariants = VARIANTS;

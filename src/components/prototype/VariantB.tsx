/* eslint-disable */
// PROTOTYPE VARIANT B — "Progressive focus" (wayfinder ticket #30, throwaway).
// Same scroll flow, but one prayer line is "on stage": full contrast + scale,
// everything else dims. Tapping a line moves the focus; big Siguiente button.
// Follows the pointer, never the clock — the user keeps their own pace.
import type { JSX } from 'solid-js';
import { createSignal, For, Show, onMount, onCleanup } from 'solid-js';
import { PRAYER, type Section, type Block, type Line, type LitaniaItem, type MisterioSet } from './content';

/** Flatten the whole guide into focusable steps, preserving canonical order. */
type Step =
  | { kind: 'line'; sectionId: string; heading: string; line: Line }
  | { kind: 'litania'; sectionId: string; heading: string; item: LitaniaItem; index: number }
  | { kind: 'misterio'; sectionId: string; heading: string; set: MisterioSet; index: number };

const misterioSetForToday = (): MisterioSet => {
  const sec = PRAYER.sections.find((s): s is Extract<Section, { id: 'misterios' }> => s.id === 'misterios');
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long' });
  const norm = (d: string) => d.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return sec?.misterios.find((set) => set.days.some((d) => norm(d) === norm(today))) ?? sec?.misterios[0] as MisterioSet;
};

function buildSteps(): Step[] {
  const steps: Step[] = [];
  for (const s of PRAYER.sections) {
    if ('blocks' in s) {
      for (const b of s.blocks) for (const line of b.lines) steps.push({ kind: 'line', sectionId: s.id, heading: s.heading, line });
    } else if (s.id === 'letanias') {
      s.items.forEach((item, index) => steps.push({ kind: 'litania', sectionId: s.id, heading: s.heading, item, index }));
    } else if (s.id === 'misterios') {
      s.misterios.forEach((set, index) => steps.push({ kind: 'misterio', sectionId: s.id, heading: s.heading, set, index }));
    }
  }
  return steps;
}

const [focused, setFocused] = createSignal(0);
const steps = buildSteps();

export default function VariantB(): JSX.Element {
  let listEl: HTMLDivElement | undefined;

  const move = (delta: number) => setFocused((f) => Math.min(Math.max(f + delta, 0), steps.length - 1));
  const focusStep = (i: number) => setFocused(i);

  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && t.closest('input, textarea, [contenteditable]')) return;
    if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); move(1); }
    if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); move(-1); }
  };
  onMount(() => window.addEventListener('keydown', onKey));
  onCleanup(() => window.removeEventListener('keydown', onKey));

  const scrollFocusedIntoView = () => {
    const el = listEl?.querySelector<HTMLElement>(`[data-step="${focused()}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  return (
    <main class="min-h-screen bg-white text-stone-800 dark:bg-stone-950 dark:text-stone-100">
      <div class="mx-auto max-w-2xl px-5 pt-8 pb-32">
        <header class="mb-8 text-center">
          <h1 class="font-serif text-3xl font-bold sm:text-4xl">Santo Rosario</h1>
          <p class="mt-1 text-sm uppercase tracking-widest text-teal-700 dark:text-teal-300">{steps[focused()]?.heading}</p>
        </header>

        <div ref={listEl}>
          <For each={steps}>
            {(step, i) => (
              <Show
                when={i() === focused()}
                fallback={
                  <button
                    type="button"
                    data-step={i()}
                    onClick={() => focusStep(i())}
                    class="block w-full min-h-[48px] cursor-pointer px-4 py-2 text-left text-[1.1rem] leading-relaxed text-stone-400/70 dark:text-stone-500/70 transition-colors hover:text-stone-600 dark:hover:text-stone-300"
                  >
                    {step.kind === 'line' && (step.line.who ? <span class="font-semibold">{step.line.who}: </span> : null)}
                    {step.kind === 'line' ? step.line.text : step.kind === 'litania' ? step.item.call : step.set.label}
                  </button>
                }
              >
                <div data-step={i()} class="rounded-2xl border-2 border-teal-600/30 bg-teal-50/50 px-5 py-6 sm:px-7 dark:border-teal-400/30 dark:bg-teal-950/30">
                  <Show when={step.kind === 'line' && step.line.who}>
                    <p class="mb-2 text-sm font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">{(step as { kind: 'line'; line: Line }).line.who}</p>
                  </Show>
                  <p class="text-2xl leading-[1.7] font-medium text-stone-900 sm:text-3xl sm:leading-[1.7] dark:text-white">
                    {step.kind === 'line' ? step.line.text : step.kind === 'litania' ? step.item.call : step.set.label}
                  </p>
                  <Show when={step.kind === 'litania'}>
                    <p class="mt-3 text-xl font-bold text-teal-800 sm:text-2xl dark:text-teal-300">{(step as { kind: 'litania'; item: LitaniaItem }).item.response}</p>
                  </Show>
                  <Show when={step.kind === 'misterio'}>
                    <ol class="mt-4 space-y-2">
                      <For each={(step as { kind: 'misterio'; set: MisterioSet }).set.items}>
                        {(m) => <li class="text-[1.2rem] leading-relaxed text-stone-700 dark:text-stone-200">• {m}</li>}
                      </For>
                    </ol>
                  </Show>
                </div>
              </Show>
            )}
          </For>
        </div>

        <div class="fixed inset-x-0 bottom-0 z-40 border-t-2 border-stone-200 bg-white/95 px-5 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
          <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <button type="button" onClick={() => { move(-1); setTimeout(scrollFocusedIntoView, 0); }} class="h-14 min-w-14 rounded-full border-2 border-stone-300 px-5 text-lg font-semibold text-stone-600 dark:border-stone-600 dark:text-stone-300" aria-label="Anterior">↑</button>
            <p class="flex-1 text-center text-sm text-stone-500 dark:text-stone-400" aria-live="polite">
              {focused() + 1} de {steps.length}
            </p>
            <button type="button" onClick={() => { move(1); setTimeout(scrollFocusedIntoView, 0); }} class="h-14 rounded-full bg-teal-700 px-8 text-lg font-bold text-white dark:bg-teal-500 dark:text-stone-950" aria-label="Siguiente">Siguiente ↓</button>
          </div>
        </div>
      </div>
    </main>
  );
}

// Blocks type is used implicitly via steps; keep import referenced for typing.
export type { Block };

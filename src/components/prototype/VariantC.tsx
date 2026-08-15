/* eslint-disable */
// PROTOTYPE VARIANT C — "Guided tally" (wayfinder ticket #30, throwaway).
// Full handbook scroll + an optional, dismissible bead-tally sheet for the
// 10 Avemarías of a decade. Prays from the page as-is; the tally is a side
// tool, never in the way. Bead count resets via a long-safe reset button.
import type { JSX } from 'solid-js';
import { createSignal, For, Show, onMount } from 'solid-js';
import { PRAYER, type Section, type DialogSection, type LitaniaItem, type MisterioSet } from './content';

const [bead, setBead] = createSignal(0);
const [tallyOpen, setTallyOpen] = createSignal(false);
const [activeSet, setActiveSet] = createSignal<MisterioSet | null>(null);

const misteriosSection = PRAYER.sections.find((s): s is Extract<Section, { id: 'misterios' }> => s.id === 'misterios');
const letaniasSection = PRAYER.sections.find((s): s is Extract<Section, { id: 'letanias' }> => s.id === 'letanias');

const todaySet = (): MisterioSet | null => {
  if (!misteriosSection) return null;
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long' });
  const norm = (d: string) => d.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const found = misteriosSection.misterios.find((set) => set.days.some((d) => norm(d) === norm(today)));
  return found ?? misteriosSection.misterios[0];
};

export default function VariantC(): JSX.Element {
  onMount(() => setActiveSet(todaySet()));

  return (
    <main class="min-h-screen bg-stone-50 text-stone-800 dark:bg-stone-950 dark:text-stone-100">
      <div class="mx-auto max-w-3xl px-5 pb-40 pt-8 sm:px-8">
        <header class="mb-10 text-center">
          <div class="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-2xl text-white shadow-lg" aria-hidden="true">✝</div>
          <h1 class="font-serif text-4xl font-bold sm:text-5xl">Santo Rosario</h1>
          <p class="mt-2 text-lg text-stone-500 dark:text-stone-400">«¿No estoy yo aquí, que soy tu Madre?»</p>
          <Show when={activeSet()}>
            <p class="mt-3 inline-block rounded-full bg-rose-100 px-4 py-1.5 text-base font-semibold text-rose-900 dark:bg-rose-900/40 dark:text-rose-200">
              Hoy: {activeSet()!.label}
            </p>
          </Show>
        </header>

        <For each={PRAYER.sections}>
          {(s) => (
            <section id={s.id} class="mb-12">
              <h2 class="mb-6 flex items-center gap-3 font-serif text-2xl font-bold sm:text-3xl">
                <span class="inline-block size-3 rounded-full bg-amber-500" aria-hidden="true" />
                {s.heading}
              </h2>

              <Show when={'blocks' in s}>
                <For each={(s as DialogSection).blocks}>
                  {(b) => (
                    <div class="mb-6 rounded-xl bg-white p-5 shadow-sm dark:bg-stone-900">
                      <For each={b.lines}>
                        {(l) => (
                          <p
                            class-list={{
                              'mb-2 last:mb-0 text-[1.25rem] leading-[1.8]': true,
                              'font-semibold': l.who === 'Guía',
                              'text-stone-600 dark:text-stone-300': l.who === 'Todos',
                              'text-stone-700 dark:text-stone-200': !l.who,
                            }}
                          >
                            <Show when={l.who}>
                              <span class-list={{ 'text-amber-700 dark:text-amber-400': l.who === 'Guía', 'text-teal-700 dark:text-teal-400': l.who === 'Todos' }} class="mr-2 rounded px-1.5 py-0.5 text-sm font-bold uppercase tracking-wide">
                                {l.who}
                              </span>
                            </Show>
                            {l.text}
                          </p>
                        )}
                      </For>
                    </div>
                  )}
                </For>
              </Show>

              <Show when={s.id === 'misterios' && misteriosSection}>
                <For each={misteriosSection!.misterios}>
                  {(set) => (
                    <div class-list={{ 'mb-4 rounded-xl border-2 p-5': true, 'border-amber-400 bg-amber-50 dark:bg-amber-950/30': set === activeSet(), 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900': set !== activeSet() }}>
                      <div class="flex flex-wrap items-center justify-between gap-3">
                        <h3 class="text-xl font-bold">{set.label}</h3>
                        <button
                          type="button"
                          class="h-12 rounded-full border-2 border-teal-700 px-5 text-base font-semibold text-teal-800 dark:border-teal-400 dark:text-teal-300"
                          onClick={() => { setActiveSet(set); setBead(0); setTallyOpen(true); document.getElementById('misterios')?.scrollIntoView({ behavior: 'smooth' }); }}
                        >
                          Contar este
                        </button>
                      </div>
                      <ol class="mt-4 grid gap-3 sm:grid-cols-2">
                        <For each={set.items}>
                          {(item, i) => (
                            <li class="flex items-start gap-3 text-[1.15rem] leading-relaxed">
                              <span class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-stone-200 text-base font-bold dark:bg-stone-700">{i() + 1}</span>
                              <span>{item}</span>
                            </li>
                          )}
                        </For>
                      </ol>
                    </div>
                  )}
                </For>
              </Show>

              <Show when={s.id === 'letanias' && letaniasSection}>
                <ul class="space-y-3">
                  <For each={letaniasSection!.items}>
                    {(it: LitaniaItem) => (
                      <li class="rounded-xl bg-white px-5 py-3 shadow-sm dark:bg-stone-900">
                        <p class="text-[1.15rem] leading-relaxed">
                          {it.call} <span class="font-bold text-teal-700 dark:text-teal-300">— {it.response}</span>
                        </p>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </section>
          )}
        </For>

        <footer class="mt-14 border-t border-stone-200 pt-6 text-center text-base text-stone-500 dark:border-stone-800 dark:text-stone-400">
          &copy; <a class="underline decoration-2 decoration-amber-500" href="https://jorgeglz.io" target="_blank" rel="noreferrer">Jorge González</a> 2020 – {new Date().getFullYear()}
        </footer>
      </div>

      {/* Bead tally sheet */}
      <Show when={tallyOpen() && activeSet()}>
        <div class="fixed inset-x-0 bottom-0 z-40 border-t-4 border-amber-500 bg-white/95 px-5 py-4 backdrop-blur dark:bg-stone-900/95">
          <div class="mx-auto max-w-3xl">
            <div class="mb-3 flex items-center justify-between gap-3">
              <p class="text-base font-bold text-stone-700 dark:text-stone-200">
                Avemarías — {activeSet()!.items[Math.min(bead() === 0 ? 0 : Math.ceil(bead() / 2) - 1, 4)] ?? activeSet()!.items[0]}
              </p>
              <div class="flex gap-2">
                <button type="button" class="h-12 min-w-12 rounded-full border-2 border-stone-300 px-4 text-base font-semibold dark:border-stone-600" onClick={() => setBead(0)} aria-label="Reiniciar cuenta">↺</button>
                <button type="button" class="h-12 min-w-12 rounded-full border-2 border-stone-300 px-4 text-xl dark:border-stone-600" onClick={() => setTallyOpen(false)} aria-label="Cerrar contador">✕</button>
              </div>
            </div>
            <div class="flex items-center justify-between gap-2" role="group" aria-label="Cuenta de Avemarías">
              <For each={Array.from({ length: 10 })}>
                {(_, i) => (
                  <button
                    type="button"
                    aria-label={`Avemaría ${i() + 1}`}
                    aria-pressed={bead() > i()}
                    class-list={{
                      'h-14 flex-1 rounded-full border-2 text-lg font-bold transition-all': true,
                      'border-teal-700 bg-teal-700 text-white dark:border-teal-400 dark:bg-teal-400 dark:text-stone-950': bead() > i(),
                      'border-stone-300 bg-white text-stone-400 dark:border-stone-600 dark:bg-stone-800': bead() <= i(),
                    }}
                    onClick={() => setBead(i() + 1)}
                  >
                    {i() + 1}
                  </button>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>

      {/* Reopen tally */}
      <Show when={!tallyOpen()}>
        <button
          type="button"
          class="fixed bottom-4 left-4 z-40 h-14 rounded-full bg-amber-500 px-6 text-lg font-bold text-stone-900 shadow-lg"
          onClick={() => setTallyOpen(true)}
        >
          Contar Avemarías
        </button>
      </Show>
    </main>
  );
}

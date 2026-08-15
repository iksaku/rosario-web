/* eslint-disable */
// PROTOTYPE VARIANT A — "Refined handbook" (wayfinder ticket #30, throwaway).
// One-scroll document, quiet parchment reading surface, Guía/Todos set apart
// by indentation + weight + hue, tilma accents on headings only.
import { createSignal, type JSX } from 'solid-js';
import { PRAYER, type Block, type DialogSection, type LetaniasSection, type MisteriosSection } from './content';

const dialogSections = PRAYER.sections.filter((s): s is DialogSection => 'blocks' in s && s.id !== 'misterios');
const letanias = PRAYER.sections.find((s): s is LetaniasSection => s.id === 'letanias')!;
const misterios = PRAYER.sections.find((s): s is MisteriosSection => s.id === 'misterios')!;

// Data day names are English ('Monday', …); timezone is the visitor's.
const todaysMisterioKey = misterios.misterios.find(
  (set) => set.days.includes(new Date().toLocaleString('en-US', { weekday: 'long' })),
)?.key;

function Dialog({ blocks }: { blocks: readonly Block[] }): JSX.Element {
  return (
    <>
      {blocks.map((b) => (
        <div class="mb-7 last:mb-0">
          {b.lines.map((l) => (
            <p
              class-list={{
                'mb-0': true,
                'text-[1.35rem] leading-[1.9] sm:text-2xl': true,
                'font-semibold text-stone-800 dark:text-stone-100': l.who === 'Guía',
                'pl-6 sm:pl-8 text-stone-600 dark:text-stone-300': l.who === 'Todos',
                'text-stone-700 dark:text-stone-200': !l.who,
              }}
            >
              {l.who === 'Guía' && <span class="font-bold text-teal-800 dark:text-teal-300">Guía: </span>}
              {l.who === 'Todos' && <span class="font-bold text-rose-800 dark:text-rose-300">Todos: </span>}
              {l.text}
            </p>
          ))}
        </div>
      ))}
    </>
  );
}

export default function VariantA(): JSX.Element {
  const [openKey, setOpenKey] = createSignal<string | undefined>(todaysMisterioKey);
  return (
    <main class="min-h-screen bg-[#faf6ee] dark:bg-stone-950 text-stone-800 dark:text-stone-100">
      <div class="mx-auto max-w-3xl px-5 sm:px-8 py-10">
        <header class="mb-10 text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">Guía para rezar</p>
          <h1 class="mt-2 font-serif text-4xl font-bold text-stone-900 sm:text-5xl dark:text-white">Santo Rosario</h1>
          <p class="mt-3 font-serif text-xl italic text-stone-500 dark:text-stone-400">«¿No estoy yo aquí, que soy tu Madre?»</p>
        </header>

        {PRAYER.sections.map((s): JSX.Element => {
          if (s.id === 'misterios' && 'misterios' in s) {
            return (
              <section id="misterios" class="mb-12">
                <h2 class="mb-6 border-b-2 border-teal-700/40 pb-2 font-serif text-2xl font-bold text-stone-900 sm:text-3xl dark:border-teal-400/40 dark:text-white">
                  {s.heading}
                </h2>
                <p class="mb-4 text-lg text-stone-500 dark:text-stone-400">Se rezan según el día de la semana.</p>
                {s.misterios.map((set) => (
                  <details
                    open={openKey() === set.key}
                    class="group relative mb-4 rounded-xl border-2"
                    class-list={{
                      'border-amber-500/70 bg-amber-50/60 dark:bg-amber-950/20': set.key === todaysMisterioKey,
                      'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900': set.key !== todaysMisterioKey,
                    }}
                  >
                    {set.key === todaysMisterioKey && (
                      <span class="absolute -top-3 right-4 rounded-full bg-amber-500 px-3 py-0.5 text-sm font-bold uppercase tracking-wide text-stone-900 shadow">
                        Hoy
                      </span>
                    )}
                    <summary
                      class="flex min-h-[64px] cursor-pointer list-none items-center justify-between px-5 py-4 text-xl font-semibold text-stone-800 dark:text-stone-100"
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenKey(openKey() === set.key ? undefined : set.key);
                      }}
                    >
                      <span>{set.label}</span>
                      <span aria-hidden="true" class="text-2xl text-teal-700 transition-transform group-open:rotate-90 dark:text-teal-300">›</span>
                    </summary>
                    <ol class="space-y-3 px-5 pb-2">
                      {set.items.map((item, i) => (
                        <li class="flex gap-4 text-[1.2rem] leading-relaxed text-stone-700 dark:text-stone-200">
                          <span class="grid size-10 shrink-0 place-items-center rounded-full bg-teal-100 font-serif text-lg font-bold text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">{i + 1}</span>
                          <span class="pt-1.5">{item}</span>
                        </li>
                      ))}
                    </ol>
                    <p class="mx-5 mb-5 rounded-lg bg-amber-100/70 px-4 py-3 text-base leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                      <strong>Nota:</strong> en cada misterio se reza un Padre Nuestro y diez Ave Marías.
                    </p>
                  </details>
                ))}
              </section>
            );
          }
          if (s.id === 'letanias' && 'items' in s) {
            return (
              <section id="letanias" class="mb-12">
                <h2 class="mb-6 border-b-2 border-teal-700/40 pb-2 font-serif text-2xl font-bold text-stone-900 sm:text-3xl dark:border-teal-400/40 dark:text-white">
                  {s.heading}
                </h2>
                <ul class="space-y-5">
                  {s.items.map((it) => (
                    <li class="border-l-4 border-rose-300 pl-4 dark:border-rose-700">
                      <p class="text-[1.2rem] leading-relaxed text-stone-800 dark:text-stone-100">{it.call}</p>
                      <p class="text-[1.2rem] leading-relaxed font-semibold text-teal-800 dark:text-teal-300">{it.response}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }
          if ('blocks' in s) {
            return (
              <section id={s.id} class="mb-12">
                <h2 class="mb-6 border-b-2 border-teal-700/40 pb-2 font-serif text-2xl font-bold text-stone-900 sm:text-3xl dark:border-teal-400/40 dark:text-white">
                  {s.heading}
                </h2>
                <Dialog blocks={s.blocks} />
              </section>
            );
          }
          return null;
        })}
        <footer class="mt-14 border-t-2 border-stone-200 pt-6 text-center text-base text-stone-500 dark:border-stone-800 dark:text-stone-400">
          &copy; <a class="underline decoration-2 decoration-teal-600" href="https://jorgeglz.io" target="_blank" rel="noreferrer">Jorge González</a> 2020 – {new Date().getFullYear()}
        </footer>
      </div>
    </main>
  );
}

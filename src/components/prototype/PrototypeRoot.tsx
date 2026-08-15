/* eslint-disable */
// PROTOTYPE — throwaway (wayfinder ticket #30).
// Variant switcher island: mounts the requested variant from ?variant=A|B|C
// and re-mounts on prototype:variant events from the switcher bar.
import type { JSX } from 'solid-js';
import { createSignal, onCleanup, onMount, Show, Suspense, lazy } from 'solid-js';

const VariantA = lazy(() => import('./VariantA'));
const VariantB = lazy(() => import('./VariantB'));
const VariantC = lazy(() => import('./VariantC'));

const isVariantKey = (v: string | null): v is string => v === 'A' || v === 'B' || v === 'C';

function currentVariant(): string {
  if (typeof location === 'undefined') return 'A'; // SSR/prerender fallback
  const v = new URLSearchParams(location.search).get('variant');
  return isVariantKey(v) ? v : 'A';
}

export default function PrototypeRoot(): JSX.Element {
  const [variant, setVariant] = createSignal(currentVariant());

  const onVariantEvent = (e: Event) => setVariant((e as CustomEvent<string>).detail);
  onMount(() => document.addEventListener('prototype:variant', onVariantEvent));
  onCleanup(() => document.removeEventListener('prototype:variant', onVariantEvent));

  return (
    <Show when={variant()} keyed>
      {(v) => (
        <Suspense fallback={<p class="p-10 text-center text-xl">Cargando variante {v}…</p>}>
          {v === 'A' && <VariantA />}
          {v === 'B' && <VariantB />}
          {v === 'C' && <VariantC />}
        </Suspense>
      )}
    </Show>
  );
}

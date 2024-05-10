import {createMemo, createSignal, For, Show} from "solid-js";

const misterios = {
  'gozosos': [
    'El anuncio del Ángel a María.',
    'La visita de la Santísima Virgen a Santa Isabel.',
    'El nacimiento de Jesús en el portal de Belén.',
    'La presentación de Jesús en el templo.',
    'Jesús perdido y hallado en el templo.',
  ],
  'luminosos': [
    'El Bautismo de Cristo en el Jordán.',
    'Su auto revelación en las bodas de Caná.',
    'El anuncio del Reino y llamado a la conversión.',
    'La Transfiguración del Señor.',
    'La Institución de la Eucaristía.',
  ],
  'dolorosos': [
    'La oración de Jesús en el Huerto.',
    'La flagelación de Jesús.',
    'Jesús es coronado de espinas.',
    'Jesús con la Cruz a cuestas.',
    'La crucifixión y muerte de Jesús.',
  ],
  'gloriosos': [
    'La Resurrección de Nuestro Señor Jesucristo.',
    'La Ascensión de Jesús al Cielo.',
    'La venida del Espíritu Santo.',
    'La asunción de María al Cielo.',
    'La coronación y glorificación de María.',
  ],
} as const

type MisteriosValidos = keyof typeof misterios

const misteriosPorDia: Record<MisteriosValidos, string> = {
  'gozosos': 'Misterios Gozosos (Lunes y Sábado)',
  'luminosos': 'Misterios Luminosos (Jueves)',
  'dolorosos': 'Misterios Dolorosos (Martes y Viernes)',
  'gloriosos': 'Misterios Gloriosos (Miércoles y Domingo)',
} as const

function misteriosDelDia(): MisteriosValidos | undefined {
  const day = new Date().getDay();

  if (day === 1 || day === 6)       return 'gozosos'
  else if (day === 4)               return 'luminosos'
  else if (day === 2 || day === 5)  return 'dolorosos'
  else if (day === 3 || day === 0)  return 'gloriosos'
  else                              return undefined
}

function ucfirst(str: string): string {
  return str[0].toUpperCase() + str.slice(1)
}

export default function () {
  const [selected, setSelected] = createSignal(misteriosDelDia())
  const title = createMemo(() => `Misterios ${ucfirst(selected()!)}`)
  const misteriosSeleccionados = createMemo(() => {
    if (!selected()) return undefined

    return misterios[selected()!] ?? undefined
  })

  function SeleccionarMisterios(ev: Event & { currentTarget: HTMLSelectElement }) {
    setSelected(ev.currentTarget.value as MisteriosValidos)
  }

  return (
      <>
        <h2>Lectura de los Misterios</h2>
        <select
            class="dark:bg-black"
            onChange={SeleccionarMisterios}
        >
          <option disabled>Selecciona los Misterios por Leer</option>
          <For each={Object.entries(misteriosPorDia)}>
            {([value, label]) => (
                <option value={value} selected={selected() === value}>
                  {label}
                </option>
            )}
          </For>
        </select>
        <Show when={!!selected()}>
          <h3>{title()}</h3>
          <ul>
            <For each={misteriosSeleccionados()}>
              {(entry) => (
                  <li>{entry}</li>
              )}
            </For>
          </ul>
        </Show>
      </>
  )
}
import {createSignal, createMemo, For, onMount, Show} from "solid-js";

interface MisterioSet {
  label: string
  days: readonly string[]
  items: readonly string[]
}

const misterios = {
  'gozosos': {
    label: 'Misterios Gozosos (Lunes y Sábado)',
    days: ['Monday', 'Saturday'],
    items: [
      'El anuncio del Ángel a María.',
      'La visita de la Santísima Virgen a Santa Isabel.',
      'El nacimiento de Jesús en el portal de Belén.',
      'La presentación de Jesús en el templo.',
      'Jesús perdido y hallado en el templo.',
    ]
  },
  'luminosos': {
    label: 'Misterios Luminosos (Jueves)',
    days: ['Thursday'],
    items: [
      'El Bautismo de Cristo en el Jordán.',
      'Su auto revelación en las bodas de Caná.',
      'El anuncio del Reino y llamado a la conversión.',
      'La Transfiguración del Señor.',
      'La Institución de la Eucaristía.',
    ]
  },
  'dolorosos': {
    label: 'Misterios Dolorosos (Martes y Viernes)',
    days: ['Tuesday', 'Friday'],
    items: [
      'La oración de Jesús en el Huerto.',
      'La flagelación de Jesús.',
      'Jesús es coronado de espinas.',
      'Jesús con la Cruz a cuestas.',
      'La crucifixión y muerte de Jesús.',
    ]
  },
  'gloriosos': {
    label: 'Misterios Gloriosos (Miércoles y Domingo)',
    days: ['Wednesday', 'Sunday'],
    items: [
      'La Resurrección de Nuestro Señor Jesucristo.',
      'La Ascensión de Jesús al Cielo.',
      'La venida del Espíritu Santo.',
      'La asunción de María al Cielo.',
      'La coronación y glorificación de María.',
    ]
  },
} as Record<string, MisterioSet>

type MisteriosValidos = keyof typeof misterios

function useMisterios() {
  const [selected, setSelected] = createSignal<MisteriosValidos | undefined>()

  const selectedMisterio = createMemo(() => {
    if (!selected() || !(selected()! in misterios)) return undefined

    return misterios[selected()!]
  })

  function selectByLabel(key: MisteriosValidos) {
    setSelected(key in misterios ? key : undefined)
  }

  function selectByDay(day: string) {
    setSelected(
        Object.keys(misterios)
            .find((key) => misterios[key].days.includes(day))
    )
  }

  function selectToday() {
    selectByDay(
        new Date().toLocaleString('en-US', {
          weekday: 'long'
        })
    )
  }

  return {
    selectedKey: selected,
    selected: selectedMisterio,
    selectByLabel,
    selectToday
  }
}

export default function () {
  const { selected, selectedKey, selectByLabel, selectToday } = useMisterios()

  onMount(() => selectToday())

  return (
      <>
        <h2>Lectura de los Misterios</h2>

        <select
            class="dark:bg-black mt-2"
            onChange={(e) => selectByLabel(e.currentTarget.value)}
        >
          <option disabled selected={!selectedKey()}>Selecciona los Misterios por Leer</option>
          <For each={Object.entries(misterios)}>
            {([value, {label}]) => (
                <option value={value} selected={selectedKey() === value}>
                  {label}
                </option>
            )}
          </For>
        </select>

        <Show when={selected()}>
          <ul>
            <For each={selected()!.items}>
              {(misterio) => (
                  <li>{misterio}</li>
              )}
            </For>
          </ul>
        </Show>
      </>
  )
}

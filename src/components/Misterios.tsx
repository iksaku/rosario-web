import {createSignal, For, Show} from "solid-js";

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
} as const

type MisteriosValidos = keyof typeof misterios

function misteriosDelDia(timezone: string): MisteriosValidos | undefined {
  const day = new Date().toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'long'
  });

  // @ts-ignore
  return Object.keys(misterios).find((key) => misterios[key].days.includes(day))
      || undefined
}

function ucfirst(str: string): string {
  return str[0].toUpperCase() + str.slice(1)
}

export default function (props: { timezone: string }) {
  const [selected, setSelected] = createSignal<MisteriosValidos | undefined>(misteriosDelDia(props.timezone))

  function onSelect(selected: string) {
    setSelected(
        selected in misterios
            ? selected as MisteriosValidos
            : undefined
    )
  }

  return (
      <>
        <h2>Lectura de los Misterios</h2>

        <select
            class="dark:bg-black"
            onChange={(e) => onSelect(e.currentTarget.value)}
        >
          <option disabled>Selecciona los Misterios por Leer</option>
          <For each={Object.entries(misterios)}>
            {([value, {label}]) => (
                <option value={value} selected={selected() === value}>
                  {label}
                </option>
            )}
          </For>
        </select>

        <Show when={selected()}>
          <h3 class="mt-4">Misterios {ucfirst(selected()!)}</h3>
          <ul>
            <For each={misterios[selected()!].items}>
              {(misterio) => (
                  <li>{misterio}</li>
              )}
            </For>
          </ul>
        </Show>
      </>
  )
}
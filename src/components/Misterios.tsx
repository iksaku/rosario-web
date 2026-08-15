import { createSignal, For, onMount, Show } from "solid-js"

interface MisterioSet {
    label: string
    days: readonly string[]
    items: readonly string[]
}

const misterios = {
    gozosos: {
        label: "Misterios Gozosos (Lunes y Sábado)",
        days: ["Monday", "Saturday"],
        items: [
            "El anuncio del Ángel a María.",
            "La visita de la Santísima Virgen a Santa Isabel.",
            "El nacimiento de Jesús en el portal de Belén.",
            "La presentación de Jesús en el templo.",
            "Jesús perdido y hallado en el templo.",
        ],
    },
    luminosos: {
        label: "Misterios Luminosos (Jueves)",
        days: ["Thursday"],
        items: [
            "El Bautismo de Cristo en el Jordán.",
            "Su auto revelación en las bodas de Caná.",
            "El anuncio del Reino y llamado a la conversión.",
            "La Transfiguración del Señor.",
            "La Institución de la Eucaristía.",
        ],
    },
    dolorosos: {
        label: "Misterios Dolorosos (Martes y Viernes)",
        days: ["Tuesday", "Friday"],
        items: [
            "La oración de Jesús en el Huerto.",
            "La flagelación de Jesús.",
            "Jesús es coronado de espinas.",
            "Jesús con la Cruz a cuestas.",
            "La crucifixión y muerte de Jesús.",
        ],
    },
    gloriosos: {
        label: "Misterios Gloriosos (Miércoles y Domingo)",
        days: ["Wednesday", "Sunday"],
        items: [
            "La Resurrección de Nuestro Señor Jesucristo.",
            "La Ascensión de Jesús al Cielo.",
            "La venida del Espíritu Santo.",
            "La asunción de María al Cielo.",
            "La coronación y glorificación de María.",
        ],
    },
} satisfies Record<string, MisterioSet>

type MisteriosValidos = keyof typeof misterios

// Data day names are English ("Monday", ...); timezone is the visitor's.
const todaysKey = (): MisteriosValidos | undefined =>
    (Object.keys(misterios) as MisteriosValidos[]).find((key) =>
        misterios[key].days.includes(
            new Date().toLocaleString("en-US", { weekday: "long" })
        )
    )

export default function () {
    const [openKey, setOpenKey] = createSignal<MisteriosValidos | undefined>()
    const [todayKey, setTodayKey] = createSignal<MisteriosValidos | undefined>()

    onMount(() => {
        // Client-side only: SSR weekday (UTC) can differ from the visitor's.
        const today = todaysKey()
        setTodayKey(today)
        setOpenKey(today)
    })

    return (
        <>
            <h2 class="section-title">Lectura de los Misterios</h2>
            <p class="mb-4 text-lg text-stone-500 dark:text-stone-400">
                Se rezan según el día de la semana.
            </p>
            <For each={Object.entries(misterios) as [MisteriosValidos, MisterioSet][]}>
                {([key, set]) => (
                    <div class="relative mb-4">
                        <Show when={key === todayKey()}>
                            <span class="absolute -top-2 right-4 z-10 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-stone-900 shadow">
                                Hoy
                            </span>
                        </Show>
                        <details
                            open={openKey() === key}
                            class={`group rounded-xl border-2 ${key === todayKey()
                                    ? "border-amber-500/70 bg-amber-50/60 dark:bg-amber-950/20"
                                    : "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
                                }`}
                        >
                        <summary
                            class="flex min-h-[64px] cursor-pointer list-none items-center justify-between px-5 py-4 text-xl font-semibold text-stone-800 dark:text-stone-100"
                            onClick={(e) => {
                                e.preventDefault()
                                setOpenKey(openKey() === key ? undefined : key)
                            }}
                        >
                            <span>{set.label}</span>
                            <span
                                aria-hidden="true"
                                class="text-2xl text-teal-700 transition-transform group-open:rotate-90 dark:text-teal-300"
                            >
                                ›
                            </span>
                        </summary>
                        <ol class="mx-12 mb-4 list-decimal space-y-1.5 border-stone-300 text-xl leading-relaxed text-stone-700 dark:border-teal-400/40 dark:text-white">
                            <For each={set.items}>
                                {(item) => <li class="mt-1.5">{item}</li>}
                            </For>
                        </ol>
                        <p class="mx-5 mb-4 rounded-lg bg-amber-50 px-4 py-3 text-base text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                            <strong>Nota:</strong> en cada misterio se reza un Padre
                            Nuestro y diez Ave Marías.
                        </p>
                        </details>
                    </div>
                )}
            </For>
        </>
    )
}

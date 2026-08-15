import { createSignal, onCleanup, onMount, Show } from "solid-js"

// Minimal shape of the non-standard beforeinstallprompt event.
interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
}

const DISMISS_KEY = "rosario-install-hint-dismissed"

const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent)

// navigator.standalone is iOS Safari-only and absent from lib.dom types.
const navStandalone = (navigator as { standalone?: boolean }).standalone

const isInstalled = () =>
    window.matchMedia("(display-mode: standalone)").matches || navStandalone === true

export default function InstallHint() {
    const [mode, setMode] = createSignal<"ios" | "prompt" | "hidden">("hidden")
    let deferredPrompt: BeforeInstallPromptEvent | undefined

    const dismiss = () => {
        localStorage.setItem(DISMISS_KEY, "1")
        setMode("hidden")
    }

    onMount(() => {
        if (localStorage.getItem(DISMISS_KEY) || isInstalled()) return

        if (isIOS()) {
            setMode("ios")
            return
        }

        const onPrompt = (e: Event) => {
            e.preventDefault()
            deferredPrompt = e as BeforeInstallPromptEvent
            setMode("prompt")
        }
        const onInstalled = () => dismiss()

        window.addEventListener("beforeinstallprompt", onPrompt)
        window.addEventListener("appinstalled", onInstalled)
        onCleanup(() => {
            window.removeEventListener("beforeinstallprompt", onPrompt)
            window.removeEventListener("appinstalled", onInstalled)
        })
    })

    return (
        <Show when={mode() !== "hidden"}>
            <div class="mb-10 flex items-start gap-4 rounded-xl border-2 border-teal-700/50 bg-white p-5 shadow-sm dark:border-teal-400/40 dark:bg-stone-900">
                <div class="flex-1">
                    <p class="text-xl font-semibold text-stone-800 dark:text-stone-100">
                        Añade esta guía a tu pantalla de inicio
                    </p>
                    <Show when={mode() === "ios"}>
                        <p class="mt-1 text-lg leading-relaxed text-stone-600 dark:text-stone-300">
                            Toca el botón <strong>Compartir</strong> y luego{" "}
                            <strong>«Añadir a pantalla de inicio»</strong>.
                        </p>
                    </Show>
                    <Show when={mode() === "prompt"}>
                        <button
                            type="button"
                            class="mt-3 min-h-[48px] rounded-lg bg-teal-700 px-6 text-lg font-semibold text-white dark:bg-teal-600"
                            onClick={() => deferredPrompt?.prompt()}
                        >
                            Instalar
                        </button>
                    </Show>
                </div>
                <button
                    type="button"
                    aria-label="Cerrar"
                    class="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg text-2xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                    onClick={dismiss}
                >
                    ×
                </button>
            </div>
        </Show>
    )
}

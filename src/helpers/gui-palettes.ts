import type GUI from 'lil-gui'

type Pal = { bg: string; colors: string[]; name: string }
export function makePalettesGui<T extends Pal>(
    gui: GUI,
    current: T,
    opts: T[],
    onUpdate?: (pal: T) => void,
) {
    const state = {
        current,
        options: [...opts],
        palsByName: Object.fromEntries(opts.map((p) => [p.name, p.name])),
    }

    const paletteProxy = {
        paletteIndex: state.options.findIndex((p) => p.name === state.current.name),
        paletteName: state.current.name,
    }

    const select = gui
        .add(paletteProxy, 'paletteName', state.palsByName)
        .onChange((palName: string) => {
            const ind = state.options.findIndex((opt) => opt.name === palName)
            setPalette(state.options[ind], ind)
            slider.updateDisplay()
        })

    const slider = gui
        .add(paletteProxy, 'paletteIndex', 0, state.options.length - 1, 1)
        .onChange((i: number) => {
            setPalette(state.options[i], i)
            select.updateDisplay()
        })

    const setPalette = (p: T, idx: number) => {
        paletteProxy.paletteName = p.name
        paletteProxy.paletteIndex = idx
        state.current = state.options[idx]
        onUpdate?.(p)
    }

    return {
        select,
        slider,
        set(p: T | string) {
            const idx = state.options.findIndex(
                typeof p === 'string' ? (opt) => opt.name === p : (opt) => opt.name === p.name,
            )
            state.current = state.options[idx]
            paletteProxy.paletteName = state.options[idx].name
            paletteProxy.paletteIndex = idx
            select.updateDisplay()
            slider.updateDisplay()
        },
        updateOptions(options: T[]) {
            state.options = [...options]
            state.palsByName = Object.fromEntries(state.options.map((p) => [p.name, p.name]))
            select.options(state.palsByName)
            slider.max(state.options.length - 1)
            select.updateDisplay()
            slider.updateDisplay()
        },
    }
}

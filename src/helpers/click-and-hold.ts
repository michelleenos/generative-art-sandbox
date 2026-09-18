type ClickHoldOpts = {
    el: HTMLElement
    fn: () => void
    interval?: number
    delay?: number
}

export function clickAndHold({ el, fn, interval = 80, delay = 300 }: ClickHoldOpts) {
    let holdDelayId: number | null = null
    let holdIntervalId: number | null = null

    el.addEventListener('pointerdown', (e) => {
        el.setPointerCapture(e.pointerId)
        fn()
        holdDelayId = window.setTimeout(() => {
            holdIntervalId = window.setInterval(fn, interval)
        }, delay)
    })

    const stopHold = () => {
        if (holdDelayId !== null) clearTimeout(holdDelayId)
        if (holdIntervalId !== null) clearInterval(holdIntervalId)
        holdDelayId = null
        holdIntervalId = null
    }

    el.addEventListener('pointerup', stopHold)
    el.addEventListener('pointercancel', stopHold)
    window.addEventListener('blur', stopHold)
}

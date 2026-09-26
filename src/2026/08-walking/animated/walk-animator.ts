import { chaikinSmoothTuple } from '~/helpers/chaikin-smooth'
import type { XY } from '../walking-utils'

/**
 * One animatable stroke (one continuous pen segment), smoothed and scaled to px.
 * `walker` keeps the source walker so order keys can sort on walker data.
 */
export type AnimPath<W> = {
    points: XY[]
    color: string
    walker: W
    /** full arc-length of the stroke, px */
    totalLength: number
    /** when this stroke starts painting, in seconds; set by `schedule` */
    startOffset: number
    /** px revealed so far; set by `scrubTo` */
    revealed: number
}

/**
 * get distance between points[i] and points[i+1]
 */
function segLength(points: XY[], i: number): number {
    return Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1])
}

/**
 * Smooth + flatten walkers into one `AnimPath` per stroke, ready to animate.
 * This is the animation's own version of `getFinalPaths` — it inlines the same
 * scale-then-Chaikin smoothing so the animation can carry its own per-stroke data
 * without perturbing the static drawings.
 */
export function buildAnimPaths<W extends { segments: XY[][]; color: string }>(
    walkers: W[],
    opts: { cell: number; cornerSmoothTimes: number; cornerSmoothAmt: number },
): AnimPath<W>[] {
    const { cell, cornerSmoothTimes, cornerSmoothAmt } = opts
    const out: AnimPath<W>[] = []

    walkers.forEach((walker) => {
        walker.segments.forEach((segment) => {
            const scaled: XY[] = segment.map(([x, y]) => [x * cell, y * cell])
            const points = chaikinSmoothTuple(scaled, cornerSmoothTimes, cornerSmoothAmt)

            // single points have nothing to reveal
            if (points.length < 2) return

            let totalLength = 0
            for (let i = 0; i < points.length - 1; i++) {
                totalLength += segLength(points, i)
            }

            out.push({
                points,
                color: walker.color,
                walker,
                totalLength,
                startOffset: 0,
                revealed: 0,
            })
        })
    })

    return out
}

export type EaseFn = (x: number) => number
const linear: EaseFn = (x) => x

/**
 * Timeline params that decide when each stroke starts. Changing any of these
 * needs a reschedule (`applyTimeline`).
 */
export type ScheduleOptions<W> = {
    /** sort key for entrance order; strokes with equal keys start together */
    orderKey: (p: AnimPath<W>, originalIndex: number) => number
    /**
     * - `stagger`: each order group starts before the previous ends by `overlap` of its duration
     * - `stagger-endings`: like `stagger`, but staggers finish times instead of start times
     * - `align-endings`: longer strokes start earlier so all finish together (ignores order)
     */
    mode: 'stagger' | 'stagger-endings' | 'align-endings'
    /** paint rate, px per second */
    speed: number
    /** 0–1 fraction of a stroke's duration that overlaps the next (stagger modes) */
    overlap: number
    /** remaps stagger start times across the span of entries (stagger modes) */
    staggerEase: EaseFn
}

/**
 * Compute each stroke's `startOffset` (seconds) and return the total duration.
 * Run only when order/mode/speed/overlap change — not per frame.
 */
function schedule<W>(paths: AnimPath<W>[], opts: ScheduleOptions<W>): number {
    const { orderKey, mode, speed, overlap, staggerEase } = opts
    if (paths.length === 0 || speed <= 0) return 0
    const dur = (p: AnimPath<W>) => p.totalLength / speed

    if (mode === 'align-endings') {
        let maxLen = 0
        for (const p of paths) maxLen = Math.max(maxLen, p.totalLength)
        for (const p of paths) p.startOffset = (maxLen - p.totalLength) / speed
        return maxLen / speed
    }

    // strokes sharing a key start together as a group; the gap to the next
    // group is (1 - overlap) of the group's longest stroke duration
    // (for stagger-endings, `startOffset` holds finish time until the end)
    const sorted = paths.map((p, i) => ({ p, k: orderKey(p, i) })).sort((a, b) => a.k - b.k)
    const gap = 1 - overlap
    let t = 0
    let i = 0
    while (i < sorted.length) {
        const groupKey = sorted[i].k
        let maxDur = 0
        while (i < sorted.length && sorted[i].k === groupKey) {
            sorted[i].p.startOffset = t
            maxDur = Math.max(maxDur, dur(sorted[i].p))
            i++
        }
        t += gap * maxDur
    }

    let lastAnchor = 0
    for (const p of paths) lastAnchor = Math.max(lastAnchor, p.startOffset)
    if (lastAnchor > 0) {
        for (const p of paths) {
            p.startOffset = Math.max(0, staggerEase(p.startOffset / lastAnchor) * lastAnchor)
        }
    }

    if (mode === 'stagger-endings') {
        let minStart = Infinity
        for (const p of paths) {
            p.startOffset -= dur(p)
            minStart = Math.min(minStart, p.startOffset)
        }
        for (const p of paths) p.startOffset -= minStart
    }

    let total = 0
    for (const p of paths) total = Math.max(total, p.startOffset + dur(p))
    return total
}

/**
 * Set every stroke's `revealed` length for global time `t` (seconds). `ease`
 * shapes each stroke's own 0–1 progress, so it eases in/out as it paints without
 * changing when it starts or ends.
 */
function scrubTo<W>(paths: AnimPath<W>[], t: number, speed: number, ease: EaseFn = linear) {
    for (const p of paths) {
        const duration = p.totalLength / speed
        const u = duration > 0 ? Math.max(0, Math.min(1, (t - p.startOffset) / duration)) : 0
        p.revealed = ease(u) * p.totalLength
    }
}

/**
 * The points to actually draw: every point up to `revealed` px along the stroke,
 * plus an end point interpolated into the current segment.
 */
function getRevealedPoints<W>(p: AnimPath<W>): XY[] {
    const { points } = p
    if (p.revealed <= 0) return []
    if (p.revealed >= p.totalLength) return points

    const out: XY[] = [points[0]]
    let remaining = p.revealed
    for (let i = 0; i < points.length - 1; i++) {
        const len = segLength(points, i)
        if (remaining < len) {
            const t = len > 0 ? remaining / len : 0
            const [a, b] = [points[i], points[i + 1]]
            out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
            break
        }
        remaining -= len
        out.push(points[i + 1])
    }
    return out
}

/** a stroke as it should be drawn this frame */
export type Stroke = { points: XY[]; color: string }

/** everything `PathAnimator` reads from `getOptions`: schedule params + `pathEase` */
type AnimatorOptions<W> = ScheduleOptions<W> & {
    /** shapes each stroke's own paint-on progress */
    pathEase: EaseFn
}

/**
 * Owns the playback loop over a set of `AnimPath`s: play/pause and scrubbing.
 * Knows nothing about canvas or GUI — it reads timeline params from `getOptions`,
 * scrubs the paths, and fires `onFrame` so the caller can draw `frame()`.
 */
export class PathAnimator<W> {
    paths: AnimPath<W>[] = []
    /** seconds; set by `applyTimeline` */
    duration = 0
    /** 0–1, synced each frame for a progress slider to bind to */
    progress = 0
    playing = false

    private onFrame: () => void
    private getOptions: () => AnimatorOptions<W>
    private elapsed = 0
    private rafId = 0
    private lastTime = 0

    constructor(opts: { onFrame: () => void; getOptions: () => AnimatorOptions<W> }) {
        this.onFrame = opts.onFrame
        this.getOptions = opts.getOptions
    }

    /** what to draw right now: each stroke's revealed points + color */
    frame(): Stroke[] {
        return this.paths.map((p) => ({ points: getRevealedPoints(p), color: p.color }))
    }

    /** swap in freshly built paths, holding the current progress fraction fixed */
    setPaths(paths: AnimPath<W>[]) {
        this.paths = paths
        this.applyTimeline()
    }

    /** reschedule then redraw, holding the current progress fraction fixed.
     * run when order/mode/speed/overlap/staggerEase change */
    applyTimeline() {
        const progress = this.progress
        this.duration = schedule(this.paths, this.getOptions())
        this.elapsed = progress * this.duration
        this.update()
    }

    /** redraw the current frame without rescheduling (e.g. after pathEase change) */
    update() {
        const { speed, pathEase } = this.getOptions()
        const d = this.duration
        this.elapsed = Math.max(0, Math.min(d, this.elapsed))
        scrubTo(this.paths, this.elapsed, speed, pathEase)
        this.progress = d > 0 ? this.elapsed / d : 0
        this.onFrame()
    }

    private tick = (now: number) => {
        const dt = (now - this.lastTime) / 1000
        this.lastTime = now
        this.elapsed = Math.min(this.duration, this.elapsed + dt)
        this.update()
        if (this.elapsed >= this.duration) {
            this.playing = false
            return
        }
        this.rafId = requestAnimationFrame(this.tick)
    }

    play() {
        if (this.playing) return
        if (this.elapsed >= this.duration) this.elapsed = 0
        this.playing = true
        this.lastTime = performance.now()
        this.rafId = requestAnimationFrame(this.tick)
    }

    pause() {
        this.playing = false
        cancelAnimationFrame(this.rafId)
    }

    toggle() {
        this.playing ? this.pause() : this.play()
    }

    restart() {
        this.pause()
        this.elapsed = 0
        this.play()
    }

    /** jump to a 0–1 progress position (pauses playback) */
    seek(progress: number) {
        this.pause()
        this.elapsed = progress * this.duration
        this.update()
    }
}

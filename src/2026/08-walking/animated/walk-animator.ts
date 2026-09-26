import { chaikinSmoothTuple } from '~/helpers/chaikin-smooth'
import type { XY } from '../walking-utils'
import { Walker } from '../walker'

type AnimWalker = { segments: XY[][]; color: string }

/**
 * One animatable stroke (one continuous pen segment), smoothed and scaled to px.
 * The cursor fields (`drawnIndex`, `carry`, `revealedLength`, `done`) are mutable
 * state advanced by `advancePath`. `walker` keeps the source walker so `applyOrder`
 * keys can sort on walker data (pattern, direction, etc).
 */
export type AnimPath<W = Walker> = {
    points: XY[]
    color: string
    walker: W
    /** entrance rank; set by `applyOrder`, defaults to flat generation order */
    order: number
    /** when this stroke starts painting, in seconds; set by `schedule` */
    startOffset: number
    /** full arc-length of the stroke (a scalar, not a per-point array) */
    totalLength: number
    /** index of the last fully-revealed point */
    drawnIndex: number
    /** pixels revealed INTO the segment after `drawnIndex` */
    carry: number
    /** total px revealed so far (kept in sync for absolute scrubbing) */
    revealedLength: number
    done: boolean
}

export type BuildAnimPathsOptions = {
    cell: number
    cornerSmoothTimes: number
    cornerSmoothAmt: number
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
export function buildAnimPaths<W extends AnimWalker>(
    walkers: W[],
    opts: BuildAnimPathsOptions,
): AnimPath<W>[] {
    const { cell, cornerSmoothTimes, cornerSmoothAmt } = opts
    const out: AnimPath<W>[] = []
    let flatIndex = 0

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
                order: flatIndex,
                startOffset: 0,
                totalLength,
                drawnIndex: 0,
                carry: 0,
                revealedLength: 0,
                done: false,
            })

            flatIndex++
        })
    })

    return out
}

/**
 * Move the pen along a stroke by `delta` px.
 * Positive paints on, negative un-paints.
 */
export function advancePath(p: AnimPath, delta: number): void {
    const { points } = p
    const last = points.length - 1

    // clamp first so carry can't overflow past the ends
    const newRevealed = Math.max(0, Math.min(p.totalLength, p.revealedLength + delta))
    let remaining = p.carry + (newRevealed - p.revealedLength)

    // forward: consume whole segments we can cover
    let segLen: number
    while (p.drawnIndex < last && remaining >= (segLen = segLength(points, p.drawnIndex))) {
        remaining -= segLen
        p.drawnIndex++
    }

    // backward: step back over segments while we've over-spent
    while (p.drawnIndex > 0 && remaining < 0) {
        p.drawnIndex--
        remaining += segLength(points, p.drawnIndex)
    }

    p.carry = remaining
    p.revealedLength = newRevealed
    p.done = newRevealed >= p.totalLength
}

/**
 * Assign each stroke an `order` rank by sorting on `key` (ascending). `key`
 * Ranking is dense: strokes with an equal key share a rank, so a key that
 * collides (e.g. by color) forms groups that `schedule` starts together.
 * Ordering is independent of scheduling — it only sets the sequence.
 */
export function applyOrder<W>(
    paths: AnimPath<W>[],
    key: (p: AnimPath<W>, originalIndex: number) => number,
): void {
    const withKey = paths.map((p, i) => ({ p, k: key(p, i) })).sort((a, b) => a.k - b.k)
    let rank = 0
    withKey.forEach(({ p, k }, i) => {
        if (i > 0 && k !== withKey[i - 1].k) rank++
        p.order = rank
    })
}

export type ScheduleMode = 'stagger' | 'stagger-endings' | 'align-endings'

export type ScheduleOptions = {
    /** paint rate, px per second */
    speed: number
    /** 0–1 fraction of a stroke's duration that overlaps the next (stagger mode) */
    overlap: number
    /** remaps stagger start times across the span of entries (stagger mode) */
    staggerEase?: EaseFn
}

/**
 * Compute each stroke's `startOffset` (seconds) for the chosen mode. Run only
 * when mode/order/speed/overlap change — not per frame.
 * - `stagger`: each stroke starts before the previous ends by `overlap` of its duration
 * - `stagger-endings`: like `stagger`, but staggers finish times instead of start times
 * - `align-endings`: longer strokes start earlier so all finish together.
 */
export function schedule(paths: AnimPath[], mode: ScheduleMode, opts: ScheduleOptions): void {
    const { speed, overlap, staggerEase = linear } = opts

    if (mode === 'align-endings') {
        let maxLen = 0
        for (const p of paths) maxLen = Math.max(maxLen, p.totalLength)
        for (const p of paths) p.startOffset = (maxLen - p.totalLength) / speed
        return
    }

    // strokes sharing an order start together as a group; the gap to the next
    // group is (1 - overlap) of the group's longest stroke duration
    // (for stagger-endings, `startOffset` holds finish time until the end)
    const gap = 1 - overlap
    const sorted = [...paths].sort((a, b) => a.order - b.order)
    let t = 0
    let i = 0
    while (i < sorted.length) {
        const groupOrder = sorted[i].order
        let maxDur = 0
        while (i < sorted.length && sorted[i].order === groupOrder) {
            sorted[i].startOffset = t
            maxDur = Math.max(maxDur, sorted[i].totalLength / speed)
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
            p.startOffset -= p.totalLength / speed
            minStart = Math.min(minStart, p.startOffset)
        }
        for (const p of paths) p.startOffset -= minStart
    }
}

/** total animation length in seconds (needs `startOffset` already scheduled) */
export function timelineDuration(paths: AnimPath[], speed: number): number {
    if (paths.length === 0 || speed <= 0) return 0
    let max = 0
    for (const p of paths) {
        max = Math.max(max, p.startOffset + p.totalLength / speed)
    }
    return max
}

export type EaseFn = (x: number) => number

const linear: EaseFn = (x) => x

/**
 * Drive every stroke to where it should be at global time `t` (seconds). `ease`
 * shapes each stroke's own 0–1 progress, so it eases in/out as it paints without
 * changing when it starts or ends.
 */
export function scrubTo(paths: AnimPath[], t: number, speed: number, ease: EaseFn = linear): void {
    for (const p of paths) {
        const duration = p.totalLength / speed
        const u = duration > 0 ? Math.max(0, Math.min(1, (t - p.startOffset) / duration)) : 0
        const target = ease(u) * p.totalLength
        advancePath(p, target - p.revealedLength)
    }
}

/**
 * The points to actually draw for the current cursor position: the fully-revealed
 * segments plus an end point interpolated between the last point and `carry` px
 * into the current segment.
 */
export function getRevealedPoints(p: AnimPath): XY[] {
    const { points, drawnIndex } = p
    if (p.revealedLength <= 0) return []
    if (p.done || drawnIndex >= points.length - 1) return points

    const revealed = points.slice(0, drawnIndex + 1)
    const segLen = segLength(points, drawnIndex)
    const t = segLen > 0 ? p.carry / segLen : 0
    const a = points[drawnIndex]
    const b = points[drawnIndex + 1]
    revealed.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
    return revealed
}

export type OrderKey<W> = (p: AnimPath<W>, originalIndex: number) => number

export type PathAnimatorOptions<W> = {
    /** called after each scrub so the caller can redraw */
    onFrame: () => void
    orderKey?: OrderKey<W>
    speed?: number
    overlap?: number
    mode?: ScheduleMode
    pathEase?: EaseFn
    staggerEase?: EaseFn
}

/**
 * Owns the playback loop over a set of `AnimPath`s: play/pause, timeline params,
 * and scrubbing. Knows nothing about canvas or GUI — it scrubs the paths and
 * fires `onFrame` for the caller to draw.
 */
export class PathAnimator<W extends Walker> {
    paths: AnimPath<W>[] = []
    speed: number
    overlap: number
    mode: ScheduleMode
    orderKey: OrderKey<W>
    /** shapes each stroke's own paint-on progress */
    pathEase: EaseFn
    /** shapes the spacing of stroke start times (stagger mode) */
    staggerEase: EaseFn
    /** 0–1, synced each frame for a progress slider to bind to */
    progress = 0
    playing = false

    private onFrame: () => void
    private elapsed = 0
    private rafId = 0
    private lastTime = 0

    constructor(opts: PathAnimatorOptions<W>) {
        this.onFrame = opts.onFrame
        this.orderKey = opts.orderKey ?? ((_p, i) => i)
        this.speed = opts.speed ?? 400
        this.overlap = opts.overlap ?? 0.9
        this.mode = opts.mode ?? 'stagger'
        this.pathEase = opts.pathEase ?? linear
        this.staggerEase = opts.staggerEase ?? linear
    }

    get duration() {
        return timelineDuration(this.paths, this.speed)
    }

    /** swap in freshly built paths, holding the current progress fraction fixed */
    setPaths(paths: AnimPath<W>[]) {
        const playing = this.playing
        const progress = this.progress
        this.pause()
        this.paths = paths
        this.reschedule()
        this.elapsed = progress * this.duration
        playing ? this.play() : this.update()
    }

    /** recompute order + startOffsets; run when order/mode/speed/overlap change */
    reschedule() {
        applyOrder(this.paths, this.orderKey)
        schedule(this.paths, this.mode, {
            speed: this.speed,
            overlap: this.overlap,
            staggerEase: this.staggerEase,
        })
    }

    /** reschedule then redraw, holding the current progress fraction fixed */
    applyTimeline() {
        const progress = this.progress
        this.reschedule()
        this.elapsed = progress * this.duration
        this.update()
    }

    /** redraw the current frame without rescheduling (e.g. after pathEase change) */
    refresh() {
        this.update()
    }

    private update() {
        const d = this.duration
        this.elapsed = Math.max(0, Math.min(d, this.elapsed))
        scrubTo(this.paths, this.elapsed, this.speed, this.pathEase)
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

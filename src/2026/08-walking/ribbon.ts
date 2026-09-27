import { createNoise2D, NoiseFunction2D } from 'simplex-noise'
import { chaikinSmoothTuple } from '~/helpers/chaikin-smooth'
import { map } from '~/helpers/utils'

type RibbonParams = {
    /** width of the ribbon stroke */
    strokeWidth: number
    /** 0-1. width of the stroke at the tapered ends, as a percentage of `strokeWidth` */
    taper: number
    /**
     * Length of the taper. If shorter than the overall stroke length, the full
     * `strokeWidth` value will not be reached
     */
    taperLen: number
    /**
     * Use `symmetric` to taper at both ends, or `start`/`end` to taper only at one end.
     */
    taperType?: 'start' | 'end' | 'symmetric'
}

type RibbonStep = {
    e1: [number, number]
    e2: [number, number]
}

export type Ribbon = RibbonStep[]

function progress(distance: number, max: number) {
    if (distance >= max) return 1
    return distance / max
}

export function getRibbon(
    pts: [number, number][],
    { strokeWidth, taper, taperLen, taperType = 'symmetric' }: RibbonParams,
) {
    const len = pts.length
    const results: Ribbon = []
    let distance = 0
    let last: [number, number] | null = null

    const calculateRibbon = (i: number) => {
        const pt = pts[i]
        if (last !== null) distance += Math.hypot(pt[0] - last[0], pt[1] - last[1])
        last = pt

        let w = strokeWidth
        if (taper !== 1) {
            let pTaper = progress(distance, taperLen)
            w = map(pTaper, 0, 1, strokeWidth * taper, strokeWidth)
        }
        w /= 2

        const a = pts[Math.max(0, i - 1)]
        const b = pts[Math.min(len - 1, i + 1)]

        const dx = b[0] - a[0]
        const dy = b[1] - a[1]
        const mag = Math.hypot(dx, dy)
        const dirX = mag === 0 ? 1 : dx / mag
        const dirY = mag === 0 ? 0 : dy / mag
        const normalX = -dirY
        const normalY = dirX

        // miter: stretch w at corners so the ribbon keeps its full width instead of pinching
        // actualSeg: the real segment from the previous point to pt (zero-length at i = 0, so skipped)
        const actualSeg = [pt[0] - a[0], pt[1] - a[1]]
        const actualSegLen = Math.hypot(actualSeg[0], actualSeg[1])
        if (actualSegLen > 0) {
            // dot product (A.x * B.x + A.y * B.y) measures how different two directions are:
            // 1 = same direction, ~0.71 = 45° apart, 0 = perpendicular.
            // Compares the averaged direction (a -> b) with the 'actual' direction (current -> next pt)
            const cos = (actualSeg[0] * dirX + actualSeg[1] * dirY) / actualSegLen
            // max is to avoid divide by scaling wayyy up or divide by 0 in the case of a u-turn or near
            // similar to canvas `miterLimit`
            w /= Math.max(cos, 0.25)
        }

        const e1 = [pt[0] + normalX * w, pt[1] + normalY * w] as [number, number]
        const e2 = [pt[0] - normalX * w, pt[1] - normalY * w] as [number, number]

        results[i] = { e1, e2 }
    }

    if (taperType === 'symmetric') {
        for (let i = 0; i < Math.floor(len / 2); i++) calculateRibbon(i)

        last = null
        distance = 0
        for (let i = len - 1; i >= Math.floor(len / 2); i--) calculateRibbon(i)
    } else if (taperType === 'start') {
        for (let i = 0; i < len; i++) calculateRibbon(i)
    } else {
        for (let i = len - 1; i >= 0; i--) calculateRibbon(i)
    }

    return results
}

function displacePoint(
    [x, y]: [number, number],
    {
        noise,
        freq,
        scale,
        offset,
    }: { noise: NoiseFunction2D; freq: number; scale: number; offset: number },
): [number, number] {
    let nx = noise(x * freq + offset, y * freq + offset)
    let ny = noise(x * freq + offset + 123, y * freq + offset + 123)
    return [x + nx * scale, y + ny * scale]
}

type WobblyRibbonParams = RibbonParams & {
    count: number
    freq: number
    scale: number
    offsetEach: number
    noise: NoiseFunction2D
}
export function getWobblyRibbons(
    pts: [number, number][],
    { count, freq, scale, offsetEach, noise, ...rest }: WobblyRibbonParams,
) {
    freq = freq / 100
    let results: Ribbon[] = []
    while (results.length < count) {
        // let displacedPts: [number, number][] = []
        let displaced = pts.map((pt) => {
            return displacePoint(pt, { freq, scale, noise, offset: results.length * offsetEach })
        })
        results.push(getRibbon(displaced, rest))
    }
    return results
}

/**
 * Half-circle cap from `from` to `to`, bulging outward. Both caps sweep anticlockwise
 * because e1 always sits on the +normal side of the direction of travel.
 */
function roundCap(ctx: CanvasRenderingContext2D, from: [number, number], to: [number, number]) {
    const cx = (from[0] + to[0]) / 2
    const cy = (from[1] + to[1]) / 2
    const r = Math.hypot(to[0] - from[0], to[1] - from[1]) / 2
    const a1 = Math.atan2(from[1] - cy, from[0] - cx)
    const a2 = Math.atan2(to[1] - cy, to[0] - cx)
    ctx.arc(cx, cy, r, a1, a2, true)
}

/**
 * @param edgeSmoothTimes - chaikin passes applied to each edge after offsetting.
 * Rounds inner corners, where the offset edge otherwise folds into a sharp point.
 */
export function smoothDrawRibbon(
    ribbon: Ribbon,
    ctx: CanvasRenderingContext2D,
    edgeSmoothTimes = 0,
    edgeSmoothAmt = 0.25,
) {
    const left = chaikinSmoothTuple(
        ribbon.map((r) => r.e1),
        edgeSmoothTimes,
        edgeSmoothAmt,
    )
    const right = chaikinSmoothTuple(
        ribbon.map((r) => r.e2),
        edgeSmoothTimes,
        edgeSmoothAmt,
    )
    const len = left.length

    ctx.moveTo(...left[0])
    for (let i = 1; i < len; i++) ctx.lineTo(...left[i])
    roundCap(ctx, left[len - 1], right[len - 1])
    for (let i = len - 2; i >= 0; i--) ctx.lineTo(...right[i])
    roundCap(ctx, right[0], left[0])
    ctx.closePath()
}

import { PaletteVariant } from 'mish-bainrow'
import { makeRandomSeed, makeRng, Rng } from '~/helpers/prng'
import { shuffle } from '~/helpers/utils'

export type XY = [number, number]

export interface Walker {
    done: boolean
    walk: () => void
}

export function walkUntilDone(walker: Walker) {
    while (!walker.done) {
        walker.walk()
    }
}

export function walkStep(walkers: Walker[], together = true) {
    if (together) {
        walkers.forEach((w) => w.walk())
    } else {
        for (let i = 0; i < walkers.length; i++) {
            let walker = walkers[i]
            if (walker.done) continue
            walkUntilDone(walker)
            break
        }
    }
}

export function walkAll(walkers: Walker[], together = true) {
    if (together) {
        let allDone = false
        while (!allDone) {
            let roundDone = true
            for (let i = 0; i < walkers.length; i++) {
                let walker = walkers[i]
                if (walker.done) continue

                roundDone = false
                walker.walk()
            }
            allDone = roundDone
        }
    } else {
        for (let i = 0; i < walkers.length; i++) {
            let walker = walkers[i]
            walkUntilDone(walker)
        }
    }
}

export function midpoint(a: XY, b: XY): XY {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
}

export function smoothDrawPath(ctx: CanvasRenderingContext2D, steps: XY[]) {
    const len = steps.length
    if (len <= 1) return
    ctx.moveTo(steps[0][0], steps[0][1])
    for (let i = 0; i < len - 1; i++) {
        const mid = midpoint(steps[i], steps[i + 1])
        ctx.quadraticCurveTo(steps[i][0], steps[i][1], mid[0], mid[1])
    }
    ctx.lineTo(...steps[len - 1])
}

export function drawPath(ctx: CanvasRenderingContext2D, steps: XY[]) {
    const len = steps.length
    if (len <= 1) return
    ctx.moveTo(steps[0][0], steps[0][1])
    for (let i = 1; i < len; i++) {
        ctx.lineTo(steps[i][0], steps[i][1])
    }
}

type DrawGridParams = {
    cols: number
    rows: number
    cell: number
}
export function drawGrid(ctx: CanvasRenderingContext2D, { cols, rows, cell }: DrawGridParams) {
    let height = rows * cell
    let width = cols * cell
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 0.15
    for (let x = 0; x < cols + 1; x++) {
        ctx.beginPath()
        ctx.moveTo(x * cell, 0)
        ctx.lineTo(x * cell, height)
        ctx.stroke()
    }
    for (let y = 0; y < rows + 1; y++) {
        ctx.beginPath()
        ctx.moveTo(0, y * cell)
        ctx.lineTo(width, y * cell)
        ctx.stroke()
    }
}

export function getColors(palette: PaletteVariant, _rng: Rng) {
    const rng = makeRng(makeRandomSeed(_rng))
    return {
        ...palette,
        colors: shuffle([...palette.colors], rng),
    }
}

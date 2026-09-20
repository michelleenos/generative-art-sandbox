import { chaikinSmoothTuple } from '~/helpers/chaikin-smooth'
import { Rng } from '~/helpers/prng'
import { Field } from './field'
import { createPatterns, createTessPatterns } from './patterns'
import { SquareDir } from './walk-directions'
import { Walker } from './walker'

export type XY = [number, number]

// export interface Walker {
//     done: boolean
//     walk: () => void
// }

export type WalkerParams = {
    field: Field
    start: XY
    maxSteps: number
    color: string
    startDir: SquareDir
    wrap?: boolean
}

type WalkerCtor<W extends Walker> = new (params: WalkerParams) => W

export type InitWalkersOptions = {
    colors: string[]
    rng: Rng
    count: number
    tileMin: number
    tileMax: number
    patternEven: boolean
    tesselation: boolean
    maxSteps: number
    wrap: boolean
}

export function initWalkers<W extends Walker>(
    Ctor: WalkerCtor<W>,
    field: Field,
    {
        colors,
        rng,
        count,
        tileMin,
        tileMax,
        patternEven,
        tesselation,
        maxSteps,
        wrap,
    }: InitWalkersOptions,
): W[] {
    let walkers: W[] = []
    const patternParams = {
        rng,
        count,
        tileMin,
        tileMax,
        type: patternEven ? 'even' : 'mixed',
    } as const
    let patterns = tesselation
        ? createTessPatterns({
              ...patternParams,
              rows: field.rows,
              cols: field.cols,
          })
        : createPatterns(patternParams)

    let pi = 0
    patterns.forEach(({ nx, ny, dir }) => {
        let x = 0
        let color = colors[pi % colors.length]
        pi++

        while (nx(x) < field.cols) {
            let y = 0
            while (ny(y) < field.rows) {
                if (field.valid(nx(x), ny(y))) {
                    const walker = new Ctor({
                        field,
                        start: [nx(x), ny(y)],
                        startDir: dir,
                        maxSteps,
                        color,
                        wrap,
                    })
                    walker.patternIndex = pi
                    walkers.push(walker)
                }
                y++
            }
            x++
        }
    })

    return walkers
}

export type SmoothOptions = {
    cell: number
    cornerSmoothTimes: number
    cornerSmoothAmt: number
}

export function getFinalPaths<W extends { segments: XY[][] }>(
    walkers: W[],
    { cell, cornerSmoothTimes, cornerSmoothAmt }: SmoothOptions,
) {
    return walkers.map((walker) => {
        let paths = walker.segments.map((s) => {
            let scaled: XY[] = s.map(([x, y]) => [x * cell, y * cell])
            return chaikinSmoothTuple(scaled, cornerSmoothTimes, cornerSmoothAmt)
        })
        return { walker, paths }
    })
}

export function walkStep(walkers: Walker[], together = true) {
    if (together) {
        walkers.forEach((w) => w.walk())
    } else {
        for (let i = 0; i < walkers.length; i++) {
            let walker = walkers[i]
            if (walker.done) continue
            while (!walker.done) walker.walk()
            break
        }
    }
}

export function walkAll(walkers: Walker[], together = true) {
    if (together) {
        // step every walker once per round until all are done
        while (walkers.some((walker) => !walker.done)) {
            for (let walker of walkers) {
                if (!walker.done) walker.walk()
            }
        }
    } else {
        // start from the first, walk til done, only then move to the next
        for (let walker of walkers) {
            while (!walker.done) walker.walk()
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

import GUI from 'lil-gui'
import '~/style.css'
import createCanvas from '~/helpers/create-canvas'
import { makeRandomSeed, makeRng, Rng } from '~/helpers/prng'
import { Sizes } from '~/helpers/sizes'
import { palettes, WalkerPalette } from '../walker-palettes'
import { initWalkers, smoothDrawPath, walkAll } from '../walking-utils'
import { Field } from '../field'
import { shuffle } from '~/helpers/utils'
import { Walker3 } from '../03/walker3'
import {
    AnimPath,
    buildAnimPaths,
    getRevealedPoints,
    PathAnimator,
    ScheduleMode,
} from './walk-animator'
import { easing, Easing } from '~/helpers/easings'
import { makePalettesGui } from '~/helpers/gui-palettes'
import { Walker } from '../walker'

const C = {
    cell: 10,
    grid: 80,
    patterns: 7,
    maxSteps: 200,
    tileMin: 10,
    tileMax: 12,
    walkTogether: true,
    wrap: true,
    patternEven: true,
    tesselation: true,
    cornerSmoothTimes: 2,
    cornerSmoothAmt: 0.25,

    clip: false,
    extraCells: 0,

    // animation
    speed: 400,
    overlap: 0.8,
    mode: 'stagger' as ScheduleMode,
    orderBy: 'centerOut' as keyof typeof orderKeys,
    pathEase: 'inOutSine' as Easing,
    staggerEase: 'linear' as Easing,
}

/**
 * Rings expanding from a point given as a 0–1 fraction of the field.
 * Distance is rounded to whole cells so each ring starts together.
 */
function radialFrom(fx: number, fy: number) {
    return (p: AnimPath<Walker3>) => {
        const { cols, rows } = p.walker.field
        const [x, y] = p.points[0]
        return Math.round(Math.hypot(x / C.cell - fx * (cols - 1), y / C.cell - fy * (rows - 1)))
    }
}

const orderKeys = {
    generation: (_p: AnimPath<Walker3>, i: number) => i,
    longestFirst: (p: AnimPath<Walker3>) => -p.totalLength,
    shortestFirst: (p: AnimPath<Walker3>) => p.totalLength,
    leftToRight: (p: AnimPath<Walker3>) => p.points[0][0],
    topLeft: (p: AnimPath<Walker3>) => p.points[0][0] + p.points[0][1],
    byPattern: (p: AnimPath<Walker3>) => p.walker.patternIndex,
    centerOut: radialFrom(0.5, 0.5),
    topLeftOut: radialFrom(0, 0),

    together: () => 0,
}

class Drawing {
    seed!: number
    rng!: Rng
    inner!: { cols: number; rows: number; w: number; h: number }
    outer!: { cols: number; rows: number; w: number; h: number }
    field!: Field
    walkers!: Walker3[]
    animPaths!: AnimPath<Walker3>[]
    palette: WalkerPalette

    constructor(palette: WalkerPalette, seed?: number) {
        this.palette = palette
        this.generate(seed)
    }

    generate(seed: number | boolean = true) {
        if (typeof seed === 'number') {
            this.seed = seed
        } else if (seed === true) {
            this.seed = makeRandomSeed()
        }
        console.log(`SEED: ${this.seed}`)
        this.rng = makeRng(this.seed)

        const cols = C.grid
        const rows = C.grid
        this.inner = { cols, rows, w: cols * C.cell, h: rows * C.cell }

        const oCols = cols + C.extraCells
        const oRows = rows + C.extraCells
        this.outer = { cols: oCols, rows: oRows, w: oCols * C.cell, h: oRows * C.cell }

        this.field = new Field(oCols, oRows)
        const colors = shuffle([...this.palette.colors], makeRng(makeRandomSeed(this.rng)))
        this.walkers = initWalkers(Walker3, this.field, {
            colors,
            rng: this.rng,
            count: C.patterns,
            tileMin: C.tileMin,
            tileMax: C.tileMax,
            patternEven: C.patternEven,
            tesselation: C.tesselation,
            maxSteps: C.maxSteps,
            wrap: C.wrap,
        })

        walkAll(this.walkers, C.walkTogether)
        this.animPaths = buildAnimPaths(this.walkers, {
            cell: C.cell,
            cornerSmoothTimes: C.cornerSmoothTimes,
            cornerSmoothAmt: C.cornerSmoothAmt,
        })
    }

    draw(ctx: CanvasRenderingContext2D, sizes: Sizes) {
        const lw = C.cell * 0.7
        ctx.fillStyle = this.palette.bg
        ctx.fillRect(0, 0, sizes.width, sizes.height)

        ctx.save()
        ctx.translate((sizes.width - this.inner.w) / 2, (sizes.height - this.inner.h) / 2)

        if (C.clip) {
            ctx.beginPath()
            ctx.rect(0, 0, this.inner.w, this.inner.h)
            ctx.clip()
        }

        ctx.translate((this.inner.w - this.outer.w) / 2, (this.inner.h - this.outer.h) / 2)
        ctx.translate(C.cell / 2, C.cell / 2)
        ctx.lineCap = 'round'
        ctx.lineWidth = lw
        this.animPaths.forEach((p) => {
            ctx.strokeStyle = p.color
            ctx.beginPath()
            smoothDrawPath(ctx, getRevealedPoints(p))
            ctx.stroke()
        })

        ctx.restore()
    }
}

/**
 * Setup
 */

const palette = palettes[5]
const sizes = new Sizes()
const { ctx, resizeCanvas } = createCanvas(sizes.width, sizes.height)

const drawing = new Drawing(palette)

const animator = new PathAnimator<Walker3>({
    onFrame: () => drawing.draw(ctx, sizes),
    speed: C.speed,
    overlap: C.overlap,
    mode: C.mode,
    orderKey: orderKeys[C.orderBy],
    pathEase: easing[C.pathEase],
    staggerEase: easing[C.staggerEase],
})
animator.setPaths(drawing.animPaths)

/** push the config in C onto the animator */
const syncAnimator = () => {
    animator.speed = C.speed
    animator.overlap = C.overlap
    animator.mode = C.mode
    animator.orderKey = orderKeys[C.orderBy]
    animator.pathEase = easing[C.pathEase]
    animator.staggerEase = easing[C.staggerEase]
}

sizes.on('resize', (width, height) => {
    resizeCanvas(width, height)
    drawing.draw(ctx, sizes)
})

animator.play()

/**
 * GUI
 */
const onTimelineChange = () => {
    syncAnimator()
    animator.applyTimeline()
}
const regenerate = (seed: number | boolean) => {
    drawing.generate(seed)
    animator.setPaths(drawing.animPaths)
}

const gui = new GUI()
gui.add(drawing, 'seed').listen()

gui.add({ playPause: () => animator.toggle() }, 'playPause')
gui.add({ restart: () => animator.restart() }, 'restart')

gui.add(animator, 'progress', 0, 1, 0.001)
    .listen()
    .onChange((v: number) => animator.seek(v))

gui.add(C, 'mode', ['stagger', 'stagger-endings', 'align-endings']).onChange(onTimelineChange)
gui.add(C, 'orderBy', Object.keys(orderKeys)).onChange(onTimelineChange)
gui.add(C, 'speed', 40, 2000, 1).onChange(onTimelineChange)
gui.add(C, 'overlap', 0, 1, 0.01).onChange(onTimelineChange)
gui.add(C, 'staggerEase', Object.keys(easing)).onChange(onTimelineChange)
gui.add(C, 'pathEase', Object.keys(easing)).onChange(() => {
    syncAnimator()
    animator.refresh()
})

gui.add({ newSeed: () => regenerate(true) }, 'newSeed')

const f = gui.addFolder('drawing')
f.add(C, 'grid', 20, 150, 1)
f.add(C, 'patterns', 1, 20, 1)
f.add(C, 'maxSteps', 2, 2000, 1)
f.add(C, 'tileMin', 2, 50, 1)
f.add(C, 'tileMax', 2, 50, 1)
f.add(C, 'walkTogether')
f.add(C, 'patternEven')
f.add(C, 'tesselation')
f.add(C, 'wrap')
f.onChange(() => regenerate(false))

makePalettesGui(gui.addFolder('colors'), drawing.palette, palettes, (pal) => {
    drawing.palette = pal
    regenerate(false)
})

// @ts-ignore
window.debg = { drawing, animator, ctx, sizes, C }

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
import { Walker } from '../walker'
import { AnimPath, buildAnimPaths, PathAnimator, ScheduleOptions, Stroke } from './walk-animator'
import { easing, Easing } from '~/helpers/easings'
import { makePalettesGui } from '~/helpers/gui-palettes'
import { getRibbon, getWobblyRibbons, smoothDrawRibbon } from '../ribbon'
import { createNoise2D, NoiseFunction2D } from 'simplex-noise'

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
    tesselation: false,
    // centerline smoothing; keep 0 so the ribbon offsets a clean polygon
    cornerSmoothTimes: 0,
    cornerSmoothAmt: 0.25,
    // rounds the ribbon's edges after offsetting
    edgeSmoothTimes: 3,
    edgeSmoothAmt: 0.25,

    // line width as a fraction of cell
    lineWidth: 0.7,
    // noise values below are relative to the line width, so they hold up when `cell` changes
    // wobble amount, in line widths
    noiseScale: 0.3,
    // wobble frequency, per line width (x0.01)
    noiseFreq: 0.7,
    noiseOffsetEach: 5,
    widthVary: 0.2,
    // width-variation frequency, per line width (x0.01)
    widthFreq: 0.35,
    alpha: 0.25,
    count: 8,

    clip: false,
    extraCells: 0,

    // animation
    // cells per second
    speed: 40,
    overlap: 0.8,
    mode: 'stagger' as ScheduleOptions<Walker>['mode'],
    orderBy: 'centerOut' as keyof typeof orderKeys,
    pathEase: 'inOutSine' as Easing,
    staggerEase: 'linear' as Easing,
}

/**
 * Rings expanding from a point given as a 0–1 fraction of the field.
 * Distance is rounded to whole cells so each ring starts together.
 */
function radialFrom(fx: number, fy: number) {
    return (p: AnimPath<Walker>) => {
        const { cols, rows } = p.walker.field
        const [x, y] = p.points[0]
        return Math.round(Math.hypot(x / C.cell - fx * (cols - 1), y / C.cell - fy * (rows - 1)))
    }
}

const orderKeys = {
    generation: (_p: AnimPath<Walker>, i: number) => i,
    longestFirst: (p: AnimPath<Walker>) => -p.totalLength,
    shortestFirst: (p: AnimPath<Walker>) => p.totalLength,
    leftToRight: (p: AnimPath<Walker>) => p.points[0][0],
    topLeft: (p: AnimPath<Walker>) => p.points[0][0] + p.points[0][1],
    byPattern: (p: AnimPath<Walker>) => p.walker.patternIndex,
    centerOut: radialFrom(0.5, 0.5),
    topLeftOut: radialFrom(0, 0),

    together: () => 0,
}

class Drawing {
    seed!: number
    rng!: Rng
    inner!: { cols: number; rows: number; w: number; h: number }
    outer!: { cols: number; rows: number; w: number; h: number }
    noise!: NoiseFunction2D
    field!: Field
    walkers!: Walker[]
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
        this.noise = createNoise2D(this.rng)

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
    }

    draw(ctx: CanvasRenderingContext2D, sizes: Sizes, strokes: Stroke[]) {
        const lw = C.cell * C.lineWidth
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
        strokes.forEach(({ points, color }, si) => {
            if (points.length < 2) return
            ctx.fillStyle = color
            ctx.globalAlpha = C.alpha
            const ribbons = getWobblyRibbons(points, {
                strokeWidth: lw,
                taper: 1,
                taperLen: lw * 3,
                taperType: 'symmetric',
                // convert line-width-relative config to px
                freq: C.noiseFreq / lw,
                scale: C.noiseScale * lw,
                count: C.count,
                noise: this.noise,
                offsetEach: C.noiseOffsetEach,
                seed: si,
                widthVary: C.widthVary,
                widthFreq: C.widthFreq / lw,
            })
            ribbons.forEach((ribbon) => {
                ctx.beginPath()
                // smoothDrawPath(ctx, points)
                smoothDrawRibbon(ribbon, ctx, C.edgeSmoothTimes, C.edgeSmoothAmt)
                ctx.fill()
            })
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

const animator = new PathAnimator<Walker>({
    onFrame: () => drawing.draw(ctx, sizes, animator.frame()),
    getOptions: () => ({
        mode: C.mode,
        // animator works in px
        speed: C.speed * C.cell,
        overlap: C.overlap,
        orderKey: orderKeys[C.orderBy],
        pathEase: easing[C.pathEase],
        staggerEase: easing[C.staggerEase],
    }),
})
animator.setPaths(buildAnimPaths(drawing.walkers, C))

sizes.on('resize', (width, height) => {
    resizeCanvas(width, height)
    drawing.draw(ctx, sizes, animator.frame())
})

animator.play()

/**
 * GUI
 */
const onTimelineChange = () => animator.applyTimeline()
const regenerate = (seed: number | boolean) => {
    drawing.generate(seed)
    animator.setPaths(buildAnimPaths(drawing.walkers, C))
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
gui.add(C, 'speed', 4, 200, 0.5).onChange(onTimelineChange)
gui.add(C, 'overlap', 0, 1, 0.01).onChange(onTimelineChange)
gui.add(C, 'staggerEase', Object.keys(easing)).onChange(onTimelineChange)
gui.add(C, 'pathEase', Object.keys(easing)).onChange(() => animator.update())

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
f.add(C, 'lineWidth', 0.1, 1.5, 0.01)
f.add(C, 'noiseFreq', 0, 5, 0.01)
f.add(C, 'noiseScale', 0, 2, 0.01)
f.add(C, 'noiseOffsetEach', 0, 5, 0.01)
f.add(C, 'widthVary', 0, 1, 0.01)
f.add(C, 'widthFreq', 0, 5, 0.01)
f.add(C, 'alpha', 0, 1, 0.01)
f.onChange(() => regenerate(false))

makePalettesGui(gui.addFolder('colors'), drawing.palette, palettes, (pal) => {
    drawing.palette = pal
    regenerate(false)
})

// @ts-ignore
window.debg = { drawing, animator, ctx, sizes, C }

import GUI from 'lil-gui'
import { PaletteVariant } from 'mish-bainrow'
import { saveCanvasAtCoords } from '~/helpers/canvas-save-image'
import { clickAndHold } from '~/helpers/click-and-hold'
import createCanvas from '~/helpers/create-canvas'
import { makePalettesGui } from '~/helpers/gui-palettes'
import { makeRandomSeed, makeRng, Rng } from '~/helpers/prng'
import { Sizes } from '~/helpers/sizes'
import { shuffle } from '~/helpers/utils'
import '~/style.css'
import { Field } from '../field'
import { palettes } from '../walker-palettes'
import {
    drawGrid,
    drawPath,
    getFinalPaths,
    initWalkers,
    smoothDrawPath,
    walkAll,
    walkStep,
} from '../walking-utils'
import { Walker3 } from './walker3'

const C = {
    cell: 10,
    grid: 80,
    patterns: 7,
    maxSteps: 200,
    tileMin: 10,
    tileMax: 20,
    cornerSmoothTimes: 2,
    cornerSmoothAmt: 0.25,
    extraCells: 0,
    walkTogether: false,
    wrap: false,
    patternEven: false,
    tesselation: false,

    step: false,
    holdInterval: 80,

    drawGrid: false,
    clip: false,
    debgShapes: false,
    fillSingle: false,

    minContrastBg: 1,
    minColors: 2,
    bgColorType: 'light' as 'light' | 'dark' | 'edge',
    bgEdge: 10,
}

class Drawing {
    seed!: number
    rng!: Rng
    inner!: { cols: number; rows: number; w: number; h: number }
    outer!: { cols: number; rows: number; w: number; h: number }
    field!: Field
    walkers!: Walker3[]
    palette: PaletteVariant

    constructor(palette: PaletteVariant, seed?: number) {
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

        if (!C.step) walkAll(this.walkers, C.walkTogether)
    }

    draw(ctx: CanvasRenderingContext2D, sizes: Sizes) {
        let withPaths = getFinalPaths(this.walkers, {
            cell: C.cell,
            cornerSmoothTimes: C.cornerSmoothTimes,
            cornerSmoothAmt: C.cornerSmoothAmt,
        })
        const lw = C.cell * 0.7
        ctx.fillStyle = this.palette.bg
        ctx.fillRect(0, 0, sizes.width, sizes.height)

        ctx.save()
        ctx.translate((sizes.width - this.inner.w) / 2, (sizes.height - this.inner.h) / 2)

        if (C.drawGrid) drawGrid(ctx, { ...this.inner, cell: C.cell })

        if (C.clip) {
            ctx.beginPath()
            ctx.rect(0, 0, this.inner.w, this.inner.h)
            ctx.clip()
        }

        ctx.translate((this.inner.w - this.outer.w) / 2, (this.inner.h - this.outer.h) / 2)
        ctx.translate(C.cell / 2, C.cell / 2)
        ctx.lineCap = 'round'
        withPaths.forEach(({ walker, paths }) => {
            ctx.strokeStyle = walker.color
            ctx.fillStyle = walker.color

            paths.forEach((path) => {
                if (path.length === 1 && C.fillSingle) {
                    ctx.beginPath()
                    ctx.arc(path[0][0], path[0][1], lw / 2, 0, Math.PI * 2)
                    ctx.fill()
                }
                if (C.debgShapes) {
                    ctx.globalAlpha = 0.5
                    ctx.lineWidth = C.cell * 0.8
                    ctx.beginPath()
                    smoothDrawPath(ctx, path)
                    ctx.stroke()

                    ctx.globalAlpha = 1
                    ctx.lineWidth = C.cell * 0.2
                    ctx.beginPath()
                    drawPath(ctx, path)
                    ctx.stroke()
                } else {
                    ctx.lineWidth = lw
                    ctx.beginPath()
                    smoothDrawPath(ctx, path)
                    ctx.stroke()
                }
            })
        })

        ctx.restore()
    }
}

function doStep() {
    walkStep(drawing.walkers, C.walkTogether)
    drawing.draw(ctx, sizes)
}

/**
 * Setup
 */

// let palette = random(palettes)
let palette = palettes[5]

const sizes = new Sizes()
const { ctx, resizeCanvas, canvas } = createCanvas(sizes.width, sizes.height)

const drawing = new Drawing(palette, 1581781986)
drawing.draw(ctx, sizes)

sizes.on('resize', (width, height) => {
    resizeCanvas(width, height)
    drawing.draw(ctx, sizes)
})

if (C.step) {
    walkStep(drawing.walkers, C.walkTogether)
}

clickAndHold({
    el: canvas,
    fn: () => {
        if (!C.step) return
        doStep()
    },
    interval: 60,
    delay: 200,
})

/**
 * GUI
 */

const gui = new GUI()
gui.add(drawing, 'seed').listen()
gui.add(
    {
        newSeed: () => {
            drawing.generate(true)
            drawing.draw(ctx, sizes)
        },
    },
    'newSeed',
)
const f = gui.addFolder('drawing')
f.add(C, 'grid', 20, 150, 1)
f.add(C, 'patterns', 1, 20, 1)
f.add(C, 'maxSteps', 2, 2000, 1)
f.add(C, 'tileMin', 2, 50, 1)
f.add(C, 'tileMax', 2, 50, 1)
f.add(C, 'walkTogether')
f.add(C, 'wrap')
f.add(C, 'patternEven')
f.add(C, 'tesselation')
// f.add(C, 'drawGrid')
// f.add(C, 'clip')
f.add(C, 'fillSingle')
gui.add(C, 'step').onChange(() => {
    drawing.generate(false)
    if (C.step) {
        walkStep(drawing.walkers, C.walkTogether)
        drawing.draw(ctx, sizes)
    } else {
        drawing.draw(ctx, sizes)
    }
})

gui.add(
    {
        save: () => {
            let name = `walking08-${drawing.seed}-gr${C.grid}-p${C.patterns}-st${C.maxSteps}-${C.tileMin}-${C.tileMax}`
            let flags = ''

            if (C.walkTogether) flags += 't'
            if (C.wrap) flags += 'w'
            if (C.patternEven) flags += 'e'
            if (C.tesselation) flags += 's'
            name += `-${flags}`

            let { inner } = drawing
            let pr = Math.min(window.devicePixelRatio, 2)
            let margin = 20 * pr
            let sx = ((sizes.width - inner.w) / 2) * pr - margin
            let sy = ((sizes.height - inner.h) / 2) * pr - margin
            let sw = inner.w * pr + margin * 2
            let sh = inner.h * pr + margin * 2
            saveCanvasAtCoords(canvas, {
                sx,
                sy,
                sw,
                sh,
                fileName: name,
                type: 'png',
                quality: 0.95,
            })
        },
    },
    'save',
)

const cf = gui.addFolder('colors')
makePalettesGui(cf, drawing.palette, palettes, (pal) => {
    drawing.palette = pal
    drawing.generate(false)
    drawing.draw(ctx, sizes)
})

f.onChange((e) => {
    try {
        ctx.clearRect(0, 0, sizes.width, sizes.height)
        drawing.generate(false)
        drawing.draw(ctx, sizes)
    } catch (e) {
        console.warn(e)
    }
})

// @ts-ignore
window.debg = {
    drawing,
    ctx,
    canvas,
    sizes,
    getFinalPaths,
    C,
    walkStep,
}

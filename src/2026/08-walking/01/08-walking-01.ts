import GUI from 'lil-gui'
import { getPaletteVariants, PaletteVariant } from 'mish-bainrow'
import { saveCanvasAtCoords } from '~/helpers/canvas-save-image'
import { chaikinSmoothTuple } from '~/helpers/chaikin-smooth'
import { clickAndHold } from '~/helpers/click-and-hold'
import createCanvas from '~/helpers/create-canvas'
import { makePalettesGui } from '~/helpers/gui-palettes'
import { makeRandomSeed, makeRng, Rng } from '~/helpers/prng'
import { Sizes } from '~/helpers/sizes'
import { random, shuffle } from '~/helpers/utils'
import '~/style.css'
import { Field } from '../field'
import { drawGrid, drawPath, smoothDrawPath, walkAll, walkStep, XY } from '../walking-utils'
import { Walker1 } from './walker1'
import { createPatterns, createTessPatterns } from '../patterns'

const C = {
    cell: 10,
    grid: 80,
    patterns: 8,
    maxSteps: 100,
    tileMin: 10,
    tileMax: 12,
    cornerSmoothTimes: 2,
    cornerSmoothAmt: 0.25,
    extraCells: 0,
    walkTogether: true,
    wrap: true,
    patternEven: false,
    tesselation: true,
    debgShapes: false,
    drawGrid: false,
    clip: false,
    fillSingle: false,

    step: false,

    minContrastBg: 1,
    minColors: 2,
    bgColorType: 'light' as 'light' | 'dark' | 'edge',
    bgEdge: 10,
}

const getPalettes = () => {
    return getPaletteVariants({
        isolateColors: true,
        minContrastBg: C.minContrastBg,
        minColors: C.minColors,
        includePalettes: [
            'ambry',
            'autmn',
            'bubbles',
            'dust',
            'ember',
            'goldenCloud',
            'market',
            'pearly',
        ],
        bgColor: {
            type: C.bgColorType,
            edge: C.bgEdge,
        },
    })
}

let palettes = getPalettes()

/**
 * Patterns
 */

function initWalkers(field: Field, colors: string[], rng: Rng) {
    let walkers: Walker1[] = []
    const patternParams = {
        rng,
        count: C.patterns,
        tileMin: C.tileMin,
        tileMax: C.tileMax,
        type: C.patternEven ? 'even' : 'mixed',
    } as const
    let patterns = C.tesselation
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
                    walkers.push(
                        new Walker1({
                            field,
                            start: [nx(x), ny(y)],
                            startDir: dir,
                            maxSteps: C.maxSteps,
                            color,
                            wrap: C.wrap,
                        }),
                    )
                }
                y++
            }
            x++
        }
    })

    return walkers
}

function initWalkers2(field: Field, palette: PaletteVariant) {
    const walkers: Walker1[] = []
    let color = palette.colors[0]

    // for (let x = field.cols - 1; x > field.cols / 2; x -= 1) {
    //     walkers.push(
    //         new Walker({
    //             field,
    //             start: [x, field.rows - 1],
    //             startDir: 2,
    //             maxSteps: C.maxSteps,
    //             color,
    //             rng,
    //         }),
    //     )
    // }

    for (let y = field.rows - 1, x = 0; y > field.rows / 2 && x < field.cols; y -= 2) {
        walkers.push(
            new Walker1({
                field,
                start: [x, y],
                startDir: 3,
                maxSteps: C.maxSteps,
                color,
            }),
        )
    }

    return walkers
}

function getFinalPaths(walkers: Walker1[]) {
    return walkers.map((walker) => {
        let paths = walker.segments.map((s) => {
            let scaled: XY[] = s.map(([x, y]) => [x * C.cell, y * C.cell])
            return chaikinSmoothTuple(scaled, C.cornerSmoothTimes, C.cornerSmoothAmt)
        })
        return { walker, paths }
    })
}

class Drawing {
    seed!: number
    rng!: Rng
    inner!: { cols: number; rows: number; w: number; h: number }
    outer!: { cols: number; rows: number; w: number; h: number }
    field!: Field
    walkers!: Walker1[]
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
        this.walkers = initWalkers(this.field, colors, this.rng)

        if (!C.step) walkAll(this.walkers, C.walkTogether)
    }

    draw(ctx: CanvasRenderingContext2D, sizes: Sizes) {
        let withPaths = getFinalPaths(this.walkers)
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
                    ctx.arc(path[0][0], path[0][1], ctx.lineWidth / 2, 0, Math.PI * 2)
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
                    ctx.lineWidth = C.cell * 0.7
                    ctx.beginPath()
                    smoothDrawPath(ctx, path)
                    ctx.stroke()
                }
            })
        })

        ctx.restore()
    }
}

/**
 * Setup
 */

const sizes = new Sizes()
const { ctx, resizeCanvas, canvas } = createCanvas(sizes.width, sizes.height)

const drawing = new Drawing(random(palettes), 460012768)
drawing.draw(ctx, sizes)

sizes.on('resize', (width, height) => {
    resizeCanvas(width, height)
    drawing.draw(ctx, sizes)
})

if (C.step) {
    walkStep(drawing.walkers, C.walkTogether)
}

const doStep = () => {
    walkStep(drawing.walkers, C.walkTogether)
    drawing.draw(ctx, sizes)
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
f.add(C, 'maxSteps', 2, 1000, 1)
f.add(C, 'tileMin', 2, 50, 1)
f.add(C, 'tileMax', 2, 50, 1)
// f.add(C, 'cornerSmoothTimes', 0, 4, 1)
// f.add(C, 'cornerSmoothAmt', 0, 0.5, 0.01)
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
const palGui = makePalettesGui(cf, drawing.palette, palettes, (pal) => {
    drawing.palette = pal
    drawing.generate(false)
    drawing.draw(ctx, sizes)
})

cf.add(C, 'minContrastBg', 0, 4, 0.01).onChange(() => {
    palettes = getPalettes()
    palGui.updateOptions(palettes)
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

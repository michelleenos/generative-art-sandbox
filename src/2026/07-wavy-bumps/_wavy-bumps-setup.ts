import chroma from 'chroma-js'
import { makeRandomSeed, makeRng, Rng } from '~/helpers/prng'
import {
    BumpsLayout,
    BumpsPalette,
    BumpsScene,
    Sizes,
    WavyBumpsColors,
    WavyBumpsConfig,
    WavyBumpsInputs,
    WavyBumpsStrokes,
    WavyBumpsWave,
} from './_wavy-bumps-types'
import { createNoise2D } from 'simplex-noise'
import { randomInt } from '~/helpers/utils'

function decideColors(
    rng: Rng,
    config: WavyBumpsColors,
    colorShift: WavyBumpsInputs['colorShift'],
) {
    // always re-roll regardless of whether a custom type is chosen (keeps seed state is as consistent as possible)
    const rolled = randomInt(1, 3, rng)
    const colorDiff = colorShift === 'random' ? rolled : colorShift

    if (colorDiff === 1) {
        config.hue = rng(180, 320)
        config.addHue = 80
    } else if (colorDiff === 2) {
        config.hue = rng(170, 310)
        config.addHue = 130
    } else {
        config.hue = rng(140, 270)
        config.addHue = 200
    }
    config.lessSaturated = rng() < 0.3
}

function decideBumps(rng: Rng, config: WavyBumpsWave, tendency: WavyBumpsInputs['bumpsTendency']) {
    const rolled = rng()
    const flat = tendency === 'random' ? rolled < 0.25 : tendency === 'flat'

    const spacingRoll = rng()
    const spaceClose = flat ? spacingRoll < 0.6 : spacingRoll < 0.3
    console.log({ flat, spaceClose })
    config.spacing = spaceClose ? randomInt(30, 100, rng) : randomInt(50, 250, rng)

    if (flat) {
        config.highMax = randomInt(85, 110, rng)
        config.highMin = config.highMax - randomInt(5, 10, rng)
        config.lowMax = randomInt(50, 70, rng)
        config.lowMin = config.lowMax - randomInt(10, 25, rng)
        config.peakMin = 1
        config.peakMax = randomInt(2, 4, rng)
    } else {
        config.highMax = randomInt(90, 300, rng)
        config.highMin = randomInt(80, config.highMax, rng)
        config.lowMin = randomInt(10, Math.floor(config.highMin * 0.7), rng)
        config.lowMax = randomInt(config.lowMin, Math.floor(config.highMin * 0.9), rng)
        config.peakMin = randomInt(1, 4, rng)
        config.peakMax = randomInt(config.peakMin + 1, 10, rng)
    }
    config.peakWidth = config.highMax > 200 ? randomInt(180, 300, rng) : randomInt(100, 300, rng)
    config.chaikinTimes = randomInt(2, 3, rng)
}

function decideField(rng: Rng, config: WavyBumpsStrokes, fieldType: WavyBumpsInputs['fieldType']) {
    // always re-roll regardless of whether a custom type is chosen (keeps seed state is as consistent as possible)
    const rolled = rng(['scribbly', 'pointillism', 'tight'] as const)
    const type = fieldType === 'random' ? rolled : fieldType

    if (type === 'scribbly') {
        config.moveAmtTop.x = randomInt(30, 70, rng)
        config.moveAmtTop.y = randomInt(30, 40, rng)
        config.moveAmtBot.x = config.moveAmtTop.x
        config.moveAmtBot.y = config.moveAmtTop.y
        config.stepLen = randomInt(10, 15, rng)
        config.steps = randomInt(15, 20, rng)
        config.strokeWidth = randomInt(10, 16, rng)
        config.taperLen = config.stepLen * config.steps * 0.2
        config.density.x = randomInt(1, 2, rng)
        config.flattenAngle = 0
        config.blendAngleAmt = 1

        const coverageY = rng(0.5, 1)
        const strokeLen = config.steps * config.stepLen * 2
        config.density.y = (coverageY * 100) / config.strokeWidth
        config.density.x = rng(8, 15) / strokeLen ** 0.3
        config.taper = 0.4
        config.taperType = 'symmetric'
    } else if (type === 'pointillism') {
        config.steps = 3
        config.stepLen = randomInt(2, 4, rng)
        const wiggliness = rng()
        if (wiggliness < 0.25) {
            config.moveAmtTop.x = 100
            config.moveAmtTop.y = 100
            config.moveAmtBot.x = 100
            config.moveAmtBot.y = 100
        } else if (wiggliness < 0.6) {
            config.moveAmtTop.x = 20
            config.moveAmtTop.y = 20
            config.moveAmtBot.x = 30
            config.moveAmtBot.y = 30
        } else {
            config.moveAmtTop.x = 50
            config.moveAmtTop.y = 40
            config.moveAmtBot.x = randomInt(20, 60, rng)
            config.moveAmtBot.y = randomInt(20, 60, rng)
        }
        config.flattenAngle = 0
        config.blendAngleAmt = 0
        config.taper = 0.7
        config.taperLen = config.stepLen
        config.taperType = 'symmetric'

        const coverageY = 2
        const strokeLen = config.steps * config.stepLen * 2

        config.strokeWidth = strokeLen + randomInt(-2, 2, rng)
        const gapX = strokeLen * 0.3
        config.density.x = 100 / gapX
        config.density.y = (coverageY * 100) / config.strokeWidth
    } else if (type === 'tight') {
        config.stepLen = 10
        config.steps = randomInt(2, 5, rng)

        config.moveAmtTop.x = rng(config.steps, config.steps + 5)
        config.moveAmtTop.y = rng(config.steps, config.steps + 5)
        config.moveAmtBot.x = rng(15, 35)
        config.moveAmtBot.y = rng(6, 15)
        config.flattenAngle = rng(0, 0.5)
        config.blendAngleAmt = 1
        config.strokeWidth = randomInt(10, 20, rng)
        config.taperLen = config.stepLen * 2.5
        config.taper = 0.4
        config.taperType = 'end'

        const strokeLen = config.steps * config.stepLen * 2
        const coverageY = 1.5
        config.density.y = (coverageY * 100) / config.strokeWidth
        const gapX = strokeLen * 0.25
        config.density.x = 100 / gapX
    }
}

export function makePalette(rng: Rng, count: number, config: WavyBumpsColors): BumpsPalette {
    const { hue, addHue, lessSaturated } = config

    const l1 = 0.35
    const l2 = 0.85
    const chromaVal = 0.08

    const colorAt = (amt: number) => {
        return chroma.oklch(l1 + (l2 - l1) * amt, chromaVal, hue + addHue * amt)
    }

    let mixAmt = 0
    function nextColor() {
        const c = colorAt(mixAmt).set(
            'oklch.c',
            lessSaturated ? `*${rng(0.7, 1.5)}` : `*${rng(1.2, 2)}`,
        )
        mixAmt = (mixAmt + rng(0.55, 0.75)) % 1
        return c
    }
    const bgColor = nextColor()
    const rowColors = Array.from({ length: count }, () => nextColor())

    return {
        bgColor,
        rowColors,
    }
}

export function makeLayout(sizes: Sizes, C: WavyBumpsConfig): BumpsLayout {
    const { width, height } = sizes
    const { peakWidth, spacing, highMax } = C.waves
    const { density } = C.strokes
    const { overlap } = C.waves
    const fieldStepY = 100 / density.y

    const overlapY = overlap ? Math.ceil(spacing * 2) : 0

    const rowsBelow = Math.floor(highMax / spacing)
    const rowsAbove = Math.floor((height + overlapY) / spacing)
    return {
        rowCount: rowsBelow + rowsAbove + 1,
        rowsBelow,
        sizes,
        bounds: {
            xStart: -peakWidth,
            xEnd: width + peakWidth,
            peakXStart: Math.trunc(-peakWidth * 0.5),
            peakXEnd: Math.trunc(width + peakWidth * 0.5),
        },
        // overlapY: overlap ? Math.ceil(spacing + (spacing - lowMin)) : 0,
        // overlapY: overlap ? Math.ceil(spacing * 2) : 0,
        overlapY,
        fieldStepX: 100 / density.x,
        fieldStepY,
    }
}

export function makeScene(config: WavyBumpsConfig, sizes: Sizes, seed: number): BumpsScene {
    console.log('SEED: ', seed)
    const rng = makeRng(seed)
    const noise = createNoise2D(rng)
    const { inputs, custom } = config

    // fixed order, always drawn: skipping a section must not shift the rest
    const branch = () => makeRng(makeRandomSeed(rng))
    const bumpsRng = branch()
    const fieldRng = branch()
    const colorsRng = branch()
    const paletteRng = branch()

    if (!custom.waves) decideBumps(bumpsRng, config.waves, inputs.bumpsTendency)
    if (!custom.strokes) decideField(fieldRng, config.strokes, inputs.fieldType)
    if (!custom.colors) decideColors(colorsRng, config.colors, inputs.colorShift)

    const layout = makeLayout(sizes, config)
    const palette = makePalette(paletteRng, layout.rowCount, config.colors)

    return { config, rng, noise, layout, palette }
}

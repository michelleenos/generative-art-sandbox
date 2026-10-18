// https://github.com/AndrewRayCode/easing-utils/blob/master/src/easing.js
// https://github.com/Michaelangel007/easing#tldr-shut-up-and-show-me-the-code
// easings.net

export const easing = {
    inSine: (x: number) => 1 - Math.cos((x * Math.PI) / 2),
    outSine: (x: number) => Math.sin((x * Math.PI) / 2),
    inOutSine: (x: number) => -0.5 * (Math.cos(Math.PI * x) - 1),
    inQuad: (x: number) => x * x,
    outQuad: (x: number) => 1 - (1 - x) * (1 - x),
    inOutQuad: (x: number) => (x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x),
    inCubic: (x: number) => x * x * x,
    outCubic: (x: number) => 1 - Math.pow(1 - x, 3),
    inOutCubic: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    inQuart: (x: number) => x * x * x * x,
    outQuart: (x: number) => 1 - Math.pow(1 - x, 4),
    inOutQuart: (x: number) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
    inQuint: (x: number) => x * x * x * x * x,
    outQuint: (x: number) => 1 - Math.pow(1 - x, 5),
    inOutQuint: (x: number) => (x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2),
    inExpo: (x: number) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10)),
    outExpo: (x: number) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inCirc: (x: number) => 1 - Math.sqrt(1 - x * x),
    outCirc: (x: number) => Math.sqrt(1 - Math.pow(x - 1, 2)),
    inOutCirc: (x: number) =>
        x < 0.5
            ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
            : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2,
    outSquareRoot: (x: number) => Math.sqrt(x),
    inSquareRoot: (x: number) => 1 - Math.sqrt(1 - x),
    inOutExpo: (x: number) => {
        return x === 0
            ? 0
            : x === 1
              ? 1
              : x < 0.5
                ? Math.pow(2, 20 * x - 10) / 2
                : (2 - Math.pow(2, -20 * x + 10)) / 2
    },
    linear: (x: number) => x,
    inBack: (x: number, mag = 1.70158) => {
        return x * x * ((mag + 1) * x - mag)
    },
    outBack: (x: number, mag = 1.70158) => {
        const s = x / 1 - 1
        return s * s * ((mag + 1) * s + mag) + 1
    },
    inOutBack(x: number, mag = 1.70158) {
        const scaledTime = x * 2
        const scaledTime2 = scaledTime - 2
        const s = mag * 1.525

        if (scaledTime < 1) {
            return 0.5 * scaledTime * scaledTime * ((s + 1) * scaledTime - s)
        }

        return 0.5 * (scaledTime2 * scaledTime2 * ((s + 1) * scaledTime2 + s) + 2)
    },
    inElastic: (x: number, mag = 0.7) => {
        if (x === 0 || x === 1) {
            return x
        }

        const scaledTime = x / 1
        const scaledTime1 = scaledTime - 1

        const p = 1 - mag
        const s = (p / (2 * Math.PI)) * Math.asin(1)

        return -(Math.pow(2, 10 * scaledTime1) * Math.sin(((scaledTime1 - s) * (2 * Math.PI)) / p))
    },
    outElastic: (x: number, mag = 0.7) => {
        if (x === 0 || x === 1) {
            return x
        }

        const p = 1 - mag
        const scaledTime = x * 2

        const s = (p / (2 * Math.PI)) * Math.asin(1)
        return Math.pow(2, -10 * scaledTime) * Math.sin(((scaledTime - s) * (2 * Math.PI)) / p) + 1
    },

    inOutElastic: (x: number, mag = 0.65) => {
        if (x === 0 || x === 1) {
            return x
        }

        const p = 1 - mag
        const scaledTime = x * 2
        const scaledTime1 = scaledTime - 1

        const s = (p / (2 * Math.PI)) * Math.asin(1)

        if (scaledTime < 1) {
            return (
                -0.5 *
                (Math.pow(2, 10 * scaledTime1) * Math.sin(((scaledTime1 - s) * (2 * Math.PI)) / p))
            )
        }

        return (
            Math.pow(2, -10 * scaledTime1) *
                Math.sin(((scaledTime1 - s) * (2 * Math.PI)) / p) *
                0.5 +
            1
        )
    },
}

export const easingsNested = {
    sine: {
        in: easing.inSine,
        out: easing.outSine,
        inOut: easing.inOutSine,
    },
    quad: {
        in: easing.inQuad,
        out: easing.outQuad,
        inOut: easing.inOutQuad,
    },
    cubic: {
        in: easing.inCubic,
        out: easing.outCubic,
        inOut: easing.inOutCubic,
    },
    quart: {
        in: easing.inQuart,
        out: easing.outQuart,
        inOut: easing.inOutQuart,
    },
    quint: {
        in: easing.inQuint,
        out: easing.outQuint,
        inOut: easing.inOutQuint,
    },
    expo: {
        in: easing.inExpo,
        out: easing.outExpo,
        inOut: easing.inOutExpo,
    },
    circ: {
        in: easing.inCirc,
        out: easing.outCirc,
        inOut: easing.inOutCirc,
    },
}

export type Easing = keyof typeof easing

export default easing

function smoothOnce(inPts: { x: number; y: number }[], amt = 0.25) {
    const len = inPts.length
    if (len === 0) return []

    let out: { x: number; y: number }[] = []

    out.push({ ...inPts[0] })

    for (let i = 0; i < len - 1; i++) {
        const a = inPts[i]
        const b = inPts[i + 1]
        out.push(
            {
                x: a.x * (1 - amt) + b.x * amt,
                y: a.y * (1 - amt) + b.y * amt,
            },
            {
                x: a.x * amt + b.x * (1 - amt),
                y: a.y * amt + b.y * (1 - amt),
            },
        )
    }

    if (len > 1) out.push({ ...inPts[len - 1] })

    return out
}

/**
 * Same as `smoothOnce()` but takes points in the form `[number, number]` instead of `{ x: number; y: number }`
 */
function smoothOnceTuple(inPts: [number, number][], amt = 0.25) {
    const len = inPts.length
    if (len === 0) return []
    let out: [number, number][] = []
    let top = 1 - amt
    let bot = amt

    out.push([...inPts[0]])
    for (let i = 0; i < len - 1; i++) {
        const a = inPts[i]
        const b = inPts[i + 1]
        out.push(
            [a[0] * top + b[0] * bot, a[1] * top + b[1] * bot],
            [a[0] * bot + b[0] * top, a[1] * bot + b[1] * top],
        )
    }

    if (len > 1) out.push([...inPts[len - 1]])
    return out
}

/**
 * Applies Chaikin's corner cutting algorithm to smooth a path of points. The more times you apply it, the smoother the path becomes. Each application of the algorithm doubles the number of points in the output array.
 * @param inPts
 * @param times - number of times to apply the smoothing algorithm. Increases the number of points in the output array by a factor of 2^times
 * @param amt - amount of smoothing to apply. 0.25 is the default and is the standard Chaikin's algorithm. 0.5 is more aggressive, while 0.1 is more subtle.
 */
export function chaikinSmooth(pts: { x: number; y: number }[], times: number, amt = 0.25) {
    let out: { x: number; y: number }[] = pts

    for (let t = 0; t < times; t++) {
        out = smoothOnce(out, amt)
    }

    return out
}

/**
 * Applies Chaikin's corner cutting algorithm to smooth a path of points.
 * The more times you apply it, the smoother the path becomes.
 * Each application of the algorithm doubles the number of points in the output array.
 *
 * This fn is the same as `chaikinSmooth()` except takes points in the form `[number, number] `
 * instead of `{ x: number; y: number }`
 * @param pts
 * @param times - number of times to apply the smoothing algorithm. Increases the number of points in the output array by a factor of 2^times
 * @param amt - amount of smoothing to apply. 0.25 is the default and is the standard Chaikin's algorithm. 0.5 is more aggressive, while 0.1 is more subtle.
 */
export function chaikinSmoothTuple(pts: [number, number][], times: number, amt = 0.25) {
    let out: [number, number][] = pts
    for (let t = 0; t < times; t++) {
        out = smoothOnceTuple(out, amt)
    }

    return out
}

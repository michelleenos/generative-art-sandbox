// type XY = [number, number]
// type Vec2Like = { x: number; y: number }

// function isVec2Like(obj: unknown): obj is Vec2Like {
// 	if (typeof obj !== 'object' || obj === null) return false
// 	let o = obj as Vec2Like
// 	if (typeof o['x'] !== 'number') return false
// 	if (typeof o['y'] !== 'number') return false
// 	return true
// }

// function isXY(item: unknown): item is XY {
// 	if (!Array.isArray(item)) return false
// 	if (item.length !== 2) return false
// 	if (typeof item[0] !== 'number' || typeof item[1] !== 'number') return false
// 	return true
// }

function smoothOnce(inPts: { x: number; y: number }[]) {
    const len = inPts.length
    if (len === 0) return []

    let out: { x: number; y: number }[] = []

    out.push({ ...inPts[0] })

    for (let i = 0; i < len - 1; i++) {
        const a = inPts[i]
        const b = inPts[i + 1]
        out.push(
            {
                x: a.x * 0.75 + b.x * 0.25,
                y: a.y * 0.75 + b.y * 0.25,
            },
            {
                x: a.x * 0.25 + b.x * 0.75,
                y: a.y * 0.25 + b.y * 0.75,
            },
        )
    }

    if (len > 1) out.push({ ...inPts[len - 1] })

    return out
}

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

export function chaikinSmooth(pts: { x: number; y: number }[], times: number) {
    let out: { x: number; y: number }[] = pts

    for (let t = 0; t < times; t++) {
        out = smoothOnce(out)
    }

    return out
}

export function chaikinSmoothTuple(pts: [number, number][], times: number, amt = 0.25) {
    let out: [number, number][] = pts
    for (let t = 0; t < times; t++) {
        out = smoothOnceTuple(out, amt)
    }

    return out
}

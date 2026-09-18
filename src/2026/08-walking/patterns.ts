import { makeRandomSeed, makeRng, Rng } from '~/helpers/prng'
import { SquareDir, squareDirKeys } from './walk-directions'
import { randomInt } from '~/helpers/utils'

type Pattern = {
    nx: (x: number) => number
    ny: (y: number) => number
    dir: SquareDir
}

type PatternParams = {
    count: number
    tileMin: number
    tileMax: number
    type: 'even' | 'mixed'
    rng: Rng
}

export function createPatterns({ count, tileMin, tileMax, type, rng: _rng }: PatternParams) {
    const rng = makeRng(makeRandomSeed(_rng))
    const getMult = () => randomInt(tileMin, tileMax, rng)

    let mults = type === 'even' ? [getMult(), getMult()] : [0, 0]
    let patterns: Pattern[] = []

    for (let i = 0; i < count; i++) {
        let mx = type === 'even' ? mults[0] : getMult()
        let my = type === 'even' ? mults[1] : getMult()
        let ax = randomInt(-mx + 1, mx - 1, rng)
        let ay = randomInt(-my + 1, my - 1, rng)
        patterns.push({
            nx: (x) => mx * x + ax,
            ny: (y) => my * y + ay,
            dir: rng(squareDirKeys),
        })
    }

    return patterns
}

const factors = (num: number) => {
    if (num <= 2) return []
    let n = 2
    let result: number[] = []

    while (n <= num / n) {
        if (num % n === 0) {
            result.push(n)
            if (n !== num / n) result.push(num / n)
        }
        n++
    }

    return result.sort((a, b) => a - b)
}

type TessPatternParams = PatternParams & {
    cols: number
    rows: number
}
export function createTessPatterns({
    count,
    cols,
    tileMin,
    tileMax,
    rows,
    type,
    rng: _rng,
}: TessPatternParams) {
    const rng = makeRng(makeRandomSeed(_rng))
    let colsFactors = factors(cols)
    let rowsFactors = factors(rows)
    if (colsFactors.length === 0 || rowsFactors.length === 0) {
        throw new Error(`no factors for cols ${cols} and rows ${rows}`)
    }

    colsFactors = colsFactors.filter((f) => f >= tileMin && f <= tileMax)
    rowsFactors = rowsFactors.filter((f) => f >= tileMin && f <= tileMax)
    if (colsFactors.length === 0 || rowsFactors.length === 0) {
        throw new Error(`no factors within min/max for ${cols} cols and ${rows} rows`)
    }

    let mults = type === 'even' ? [rng(rowsFactors), rng(colsFactors)] : [0, 0]
    let patterns: Pattern[] = []

    for (let i = 0; i < count; i++) {
        let mx = type === 'even' ? mults[0] : rng(rowsFactors)
        let my = type === 'even' ? mults[1] : rng(colsFactors)
        let ax = randomInt(-mx + 1, mx - 1, rng)
        let ay = randomInt(-my + 1, my - 1, rng)
        patterns.push({
            nx: (x) => mx * x + ax,
            ny: (y) => my * y + ay,
            dir: rng(squareDirKeys),
        })
    }

    return patterns
}

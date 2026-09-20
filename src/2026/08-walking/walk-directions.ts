import { XY } from './walking-utils'

export type SquareDir = 0 | 1 | 2 | 3

export const squareDirKeys = [0, 1, 2, 3] as const

export const squareDirs: Record<SquareDir, XY> = {
    0: [0, 1],
    1: [1, 0],
    2: [0, -1],
    3: [-1, 0],
}

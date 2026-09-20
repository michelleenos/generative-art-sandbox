import type { XY } from './walking-utils'
import { Field } from './field'
import { SquareDir, squareDirs } from './walk-directions'
import type { initWalkers } from './walking-utils'

type WalkerStep = {
    xy: XY
    newSegment: boolean
}

export interface WalkerParams {
    field: Field
    start: XY
    maxSteps: number
    color: string
    startDir: SquareDir
    wrap?: boolean
}

export class Walker {
    segments: XY[][]
    dir: SquareDir
    field: Field
    done = false
    maxSteps: number
    wrap: boolean
    color: string
    /** a meta field only used for animation atm. set by {@link initWalkers} */
    patternIndex = -1

    constructor({ field, start, startDir, maxSteps, color, wrap = true }: WalkerParams) {
        this.field = field
        this.dir = startDir
        this.maxSteps = maxSteps
        this.color = color
        this.segments = [[start]]
        this.wrap = wrap
        this.field.add(this, ...start)
    }

    get segment() {
        return this.segments[this.segments.length - 1]
    }

    /** Returns the current position (the last added point) */
    get cur() {
        let s = this.segments[this.segments.length - 1]
        return s[s.length - 1]
    }

    /**
     * Returns the total number of steps taken
     * Actually counts the number of edges / point-to-point steps to be drawn across all segments -
     * not the number of points in the segments (which is higher)
     */
    get curSteps() {
        return this.segments.reduce((acc, s) => acc + Math.max(0, s.length - 1), 0)
        // if (this.segments.length === 1) return this.segments[0].length
        // let count = 0
        // let segmentsCount = this.segments.length
        // this.segments.forEach((segment, i) => {
        //     count += i === 0 || i === segmentsCount - 1 ? segment.length - 1 : segment.length - 2
        // })
        // return count
    }

    add(step: WalkerStep) {
        if (step.newSegment) {
            this.segments.push([step.xy])
        } else {
            this.segment.push(step.xy)
        }
        this.field.add(this, ...step.xy)
    }

    /** Determine the direction of the step
     * (generally should be just the current direction, but for example Walker2
     * alternates between the current direction and the next direction)
     */
    stepDir() {
        return this.dir
    }

    /** Called before each step */
    beforeStep(): void {}

    /** Called after each step (after a new point is added) */
    afterStep(): void {}

    getNext(): WalkerStep {
        const dir = this.stepDir()
        const [dirX, dirY] = squareDirs[dir]
        let x = this.cur[0] + dirX
        let y = this.cur[1] + dirY

        let wrapped = false
        if (this.wrap && (x >= this.field.cols || x < 0 || y >= this.field.rows || y < 0)) {
            x = x >= this.field.cols ? 0 : x < 0 ? this.field.cols - 1 : x
            y = y >= this.field.rows ? 0 : y < 0 ? this.field.rows - 1 : y
            wrapped = true
        }

        return { xy: [x, y], newSegment: wrapped }
    }

    /**
     * Used when the next cell in current direction is invalid.
     * Can be overridden to implement different rotation strategies.
     * Default behavior is to rotate clockwise.
     * */
    rotate() {
        this.dir = ((this.dir + 1) % 4) as SquareDir
    }

    /**
     * Take one step according to the walker's rules.
     * Don't override this! To change the behavior, override
     * `beforeStep`, `afterStep`, `stepDir`, and/or `rotate`
     * (potentially in combo with an added state property)
     */
    walk() {
        if (this.done) return
        this.beforeStep()
        let next = this.getNext()
        let valid = this.field.valid(...next.xy)
        let rotates = 0
        while (!valid && rotates < 3) {
            this.rotate()
            next = this.getNext()
            valid = this.field.valid(...next.xy)
            rotates++
        }

        if (!valid) {
            this.done = true
            return
        }

        this.add(next)
        this.afterStep()

        if (this.curSteps >= this.maxSteps) this.done = true
    }
}

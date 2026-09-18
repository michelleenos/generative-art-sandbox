import { Field } from '../field'
import { SquareDir, squareDirs } from '../walk-directions'
import { Walker, XY } from '../walking-utils'

type WalkerParams = {
    field: Field
    start: XY
    maxSteps: number
    color: string
    startDir: SquareDir
    wrap?: boolean
}

type WalkerStep = {
    xy: XY
    newSegment: boolean
}

export class Walker3 implements Walker {
    segments: XY[][]
    dir: SquareDir
    field: Field
    done = false
    maxSteps: number
    wrap: boolean
    color: string
    state: { curCount: number; nextTurn: 'left' | 'right'; nextLen: number }

    constructor({ field, start, startDir, maxSteps, color, wrap = true }: WalkerParams) {
        this.field = field
        this.dir = startDir
        this.maxSteps = maxSteps
        this.color = color
        this.segments = [[start]]
        this.wrap = wrap
        this.field.add(this, ...start)

        this.state = { curCount: 0, nextTurn: 'left', nextLen: 6 }
    }

    get segment() {
        return this.segments[this.segments.length - 1]
    }

    get cur() {
        let s = this.segments[this.segments.length - 1]
        if (s.length === 0) {
            s = this.segments[this.segments.length - 2]
        }
        return s[s.length - 1]
    }

    get curSteps() {
        if (this.segments.length === 1) return this.segments[0].length
        let count = 0
        let segmentsCount = this.segments.length
        this.segments.forEach((segment, i) => {
            count += i === 0 || i === segmentsCount - 1 ? segment.length - 1 : segment.length - 2
        })
        return count
        // return this.segments.reduce((acc, cur) => acc + Math.max(0, cur.length - 1), 0)
    }

    getNext(): WalkerStep {
        const dir = this.dir
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

    add(step: WalkerStep) {
        if (step.newSegment) {
            // let cur = this.cur
            // let dir = squareDirections[this.dir]
            // this.segment.push([cur[0] + dir[0], cur[1] + dir[1]])
            // this.segments.push([[step.xy[0] - dir[0], step.xy[1] - dir[1]], step.xy])
            this.segments.push([step.xy])
        } else {
            this.segment.push(step.xy)
        }
        this.field.add(this, ...step.xy)
    }

    walk() {
        if (this.done) return
        if (this.state.curCount >= this.state.nextLen) {
            if (this.state.nextTurn === 'left') {
                this.dir = ((this.dir + 1) % 4) as SquareDir
                // this.state.nextTurn = 'right'
            } else {
                this.dir = this.dir === 0 ? 3 : ((this.dir - 1) as SquareDir)
                // this.state.nextTurn = 'left'
            }
            this.state.nextLen = this.state.nextLen === 6 ? 4 : 6
            this.state.curCount = 0
        }
        let next = this.getNext()
        let valid = this.field.valid(...next.xy)
        let rotates = 0
        while (!valid && rotates < 3) {
            this.dir = this.dir === 0 ? 3 : ((this.dir - 1) as SquareDir)
            next = this.getNext()
            valid = this.field.valid(...next.xy)
            this.state.curCount = 0
            rotates++
        }

        if (!valid) {
            this.done = true
            return
        }

        this.add(next)
        this.state.curCount++
        // if (next.newSegment) this.walk()

        if (this.curSteps >= this.maxSteps) {
            this.done = true
        }
    }
}

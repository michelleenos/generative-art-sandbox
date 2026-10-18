import { SquareDir } from '../walk-directions'
import { Walker } from './walker-base'
// import { WalkerParams } from '../walking-utils'
import { WalkerParams } from './walker-base'

export type Walker3Params = {
    /** @default 6 */
    len1?: number
    /** @default 4 */
    len2?: number
}
export class Walker3 extends Walker {
    len1: number
    len2: number
    state: { curCount: number; nextTurn: 'left' | 'right'; nextLen: number }

    constructor(params: WalkerParams, { len1 = 6, len2 = 4 }: Walker3Params = {}) {
        super(params)
        this.len1 = len1
        this.len2 = len2
        this.state = { curCount: 0, nextTurn: 'left', nextLen: this.len1 }
    }

    beforeStep() {
        if (this.state.curCount >= this.state.nextLen) {
            if (this.state.nextTurn === 'left') {
                this.dir = ((this.dir + 1) % 4) as SquareDir
            } else {
                this.dir = this.dir === 0 ? 3 : ((this.dir - 1) as SquareDir)
            }
            this.state.nextLen = this.state.nextLen === this.len1 ? this.len2 : this.len1
            this.state.curCount = 0
        }
    }

    rotate() {
        if (this.state.nextTurn === 'left') {
            this.dir = this.dir === 0 ? 3 : ((this.dir - 1) as SquareDir)
        } else {
            this.dir = ((this.dir + 1) % 4) as SquareDir
        }
    }

    afterStep() {
        this.state.curCount++
    }
}

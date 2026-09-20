import { SquareDir } from '../walk-directions'
import { Walker } from '../walker'
import { WalkerParams } from '../walking-utils'

export class Walker3 extends Walker {
    len1 = 6
    len2 = 4
    state: { curCount: number; nextTurn: 'left' | 'right'; nextLen: number }

    constructor(params: WalkerParams) {
        super(params)
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

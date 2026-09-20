import { SquareDir } from '../walk-directions'
import { Walker } from '../walker'
import { WalkerParams } from '../walking-utils'

export class Walker2 extends Walker {
    state: { dirStep: 1 | 2 }

    constructor(params: WalkerParams) {
        super(params)
        this.state = { dirStep: 1 }
    }

    stepDir() {
        return this.state.dirStep === 1 ? this.dir : (((this.dir + 1) % 4) as SquareDir)
    }

    afterStep() {
        this.state.dirStep = this.state.dirStep === 1 ? 2 : 1
    }

    rotate() {
        this.dir = this.dir === 0 ? 3 : ((this.dir - 1) as SquareDir)
    }
}

import { SquareDir } from '../walk-directions'
import { Walker } from '../walker'
import { WalkerParams } from '../walking-utils'

type Walker2Params = WalkerParams & {
    /**
     * how often to oscillate directions. defaults to 2 (every other step).
     */
    interval?: number
    /**
     * affects angle of the diagonals - only apparent if `interval > 2`
     */
    tilt?: 1 | 2
}
export class Walker2 extends Walker {
    state: { dirStep: 1 | 2 }
    interval: number
    tilt: number

    constructor({ interval = 2, tilt = 1, ...params }: Walker2Params) {
        super(params)
        this.interval = interval
        this.tilt = tilt
        this.state = { dirStep: 1 }
    }

    stepDir() {
        const diagonal = ((this.dir + 1) % 4) as SquareDir
        return this.curSteps % this.interval === 0
            ? this.tilt === 1
                ? this.dir
                : diagonal
            : this.tilt === 1
              ? diagonal
              : this.dir
        // if (this.tilt === 1) {
        //     return this.curSteps % this.interval === 0
        //         ? this.dir
        //         : (((this.dir + 1) % 4) as SquareDir)
        // } else {
        //     return this.curSteps % this.interval === 0
        //         ? (((this.dir + 1) % 4) as SquareDir)
        //         : this.dir
        // }
    }

    afterStep() {
        this.state.dirStep = this.state.dirStep === 1 ? 2 : 1
    }

    rotate() {
        this.dir = this.dir === 0 ? 3 : ((this.dir - 1) as SquareDir)
    }
}

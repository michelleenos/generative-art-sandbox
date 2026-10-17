import { makeRng, Rng } from '~/helpers/prng'
import { SquareDir } from '../walk-directions'
import { Walker } from './walker-base'
// import { WalkerParams } from '../walking-utils'
import { WalkerParams } from './walker-base'

type Walker4Params = {
    seed: number | (() => number)
}

export class Walker4 extends Walker {
    rng: Rng
    state: { turnChance: number; isTurning: boolean; turn: 'c' | 'cc' } = {
        turnChance: 0.1,
        isTurning: false,
        turn: 'cc',
    }

    constructor(params: WalkerParams, { seed }: Walker4Params) {
        super(params)
        this.rng = typeof seed === 'number' ? makeRng(seed) : makeRng(seed())
    }

    currentTurn() {
        this.state.turn === 'cc' ? this.counterClockwise() : this.clockwise()
    }

    resetTurn(resetDirection = true) {
        this.state.isTurning = false
        this.state.turnChance = 0.01
        if (resetDirection) {
            this.state.turn = this.state.turn === 'cc' ? 'c' : 'cc'
        }
    }

    beforeStep() {
        if (this.state.isTurning) {
            this.currentTurn()
            this.resetTurn()
        } else if (this.rng() < this.state.turnChance) {
            // this.dir = this.rng([0, 1, 2, 3].filter((d) => d !== this.dir)) as SquareDir
            this.currentTurn()
            this.state.isTurning = true
        }
    }

    rotate() {
        this.currentTurn()
        if (this.state.isTurning) {
            // cool, we've turned
            this.resetTurn()
        } else if (this.rotations === 0) {
            // if this is the first rotation, we're basically just starting a turn as normal
            this.state.isTurning = true
        } else if (this.rotations > 0) {
            // otherwise, not a normal turn, reset but without changing next direction
            this.resetTurn(false)
        }
    }
    afterStep() {
        this.state.turnChance = Math.min(1, this.state.turnChance + 0.01)
    }
}

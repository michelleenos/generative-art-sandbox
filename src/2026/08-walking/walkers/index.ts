import { Field } from '../field'
import { initWalkers, InitWalkersOptions } from '../walking-utils'
import { Walker, WalkerParams } from './walker-base'
import { Walker2 } from './walker2'
import { Walker3 } from './walker3'
import { Walker4 } from './walker4'

const walkers = {
    1: Walker,
    2: Walker2,
    3: Walker3,
    4: Walker4,
}

export default walkers

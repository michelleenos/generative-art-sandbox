import createCanvas from '~/helpers/create-canvas'
import '~/style.css'
import { buildWavyBumpsGui } from './_wavy-bumps-gui'
import { wavyBumpsDrawing } from './_wavy-bumps-drawing'
import { C } from './config'
import { FixedFpsLoop } from '~/helpers/loop'
import { GuiExtra } from '~/helpers/gui/lilgui-extra'
import { saveCanvasImage } from '~/helpers/canvas-save-image'

const sizes = { width: 900, height: 900 }
const { ctx, canvas } = createCanvas(sizes.width, sizes.height)

C.animation.animated = false
const { regenerate, draw, animate, getSeed } = wavyBumpsDrawing(C, ctx, sizes)
const debg = {
    seed: getSeed(),
    restart: () => {
        regenerate(debg.seed)
        if (!C.animation.animated) draw()
    },
    newSeed: () => {
        regenerate(true)
        debg.seed = getSeed()
        seedCtrl.updateDisplay()
        if (!C.animation.animated) draw()
    },
    save: () => saveCanvasImage(canvas, `wavybumps-${debg.seed}`),
}

const gui = new GuiExtra()
buildWavyBumpsGui(gui, C)
const seedCtrl = gui.add(debg, 'seed')
gui.add(debg, 'restart')
gui.add(debg, 'newSeed')
gui.add(debg, 'save')
gui.onChange(() => debg.restart())

const loop = new FixedFpsLoop(animate, { paused: true })
draw()

gui.add(C.animation, 'animated').onChange((animated: boolean) => {
    if (animated) {
        regenerate()
        loop.start()
    } else {
        loop.stop()
        regenerate()
        draw()
    }
})

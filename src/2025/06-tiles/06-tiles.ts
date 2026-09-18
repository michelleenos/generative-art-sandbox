import p5 from 'p5'
import { Recorder } from 'canvas-frames'
import { GUI } from 'lil-gui'
import { getPaletteVariants } from 'mish-bainrow'
import '~/style.css'
import { Tile, TileArc, TileLines, TileTris, TileTriSquare } from './tiles'

function weightedRandom<T>(array: T[], weights: number[], p: p5): T {
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0)
    const randomNum = p.random() * totalWeight
    let weightSum = 0

    for (let i = 0; i < array.length; i++) {
        weightSum += weights[i]
        if (randomNum <= weightSum) {
            return array[i]
        }
    }

    return array[array.length - 1]
}

let pals = getPaletteVariants({
    // bgShade: { type: 'dark', limit: 40 },
    minContrastBg: 3.8,
    minColors: 3,
    useStroke: false,
})

new p5(
    (p: p5) => {
        let drawing: Drawing
        let palIndex: number
        let recorder: Recorder

        class Drawing {
            tiles: Tile[] = []
            tileWeights = { arc: 0, lines: 4, tris: 4, triSquare: 2 }
            colors: string[]
            bg: string
            n = 10
            m: number
            unit: number
            lastTime: number | null = null
            changeTilesInterval = 30
            lastChangeTilesTime: number | null = null
            idealLength = 40
            noiseFreq = 0.3
            // noiseSpeed = 0.2
            makeTileChance = 0.6
            maxTileSize = 2
            flipChance = 0.01

            _duration = 1500
            paused = false
            allInPause = false
            debg = false

            constructor(palette: { colors: string[]; bg: string }) {
                this.colors = palette.colors
                this.bg = palette.bg

                this.m = p.min(p.width, p.height) * 0.75
                this.unit = this.m / this.n

                this.tiles = this.makeTiles(this.idealLength)
            }

            get duration() {
                return this._duration
            }

            set duration(val: number) {
                this._duration = val
                this.tiles.forEach((tile) => (tile.dur = val))
            }

            makeTiles(count: number) {
                let tiles: Tile[] = []
                let tries = 0

                while (tiles.length < count && tries < 100) {
                    let spot = this.findSpot(tiles)
                    if (spot) {
                        let maybeTile = this.maybeMakeTile(spot.x, spot.y, spot.sz)
                        if (maybeTile) {
                            tiles.push(maybeTile)
                            tries = 0
                        } else {
                            tries++
                        }
                    } else {
                        tries++
                    }
                }

                return tiles
            }

            updatePalette({ colors, bg }: { colors: string[]; bg: string }) {
                this.colors = colors
                this.bg = bg

                this.tiles.forEach((tile) => {
                    tile.clr = p.random(colors)
                })
            }

            findSpot(addTiles: Tile[] = []) {
                let x: number, y: number, sz: number
                let tries = 0

                while (tries < this.n * this.n) {
                    x = p.floor(p.random(0, this.n))
                    y = p.floor(p.random(0, this.n))
                    sz = p.floor(p.random(1, this.maxTileSize + 1))
                    if (sz === 2 && x > 0 && y > 0) {
                        x -= 0.5
                        y -= 0.5
                    } else {
                        sz = 1
                    }

                    if (![...addTiles, ...this.tiles].find((t) => t.x === x && t.y === y)) {
                        return { x, y, sz }
                    }

                    tries++
                }

                return null
            }

            maybeMakeTile(x: number, y: number, sz: number) {
                if (
                    p.noise(x * sz * this.noiseFreq, y * sz * this.noiseFreq) <
                    1 - this.makeTileChance
                )
                    return null

                return this.makeTile(x, y, sz)
            }

            makeTile(x: number, y: number, sz: number) {
                let Opt = weightedRandom(
                    [TileTris, TileTriSquare, TileLines, TileArc],
                    [
                        this.tileWeights.tris,
                        this.tileWeights.triSquare,
                        this.tileWeights.lines,
                        this.tileWeights.arc,
                    ],
                    p,
                )
                let rotateOpts = []
                if (x + sz <= this.n - 1) rotateOpts.push(1)
                if (x - sz >= 0) rotateOpts.push(3)
                if (y + sz <= this.n - 1) rotateOpts.push(2)
                if (y - sz >= 0) rotateOpts.push(0)

                let tile = new Opt({
                    x,
                    y,
                    sz,
                    rotate: p.random(rotateOpts),
                    unit: this.unit,
                    clr: p.random(this.colors),
                })
                tile.dur = this.duration
                tile.show()
                return tile
            }

            draw(ms: number) {
                if (this.lastTime === null) this.lastTime = ms
                let delta = ms - (this.lastTime || 0)
                this.lastTime = ms

                if (this.paused) return

                p.background(this.bg)

                let maybeChangeStuff = false
                if (!this.lastChangeTilesTime) this.lastChangeTilesTime = ms
                if (!this.allInPause && ms - this.lastChangeTilesTime > this.changeTilesInterval) {
                    this.lastChangeTilesTime = ms
                    maybeChangeStuff = true
                }

                let shouldPause = this.allInPause

                p.push()
                p.translate((p.width - this.m) / 2, (p.height - this.m) / 2)

                p.translate(this.unit / 2, this.unit / 2)

                this.tiles.forEach((tile) => {
                    tile.update(delta)
                    tile.draw(p)

                    if (maybeChangeStuff && tile.stage === 'show') {
                        if (p.random() < this.flipChance) {
                            tile.flip()
                        }
                    }

                    if (tile.stage !== 'show') {
                        shouldPause = false
                    }
                })

                p.pop()

                this.tiles = this.tiles.filter((tile) => tile.stage !== 'hide')

                if (shouldPause) {
                    this.paused = true
                    this.allInPause = false
                }
            }

            pause() {
                this.paused = true
            }

            play() {
                this.paused = false
            }

            restart() {
                p.noiseSeed(p.random())
                this.tiles = this.makeTiles(this.idealLength)
                this.allInPause = false
                this.paused = false
            }
        }

        const makeGui = () => {
            const gui = new GUI().close()

            gui.add(drawing, 'idealLength', 1, 200, 1)
            gui.add(drawing, 'changeTilesInterval', 0, 1000, 1)
            gui.add(drawing, 'noiseFreq', 0, 0.5, 0.001)
            gui.add(drawing, 'duration', 0, 4000, 10)
            gui.add(drawing, 'flipChance', 0, 0.3, 0.0001)
            gui.add(drawing, 'n', 1, 100, 1).onChange(() => {
                drawing.unit = drawing.m / drawing.n
                drawing.restart()
            })
            gui.add(drawing, 'allInPause').listen()
            gui.add(drawing, 'paused').listen()

            const debg = {
                palIndex: palIndex,
                save: () => {
                    p.saveCanvas('05-tiles', 'png')
                },
            }

            gui.add(debg, 'palIndex', 0, pals.length - 1, 1)
                .name('palette')
                .onChange(() => {
                    drawing.updatePalette(pals[debg.palIndex])
                })

            let wf = gui.addFolder('tile weights')
            wf.add(drawing.tileWeights, 'arc', 0, 10, 1)
            wf.add(drawing.tileWeights, 'lines', 0, 10, 1)
            wf.add(drawing.tileWeights, 'tris', 0, 10, 1)
            wf.add(drawing.tileWeights, 'triSquare', 0, 10, 1)

            gui.add(drawing, 'restart')
            // gui.add(drawing, 'allInPause')
            gui.add(debg, 'save')
        }

        p.setup = function () {
            let m = p.min(window.innerWidth, window.innerHeight)
            let canvas = p.createCanvas(m, m).elt as HTMLCanvasElement

            // recorder = new Recorder({
            //     canvas: canvas as HTMLCanvasElement,
            //     draw: (ms) => {
            //         drawing.draw(ms)
            //     },
            //     // position: 'bottom-right',
            // })
            // recorder.on('beforeStart', () => {
            //     p.noLoop()
            //     drawing.restart()
            //     drawing.lastChangeTilesTime = null
            //     drawing.lastTime = null
            // })

            // p.rectMode(p.CENTER)
            p.strokeCap(p.SQUARE)
            p.strokeJoin(p.MITER)

            palIndex = p.floor(p.random(pals.length))
            let palette = pals[palIndex]

            drawing = new Drawing(palette)
            makeGui()
        }

        p.draw = function () {
            // if (recorder.isRecording) return

            drawing.draw(p.millis())
        }
    },
    document.getElementById('sketch') ?? undefined,
)

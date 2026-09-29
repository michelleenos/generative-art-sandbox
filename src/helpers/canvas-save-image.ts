export function saveCanvasImage(
    canvas: HTMLCanvasElement,
    fileName = 'canvas',
    type: 'png' | 'jpeg' | 'webp' = 'png',
    quality?: number,
    scale = 1,
) {
    if (scale !== 1) {
        const { width: sw, height: sh } = canvas
        return saveCanvasAtCoords(canvas, { sx: 0, sy: 0, sw, sh, fileName, type, quality, scale })
    }
    const dataUrl = canvas.toDataURL(`image/${type}`, quality)
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${fileName}.${type}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

type SaveCanvasCoordsOpts = {
    sx: number
    sy: number
    sw: number
    sh: number
    fileName?: string
    type?: 'png' | 'jpeg' | 'webp'
    quality?: number
    /** integer nearest-neighbor upscale; 2x keeps colors intact through 4:2:0 re-encodes (webp/jpeg/video) */
    scale?: number
}
export function saveCanvasAtCoords(
    canvas: HTMLCanvasElement,
    { sx, sy, sw, sh, fileName = 'canvas', type = 'png', quality, scale = 1 }: SaveCanvasCoordsOpts,
) {
    const newCanvas = document.createElement('canvas')
    const ctx = newCanvas.getContext('2d')!

    newCanvas.width = sw * scale
    newCanvas.height = sh * scale
    ctx.imageSmoothingEnabled = false

    ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw * scale, sh * scale)

    // const dataUrl = newCanvas.toDataURL(`image/${type}`, quality)
    newCanvas.toBlob(
        (blob) => {
            if (!blob) return
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.href = url
            link.download = `${fileName}.${type}`

            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        },
        `image/${type}`,
        quality,
    )
}

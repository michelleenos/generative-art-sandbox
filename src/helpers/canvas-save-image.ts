export function saveCanvasImage(
    canvas: HTMLCanvasElement,
    fileName = 'canvas',
    type: 'png' | 'jpeg' | 'webp' = 'png',
    quality?: number,
) {
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
}
export function saveCanvasAtCoords(
    canvas: HTMLCanvasElement,
    { sx, sy, sw, sh, fileName = 'canvas', type = 'png', quality }: SaveCanvasCoordsOpts,
) {
    const newCanvas = document.createElement('canvas')
    const ctx = newCanvas.getContext('2d')!

    newCanvas.width = sw
    newCanvas.height = sh

    ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)

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

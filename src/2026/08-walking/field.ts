export class Field<T = any> {
    cols: number
    rows: number
    items: (T | null)[][]

    constructor(cols: number, rows: number) {
        this.cols = cols
        this.rows = rows

        this.items = Array.from({ length: cols }, () => {
            return Array.from({ length: rows }, () => null)
        })
    }

    cell(x: number, y: number) {
        return this.items[x][y]
    }

    add(item: T, x: number, y: number) {
        if (this.items[x][y] !== null) {
            console.warn('overwriting a cell!')
        }
        this.items[x][y] = item
    }

    outOfBounds(x: number, y: number) {
        return x >= this.cols || x < 0 || y >= this.rows || y < 0
    }

    valid(x: number, y: number) {
        if (this.outOfBounds(x, y)) return false
        return this.cell(x, y) === null
    }
}

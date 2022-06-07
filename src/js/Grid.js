/** 
 * @file Grid.js contains the DataGrid class used for dynamically building grids of data from JS objects
 * @author Tyler Riffle
 * @version 1.0.0
 * @since 10/11/2021
 */

import Component from "./Component.js"

/**
 * @memberof DataGrid
 * @typedef {Object} ColumnItem Object used to define params for each grid column
 * @property {String} key Identifier for the column
 * @property {Function} [content=value for key] Function to create content given row data
 * @property {String} [display=all caps of the key] String to use as the header
 * @property {String} [width=1fr] Determines width of the column
 */

class Grid extends Component {
    #header = Component.createElement({
        classAttr: "grid-header"
    })
    #body = Component.createElement({
        classAttr: "grid-body"
    })
    #footer = Component.createElement({
        classAttr: "grid-footer"
    })

    #columns = null
    #data = null

    // Optional Params
    #numbered
    
    /**
     * JS Grid Component
     * @param {HTMLElement} container Element to build the grid
     * @param {ColumnItem[]} columns 
     * @param {Object} data Data to display in the grid
     * @param {Boolean} numbered Determines if the rows will be numbered
     */
    constructor(container, columns, data, {
        numbered = true
    } = {}) {
        super({ container })

        this.#columns = columns
        this.#data = data
        this.#numbered = numbered
    }

    render(renderType = Component.RENDER_TYPES.full) {
        if (renderType === Component.RENDER_TYPES.full) {
            this.container.appendChild(this.#header)
            this.container.appendChild(this.#body)
            this.container.appendChild(this.#footer)
        }

        this.#renderHeader()
        this.#renderBody()
        this.#renderFooter()
    }

    #getHeaderDisplay(column) {
        if (!column.display) return column.key.toUpperCase()
        return column.display
    }

    #getNumberCell(content) {
        return Component.createElement({
            classAttr: "grid-cell",
            content
        })
    }

    #renderHeader() {
        this.#header.innerHTML = ""
        let layout = `--layout:`

        // Adds header for row numbers
        if (this.#numbered) {
            this.#header.appendChild(this.#getNumberCell("#"))
            layout += " 50px"
        }

        for (let column of this.#columns) {
            layout += ` ${column.width ?? "1fr"}`
            
            const COLUMN = Component.createElement({
                classAttr: "grid-cell",
                content: this.#getHeaderDisplay(column)
            })

            this.#header.appendChild(COLUMN)
        }

        // Sets layout css var for grid layout
        this.container.setAttribute("style", layout)
    }

    #renderBody() {
        this.#data.forEach((row, index) => {
            let rowElem = Component.createElement({
                classAttr: "grid-row"
            })

            console.log(this.#numbered)
            if (this.#numbered) rowElem.appendChild(this.#getNumberCell(index + 1))
            
            for (let column of this.#columns) {
                rowElem.appendChild(Component.createElement({
                    classAttr: "grid-cell",
                    content: column.content ? column.content(row) : row[column.key]
                }))
            }

            this.#body.appendChild(rowElem)
        })
    }

    #renderFooter() {
        this.#footer.innerText = `Last Updated: ${new Date().toLocaleString()}`
    }
}

export default Grid
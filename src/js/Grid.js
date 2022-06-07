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
    
    /**
     * JS Grid Component
     * @param {HTMLElement} container Element to build the grid
     * @param {ColumnItem[]} columns 
     * @param {Object} data Data to display in the grid
     */
    constructor(container, columns, data) {
        super({ container })

        this.#columns = columns
        this.#data = data
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

    #renderHeader() {
        this.#header.innerHTML = ""

        let layout = `--layout:`
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
        for (let row of this.#data) {
            let rowElem = Component.createElement({
                classAttr: "grid-row"
            })
            
            for (let column of this.#columns) {
                rowElem.appendChild(Component.createElement({
                    classAttr: "grid-cell",
                    content: column.content ? column.content(row) : row[column.key]
                }))
            }

            this.#body.appendChild(rowElem)
        }
    }

    #renderFooter() {
        this.#footer.innerText = `Last Updated: ${new Date().toLocaleString()}`
    }
}

export default Grid
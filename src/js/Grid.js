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
 * @property {String} [key=null] Identifier for the column
 * @property {Function} [content=value for key] Function to create content given row data
 * @property {String} [display=all caps of the key] String to use as the header
 * @property {String} [width=1fr] Determines width of the column
 * @property {String} [id=null] Used internally to identify programatically added columns
 * @property {Boolean} [sortable=true] Used to determine if given column is sortable
 */

class Grid extends Component {

    static SORT_DIRECTIONS = {
        asc: "asc",
        desc: "desc"
    }

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
    
    // Optional Params
    #data
    #expand
    #sortable

    /**
     * JS Grid Component
     * @param {HTMLElement} container Element to build the grid
     * @param {ColumnItem[]} columns Array of ColumnItems used to define column related information and grid structure
     * @param {Object} [data=null] Data to display in the grid
     * @param {Function} [expand=null] Function used to display expand data
     * @param {Boolean} [numbered=false] Determines if the rows will be numbered
     * @param {Boolean} [sortable=true] Determines if the column headers can be used to sort the data
     */
    constructor(container, columns, {
        data = null,
        expand = null,
        numbered = false,
        sortable = true
    } = {}) {
        super({ container })

        Component.test({columns}, Component.isArr, { type: "Array" })
        this.#columns = columns

        Component.test({data}, Component.isArr, { type: "Array", nullable: true })
        this.#data = data
        
        Component.test({numbered}, Component.isBool, { type: "Boolean" })
        if (numbered) {
            this.#columns.unshift({
                display: "#",
                content: (rowData, index) => index + 1,
                width: "50px"
            })
        }

        Component.test({expand}, Component.isFunction, { type: "Function", nullable: true })
        this.#expand = expand
        if (this.#expand) {
            this.#columns.unshift({
                content: () => `<span class="expandIcon"></span>`,
                width: "50px",
                id: "expand"
            })
        }

        Component.test({sortable}, Component.isBool, { type: "Boolean" })
        this.#sortable = sortable
        this.sortKey = null
        this.sortDirection = null
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

        this.#linkEvents(renderType)
    }

    #getHeaderDisplay(column) {
        if (column.display) return column.display
        if (column.key) return column.key.toUpperCase()
        return ""
    }

    #renderHeader() {
        this.#header.innerHTML = ""
        let layout = `--layout:`

        for (let column of this.#columns) {
            layout += ` ${column.width ?? "1fr"}`

            const DATASET = {}
            if (this.#sortable && column.sortable != false && column.key) DATASET.key = column.key
            if (this.sortKey === column.key) DATASET.direction = this.sortDirection
            
            const COLUMN = Component.createElement({
                classAttr: "grid-cell",
                content: this.#getHeaderDisplay(column),
                dataset: DATASET
            })

            this.#header.appendChild(COLUMN)
        }

        // Sets layout css var for grid layout
        this.container.setAttribute("style", layout)
    }

    #getCellContent(index, row, column) {
        let content = column.content ? column.content(row, index) : row[column.key] ?? "&mdash;"

        // Removed icon for expand if expand function returns false
        if (column.id === "expand" && !this.#expand(row)) content = "" 

        return content
    }

    #renderBody() {
        this.#body.innerHTML = ""
        if (!this.#data) return this.#body.innerHTML = "<div class='grid-no-data'>There is no data to display</div>"

        let temp_data = JSON.parse(JSON.stringify(this.#data))
        if (this.#sortable && this.sortKey && this.sortDirection) this.#sort(temp_data)

        temp_data.forEach((row, index) => {
            let rowElem = Component.createElement({
                element: this.#expand ? "summary" : "div",
                classAttr: "grid-row"
            })

            for (let column of this.#columns) {
                rowElem.appendChild(Component.createElement({
                    classAttr: "grid-cell",
                    content: this.#getCellContent(index, row, column)
                }))
            }

            if (this.#expand && this.#expand(row)) {
                const DETAILS = Component.createElement({
                    element: "details"
                })
                DETAILS.appendChild(rowElem)
                DETAILS.appendChild(Component.createElement({
                    classAttr: "grid-expand",
                    content: this.#expand(row)
                }))
                this.#body.appendChild(DETAILS)
            }
            else this.#body.appendChild(rowElem)
        })
    }

    #renderFooter() {
        this.#footer.innerText = `Last Updated: ${new Date().toLocaleString()}`
    }

    #linkEvents(renderType) {
        if (renderType === Component.RENDER_TYPES.full) {}

        this.#header.querySelectorAll(".grid-cell").forEach(cell => {
            cell.addEventListener("click", e => {
                this.sortKey = e.target.dataset.key
                this.sortDirection = e.target.dataset.direction != Grid.SORT_DIRECTIONS.asc ? Grid.SORT_DIRECTIONS.asc : Grid.SORT_DIRECTIONS.desc

                this.render(Component.RENDER_TYPES.partial)
            })

            cell.addEventListener("contextmenu", e => {
                e.preventDefault()
                this.sortKey = null
                this.sortDirection = null

                this.render(Component.RENDER_TYPES.partial)
            })
        })
    }

    /**
     * Function for sorting data. Supports strings, int, and date formats
     * @param {string} type Matches a key from data
     * @param {string} direction asc or desc
     */
     #sort(data, { key=this.sortKey, direction=this.sortDirection } = {}) {
        data.sort((a, b) => {
            const trueValue = (value) => { return direction == Grid.SORT_DIRECTIONS.desc ? value * -1 : value }
        
            const getValue = (data) => {
                const column = this.#columns.find(column => column.key === key)
                const VALUE = column.content ? column.content(data).toString() : data[key]
                
                if (column.sortType) {
                    switch (column.sortType) {
                        case "int": return (parseInt(VALUE.match(/\d+/)))
                        case "date":
                        case "datetime":
                             return new Date(data[key]).getTime()
                        default: return VALUE
                    }
                }

                return VALUE
            }
            
            if (getValue(a) === null) return trueValue(1)
            if (getValue(b) === null) return trueValue(-1)
        
            if (getValue(a) === getValue(b)) return 0
            return getValue(a) > getValue(b) ? trueValue(1) : trueValue(-1)
        })
    }
}

export default Grid
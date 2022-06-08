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

    #actionBar = Component.createElement({
        classAttr: "grid-action-bar"
    })
    #header = Component.createElement({
        classAttr: "grid-header"
    })
    #body = Component.createElement({
        classAttr: "grid-body"
    })
    #footer = Component.createElement({
        classAttr: "grid-footer"
    })

    #searchBar = Component.createElement({
        element: "input",
        classAttr: "grid-search-bar",
        attrSet: {
            type: "search",
            placeholder: "Search...",
            incremental: true
        }
    })

    #columns = null
    
    // Optional Params
    #data
    #expand
    #sortable
    #selectable
    #search
    
    // Program Vars
    #checkAll = false
    #searchValue = null

    /**
     * JS Grid Component
     * @param {HTMLElement} container Element to build the grid
     * @param {ColumnItem[]} columns Array of ColumnItems used to define column related information and grid structure
     * @param {Object} [data=null] Data to display in the grid
     * @param {Function} [expand=null] Function used to display expand data
     * @param {Boolean} [numbered=false] Determines if the rows will be numbered
     * @param {Boolean} [sortable=true] Determines if the column headers can be used to sort the data
     * @param {String} [selectable=null] Key for value that is used to identify selected row
     */
    constructor(container, columns, {
        data = null,
        expand = null,
        numbered = false,
        sortable = true,
        selectable = null,
        search = true
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
                width: "50px",
                sortable: false
            })
        }

        Component.test({selectable}, Component.isString, { nullable: true })
        this.#selectable = selectable
        if (this.#selectable) {
            this.#columns.push({
                display: () => `<input type="checkbox" id="cb_checkAll" ${this.#checkAll ? "checked" : ""}>`,
                content: (rowData, index) => `<input type="checkbox" id="cb_row${index}" data-id="${rowData[this.#selectable]}" ${rowData.selected ? "checked" : ""}>`,
                width: "50px",
                sortable: false
            })
        }

        Component.test({expand}, Component.isFunction, { type: "Function", nullable: true })
        this.#expand = expand
        if (this.#expand) {
            this.#columns.unshift({
                content: () => `<span class="expandIcon"></span>`,
                width: "50px",
                id: "expand",
                sortable: false
            })
        }

        Component.test({sortable}, Component.isBool, { type: "Boolean" })
        this.#sortable = sortable
        this.sortKey = null
        this.sortDirection = null

        Component.test({search}, Component.isBool, { type: "Boolean" })
        this.#search = search
    }

    render(renderType = Component.RENDER_TYPES.full) {
        if (renderType === Component.RENDER_TYPES.full) {
            if (this.#search) {
                this.container.appendChild(this.#actionBar)

                this.#renderActionBar()
            }
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
        if (column.display) {
            if (typeof(column.display) === "function") return column.display()
            return column.display
        }
        if (column.key) return column.key.toUpperCase()
        return ""
    }

    #renderActionBar() {
        if (this.#search) {
            this.#actionBar.appendChild(this.#searchBar)
        }
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

        // Search filtering
        if (this.#searchValue) {
            temp_data = temp_data.filter((item, index) => {
                for (let column of this.#columns) {
                    if (!column.key) continue
                    const CONTENT = String(this.#getCellContent(index, item, column)).toLowerCase()
                    if (CONTENT.includes(this.#searchValue)) return true
                }
                return false
            })
        }

        temp_data.forEach((row, index) => {
            let rowElem = Component.createElement({
                element: this.#expand ? "summary" : "div",
                classAttr: "grid-row",
                id: `row${index}`
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
        if (renderType === Component.RENDER_TYPES.full) {
            if (this.#search) {
                this.#searchBar.addEventListener("search", () => {
                    this.#searchValue = this.#searchBar.value.toLowerCase()
                    this.render(Component.RENDER_TYPES.partial)
                })
            }
        }

        this.#header.querySelectorAll(".grid-cell[data-key]").forEach(cell => {
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

        if (this.#selectable) {
            this.#header.querySelector("#cb_checkAll").addEventListener("change", e => {
                const CHECKED = e.target.checked
                const IDS = []
                this.#body.querySelectorAll("[id^=cb_row]").forEach(cb => { 
                    if (cb.checked === CHECKED) return
                    cb.checked = CHECKED
                    const ROW = this.#data.find(item => item.id == cb.dataset.id)
                    IDS.push(cb.dataset.id)
                    ROW.selected =CHECKED
                })

                this.#checkAll = CHECKED

                const EVENT = new CustomEvent("selectAll", { detail: {
                    ids: IDS,
                    checked: CHECKED
                }})
                this.container.dispatchEvent(EVENT)
            })

            this.#body.querySelectorAll("[id^=cb_row]").forEach(cb => {
                cb.addEventListener("change", () => {
                    const ROW = this.#data.find(item => item.id == cb.dataset.id)
                    if (cb.checked) ROW.selected = true
                    else ROW.selected = false
                    
                    const EVENT = new CustomEvent("rowSelected", { detail: {
                        id: cb.dataset.id,
                        checked: cb.checked
                    }})
                    this.container.dispatchEvent(EVENT)
                })
            })
        }
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
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

    #columnData = null
    
    // Optional Params
    #data
    #expand
    #sortable
    #selectable
    #search
    #uniqueIdentifier
    
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
     * @param {String} [uniqueIdentifier=id] Unique identifier for each row in the given data
     */
    constructor(container, columnData, {
        data = null,
        expand = null,
        numbered = false,
        sortable = true,
        selectable = false,
        search = true,
        uniqueIdentifier = "id"
    } = {}) {
        super({ container })

        Component.test({columnData}, Component.isArr, { type: "Array" })
        this.#columnData = columnData
        
        Component.test({data}, Component.isArr, { type: "Array", nullable: true })
        this.#data = data
        
        Component.test({uniqueIdentifier}, Component.isString)
        this.#uniqueIdentifier = uniqueIdentifier

        Component.test({numbered}, Component.isBool, { type: "Boolean" })
        if (numbered) {
            this.#columnData.unshift({
                display: "#",
                content: ({ index }) => index + 1,
                width: "50px",
                sortable: false
            })
        }

        Component.test({selectable}, Component.isBool)
        this.#selectable = selectable
        if (this.#selectable) {
            this.#columnData.push({
                display: () => `<input type="checkbox" id="cb_checkAll" ${this.#checkAll ? "checked" : ""}>`,
                content: ({rowData}) => `<input type="checkbox" id="cb_row${rowData[this.#uniqueIdentifier]}" data-${this.#uniqueIdentifier}="${rowData[this.#uniqueIdentifier]}" ${rowData.dataset?.selected ? "checked" : ""}>`,
                width: "50px",
                sortable: false
            })
        }

        Component.test({expand}, Component.isFunction, { type: "Function", nullable: true })
        this.#expand = expand
        if (this.#expand) {
            this.#columnData.unshift({
                content: () => `<span class="expandIcon"></span>`,
                width: "50px",
                columnId: "expand",
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

    #getHeaderDisplay(columnData) {
        if (columnData.display) {
            if (typeof(columnData.display) === "function") return columnData.display()
            return columnData.display
        }
        if (columnData.key) return columnData.key.toUpperCase()
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

        for (let columnData of this.#columnData) {
            layout += ` ${columnData.width ?? "1fr"}`

            const DATASET = {}
            if (this.#sortable && columnData.sortable != false && columnData.key) DATASET.key = columnData.key
            if (this.sortKey === columnData.key) DATASET.direction = this.sortDirection
            
            const COLUMN = Component.createElement({
                classAttr: "grid-cell",
                content: this.#getHeaderDisplay(columnData),
                dataset: DATASET
            })

            this.#header.appendChild(COLUMN)
        }

        // Sets layout css var for grid layout
        this.container.setAttribute("style", layout)
    }

    #getCellContent(columnData, rowData) {
        const INDEX = this.#data.findIndex(item => item[this.#uniqueIdentifier] === rowData[this.#uniqueIdentifier])
        
        // Removed icon for expand if expand function returns false
        if (columnData.gridId === "expand" && !this.#expand(rowData)) return "" 
        if (columnData.content) return columnData.content({ columnData, rowData, index: INDEX })
        if (rowData[columnData.key] === "" || rowData[columnData.key] === null || rowData[columnData.key] === undefined) return "&mdash;"
        return String(rowData[columnData.key])
    }

    #renderBody() {
        this.#body.innerHTML = ""
        if (!this.#data) return this.#body.innerHTML = "<div class='grid-no-data'>There is no data to display</div>"

        let tempData = JSON.parse(JSON.stringify(this.#data))
        if (this.#sortable && this.sortKey && this.sortDirection) this.#sort(tempData)

        // Search filtering
        if (this.#searchValue) {
            tempData = tempData.filter((rowData) => {
                for (let columnData of this.#columnData) {
                    if (!columnData.key) continue
                    const CONTENT = String(this.#getCellContent(columnData, rowData)).toLowerCase()
                    if (CONTENT.includes(this.#searchValue)) return true
                }
                return false
            })
        }

        if (tempData.length === 0) return this.#body.innerHTML = "<div class='grid-no-data'>No data matched the search</div>"
        tempData.forEach(rowData => {
            const ROW_DATASET = {}
            if (rowData.dataset) {
                for (let key in rowData.dataset) {
                    ROW_DATASET[key] = rowData.dataset[key]
                }
            }

            let row = Component.createElement({
                element: this.#expand ? "summary" : "div",
                classAttr: "grid-row",
                id: `row${rowData[this.#uniqueIdentifier]}`,
                dataset: ROW_DATASET
            })

            for (let columnData of this.#columnData) {
                row.appendChild(Component.createElement({
                    classAttr: "grid-cell",
                    content: this.#getCellContent(columnData, rowData)
                }))
            }

            if (this.#expand && this.#expand(rowData)) {
                const DETAILS = Component.createElement({
                    element: "details"
                })
                DETAILS.appendChild(row)
                DETAILS.appendChild(Component.createElement({
                    classAttr: "grid-expand",
                    content: this.#expand(rowData)
                }))
                this.#body.appendChild(DETAILS)
            }
            else this.#body.appendChild(row)
        })
    }

    #renderFooter() {
        this.#footer.innerText = `Last Updated: ${new Date().toLocaleString()}`
    }

    /**
     * Updates a row's dataset values and a adds items to data row's dataset key
     * @param {string} id id of the row
     */
    #updateRow(id, data) {
        const ROW_DATA = this.#data.find(rowData => rowData[this.#uniqueIdentifier] == id)
        if (!ROW_DATA.dataset) ROW_DATA.dataset = {}

        const ROW = this.#body.querySelector(`#row${id}`)

        for (let key in data) {
            ROW.dataset[key] = data[key]
            ROW_DATA.dataset[key] = data[key]
        }
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
                this.#checkAll = e.target.checked
                const CB_IDS = []
                this.#body.querySelectorAll("[id^=cb_row]").forEach(cb => { 
                    if (cb.checked === this.#checkAll) return

                    cb.checked = this.#checkAll
                    CB_IDS.push(cb.dataset[this.#uniqueIdentifier])

                    this.#updateRow(cb.dataset[this.#uniqueIdentifier], {
                        selected: this.#checkAll
                    })
                })


                const EVENT = new CustomEvent("selectAll", { detail: {
                    ids: CB_IDS,
                    checked: this.#checkAll
                }})
                this.container.dispatchEvent(EVENT)
            })

            this.#body.querySelectorAll("[id^=cb_row]").forEach(cb => {
                cb.addEventListener("change", () => {
                   this.#updateRow(cb.dataset[this.#uniqueIdentifier], {
                        selected: cb.checked
                    })
                    
                    const EVENT = new CustomEvent("rowSelected", { detail: {
                        id: cb.dataset[this.#uniqueIdentifier],
                        checked: cb.checked
                    }})
                    this.container.dispatchEvent(EVENT)
                })
            })
        }
    }

    /**
     * Function for sorting objects within data array. Supports strings, int, and date formats
     * @param {string} type Matches a key from object in data array
     * @param {string} direction asc or desc
     */
     #sort(data, { key=this.sortKey, direction=this.sortDirection } = {}) {
        data.sort((a, b) => {
            const sortValue = (value) => { return direction == Grid.SORT_DIRECTIONS.desc ? value * -1 : value }
        
            const getCellValue = (rowData) => {
                const COLUMN_DATA = this.#columnData.find(columnData => columnData.key === key)
                const CONTENT = String(this.#getCellContent(COLUMN_DATA, rowData))
                
                if (COLUMN_DATA.sortType) {
                    switch (COLUMN_DATA.sortType) {
                        case "int": return (parseInt(CONTENT.replace(/\D/ig, "")))
                        case "date":
                        case "datetime":
                            return new Date(rowData[key]).getTime()
                        default: return CONTENT
                    }
                }

                return CONTENT
            }
            
            if (getCellValue(a) === null) return getCellValue(1)
            if (getCellValue(b) === null) return getCellValue(-1)
        
            if (getCellValue(a) === getCellValue(b)) return 0
            return getCellValue(a) > getCellValue(b) ? sortValue(1) : sortValue(-1)
        })
    }
}

export default Grid
/** 
 * @file Grid.js contains the DataGrid class used for dynamically building grids of data from JS objects
 * @author Tyler Riffle
 * @version 1.0.0
 * @since 10/11/2021
 */

/**
 * @memberof DataGrid
 * @typedef {Object} ColumnItem Object used to define params for each grid column
 * @property {String} key Identifier for the column
 * @property {Function} [content] Function to create content given row data
 * @property {String} [display] String to use as the header - default is all caps of the key
 * @property {String} [width=1fr] Determines width of the column
 * @property {Boolean} [searchable=true] Determines if column is searchable
 * @property {Boolean} [active=true] Determines if column is active in the grid display
 * @property {Boolean} [sortable=true] Determines if column is sortable
 * @property {Boolean} [sortType=null] Determines value type to use in sort
 * @property {Boolean} [searchDefault=false] Determines if the column is the search default
 * @property {Boolean} [toggleable=false] Determines if the column is the search default
 */

/**
 * @memberof DataGrid
 * @typedef {Object} Filter Object used to define params for a filter
 * @property {String} id Id of the filter
 * @property {String} [label] Label to show before select
 * @property {String} [parentId] Id of the parent filter
 * @property {FilterOption[]} options FilterOptions for the select
 * @property {Function} filter Function the returns a boolean to use in the filter for the data given (rowData, value) - rowData is data for given item - value is value of the filter
 * @property {String} [linkedColumn] Links a columns active status to filter - determines if the filter should be hidden when the column is not active
 * @property {Boolean} [isNullable=true] Determine if there is a null option added to remove filter
 * @property {String} [activeOption] value of the active option
 * @property {Boolean} [active] Determines if the filter is active
 * @see DataGrid.FilterOption
 */

/**
 * @memberof DataGrid
 * @typedef {Object} FilterOption Object used to define params for a filter option
 * @property {String} value Value of the option
 * @property {Function|String} content Text to display
 * @property {Boolean} [active] Determines if the filter option is active
 */

/**
 * @memberof DataGrid
 * @typedef {Object} ExpandParams Object used to define params for expanding
 * @property {String} key Key for data that must be present in row data to create expand
 * @property {Function|String} content Content to render in the collapse
 * @property {String} expandIconColumn Key of the column to add the collapse icons
 */

/**
 * @memberof DataGrid
 * @typedef {Object} GridStyles Object with grid style options that are in addition to the base component styles
 * @property {Boolean} [hasHover=false] Determines if the grid rows have a hover effect
 * @property {Boolean} [isStriped=true] Determines if the grid rows are striped
 * 
 * @see Component.Styles
 */

import { default as Component, CheckboxDropdown } from "./Component.js"

/**
 * Grid Component used for dynamically building grids of data from JS objects
 * @extends Component
 * @see DataGrid.FilterOption
 * @see DataGrid.ColumnItem
 * @see DataGrid.ExpandParams
 * @see DataGrid.GridClasses
 * @see DataGrid.GridStyles
 */
class DataGrid extends Component {

    /**
     * @memberof DataGrid
     * @private
     * @instance
     * @var {Filter[]} filterList Array of all the created filters
     */
    #filterList

    /**
     * @memberof DataGrid
     * @private
     * @instance
     * @var {Object} linkSections Object containing the link sections that can be used in events
     */
    #linkSections
    
    /**
     * @memberof DataGrid
     * @static
     * @var {Object} LAYOUT_TYPES Object of the available layout types
     */
    static LAYOUT_TYPES = { list: "list", card: "card" }

    /**
     * @memberof DataGrid
     * @static
     * @var {Object} STYLE_TYPES Object of the available style types
     */
    static STYLE_TYPES = { default: "default", notSortable: "not-sortable", grouped: "grouped", sortedGroup: "sorted-group" }

    /**
     * @memberof DataGrid
     * @static
     * @var {Object} SORT_DIRECTIONS Object of the available sort directions
     */
    static SORT_DIRECTIONS = { asc: "asc", desc: "desc" }

    /**
     * Create a datagrid
     * @param {Array<ColumnItem>} columnList Array of all column information
     * @param {Boolean} [dynamicColumns=false] determines if the grid has dynamic columns
     * @param {String} [toggleLayout=true] Determines if the grid can toggle between layouts
     * @param {String} [minWidth=null] Sets the min width for the header and body containers
     * @param {String} [layout=list] Sets layout for the grid - list | card
     * @param {Object[]} [data=[]] Data to be displayed
     * @param {String[]} [dataKeys=[]] Keys of the data to get added to each row
     * @param {String} [style=default] Style of the grid - grouped, sorted-group, default, not-sortable
     * @param {String} [groupKey=null] Key for which rows need to be grouped by
     * @param {String} [counterColumn=null] Determines which column, based on given key, to add row number. Will place {rowNum} if found in string, otherwise it will add the number to the start of the string
     * @param {String} [sortKey=null] Sets the key for the DataGrid to sort by -- Defaults to the first column
     * @param {String} [sortDirection=asc] asc or desc
     * @param {GridClasses} [classes={}] Class for all the components of the grid 
     * @param {Boolean} [search=false] Determine if the search bar is created
     * @param {String} [noDataText=There is currently no data to display] Text to display when there is no data to display
     * @param {GridStyles} [styles={}] Different additional styles the grid can have
     * @param {ExpandParams} [expand=null] Information needed to add expand content

     */
    constructor({
        container,
        theme,
        columnList,
        dynamicColumns=false,
        toggleLayout=true,
        minWidth=null,
        layout=DataGrid.LAYOUT_TYPES.list,
        data=[],
        dataKeys=[],
        style=DataGrid.STYLE_TYPES.default,
        groupKey=null,
        counterColumn=null,
        sortKey=null,
        sortDirection=DataGrid.SORT_DIRECTIONS.asc,
        search=false,
        noDataText="There is currently no data to display",
        styles={},
        expand=null,
        actions
    } = {}) {

        super({
            container,
            styles,
            theme,
            actions
        })

        Component.test({columnList}, Component.isArr, {type: "array"})
        this.columnList = columnList

        Component.test({dynamicColumns}, Component.isBool, {type: "boolean", nullable: true })
        this.dynamicColumns = dynamicColumns

        Component.test({toggleLayout}, Component.isBool, {type: "boolean"})
        this.toggleLayout = toggleLayout
        
        Component.test({minWidth}, Component.isString, { nullable: true })
        this.minWidth = minWidth

        Component.test({layout}, Component.inArr, { checkArr: Object.values(DataGrid.LAYOUT_TYPES) })
        this.layout = layout
        
        Component.test({noDataText}, Component.isString)
        this.noDataText = noDataText

        Component.test({data}, Component.isArr, { type: "array" })
        this.data = (() => {
            data.forEach((item, index) => {
                item.gridRowId = index
            })
            return data
        })()

        Component.test({style}, Component.inArr, { checkArr: Object.values(DataGrid.STYLE_TYPES) })
        this.style = style

        Component.test({dataKeys}, Component.isArr, { type: "array" })
        this.dataKeys = dataKeys

        if (!groupKey && (this.style === DataGrid.STYLE_TYPES.grouped || this.style === DataGrid.STYLE_TYPES.sortedGroup)) throw new Error(`Must have a groupKey when using style "grouped" or "sorted-group"`)
        Component.test({groupKey}, Component.isString, { nullable: true })
        this.groupKey = groupKey

        Component.test({sortKey}, Component.inArr, { checkArr: this.#getColumnKeys(this.columnList), nullable: true })
        this.sortKey = sortKey ?? (this.style != DataGrid.STYLE_TYPES.notSortable ? this.columnList[0].key : null)

        Component.test({sortDirection}, Component.inArr, { checkArr: Object.values(DataGrid.SORT_DIRECTIONS) })
        this.sortDirection = sortDirection

        Component.test({counterColumn}, Component.inArr, { checkArr: this.#getColumnKeys(this.columnList), nullable: true })
        this.counterColumn = counterColumn

        Component.test({styles}, Component.isObj, { type: "object" })
        for (let key of Object.keys(styles)) {
            Component.test({key: styles[key]}, Component.isBool, { type: "boolean", key: `styles.${key}` })
        }
        this.styles = {
            ...this.styles,
            hover: styles.hasHover ?? false,
            striped: styles.isStriped ?? false
        }

        Component.test({search}, Component.isBool, { type: "boolean", nullable: true })
        this.search = search

        if (expand) {
            Component.test({expand}, Component.isObj, { type: "object" })
            Component.test({key: expand.key}, Component.isString, { key: `expand.key` })
            Component.test({content: expand.content}, Component.isFunction, { key: `expand.content` })
            Component.test({expandIconColumn: expand.expandIconColumn}, Component.inArr, { checkArr: this.#getColumnKeys(this.columnList), key: `expand.expandIconColumn` })
        }
        this.expand = expand

        this.#filterList = []

        this.#linkSections = {
            row: "grid-row",
            cell: "grid-cell"
        }

        this.actionBtns = {
            print: this.actions.print,
            download: this.actions.download,
            save: this.actions.save
        }

        this.editCallback = this.editCellCallback
    }

    /**
     * Gets array of all the column keys
     * @param {ColumnItem[]} columnList Array of column to get the keys from
     * @returns {String[]} Array of the keys
     */
    #getColumnKeys(columnList) {
        const KEYS = []
        for (let column of columnList) {
            KEYS.push(column.key)
        }
        return KEYS
    }

    /**
     * Gets a column given the key
     * @param {String} key Key for the column to be returned
     * @returns {ColumnItem} Column with the same key as the given one
     */
    #getColumnByKey(key) {
        return this.columnList.find(column => column.key === key)
    }

    /**
     * Applies filters to data
     * @param {Object[]} data Object to apply the filters to
     * @returns {Object[]} Filtered object[]
     */
    #applyFilters(data) {
        const APPLIED_FILTERS = this.#filterList.filter(filter => (filter.activeOption && filter.activeOption != "") || filter.isNullable === false)
        if (APPLIED_FILTERS.length != 0) {
            for (let filter of APPLIED_FILTERS) {
                data = data.filter(item => filter.filter(item, filter.activeOption ?? filter.options[0].value))
            }
        }
        return data
    }

    /**
     * Applies search params to data
     * @param {ColumnItem[]} columnList Used to get column infomation for the selected column
     * @param {Object[]} data Data to search through
     * @returns {Object[]} Array of objects that match the search
     */
    #applySearch(columnList, data) {
        const COLUMN = columnList.find(column => column.key === this.searchColumn.value)
        data = data.filter((item => Component.getContent(COLUMN.content ?? item[COLUMN.key], item).toString().toLowerCase().includes(this.searchInput.value.toLowerCase())))
        return data
    }

    /**
     * Returns the data after applying sort, filters, and search if needed
     * @param {ColumnItem[]} columnList Used in applying the search
     * @returns {Object[]} Array of objects after filters, search, and sort are applied - if applicable
     */
    getData(columnList) {
        let data=[...this.data]

        if (this.#filterList.length != 0) data = this.#applyFilters(data)
        if (this.searchParams && this.searchParams[1]) data = this.#applySearch(columnList, data)

        if(this.sortKey && this.style === DataGrid.STYLE_TYPES.default) this.#sort({ data });

        return data
    }

    /**
     * Returns all active columns
     * @returns {ColumnItem[]} Array of active columns
     */
    getActiveColumns() {
        return this.columnList.filter(column => {
            if (column.active != undefined && column.active === false) return false
            return true
        })
    }

    /**
     * Returns all active filters
     * @returns {Filter[]} Array of active filters
     */
    getActiveFilters() {
        return this.#filterList.filter(filter => filter.active == undefined || filter.active == true)
    }

    /**
     * Sets this.gridTemplate to house the correct layout for the active columns
     * @param {ColumnItem[]} columnList Used to get the widths of all the columns
     */
    setGridColumns(columnList) {
        this.gridTemplate = ""
        for (let column of columnList) {
            this.gridTemplate += " " + (column.width ?? "1fr")
        }
    }

    /** 
     * Main call - must be called to put gridview on screen
     * @param {Function} callback Function to call after rendering
     * @param {String} renderType Used to determine what items get rendered
     * @param {Boolean} autoSort Determines if the grid applies an automatic alphabetical sort 
     */
    render({callback, renderType=Component.RENDER_TYPES.full} = {}) {
        Component.test({callback}, Component.isFunction, { type: "function", nullable: true })
        Component.test({renderType}, Component.inArr, { checkArr: Object.values(Component.RENDER_TYPES) })

        if (callback) this.callback = callback
                
        const COLUMN_LIST = this.getActiveColumns()
        this.setGridColumns(COLUMN_LIST)
        const DATA = this.getData(COLUMN_LIST)

        if (renderType === Component.RENDER_TYPES.full) {
            this.container.innerHTML = ''
            this.container.classList.add("grid-container")

            
            const CONTROL_CONTAINER = Component.createElement({ classAttr: "component-control-container" })
            this.container.appendChild(CONTROL_CONTAINER)

            this.gridControlsContainer = Component.createElement({ classAttr: "component-control-item" })
            CONTROL_CONTAINER.appendChild(this.gridControlsContainer)

            this.actionBtnsContainer = Component.createElement({ classAttr: "component-control-item" })
            CONTROL_CONTAINER.appendChild(this.actionBtnsContainer)

            this.#buildControls(COLUMN_LIST)
            

            if (this.search || this.getActiveFilters().length != 0) {
                const CONTROL_CONTAINER = Component.createElement({ classAttr: "component-control-container" })
                this.container.appendChild(CONTROL_CONTAINER)

                this.filtersContainer = Component.createElement({ classAttr: "component-control-item" })
                CONTROL_CONTAINER.appendChild(this.filtersContainer)
                
                this.searchContainer = Component.createElement({ classAttr: "component-control-item" })
                CONTROL_CONTAINER.appendChild(this.searchContainer)
            }

            const CONTENT_CONTAINER = Component.createElement({ classAttr: "x-scroll" })
            this.container.appendChild(CONTENT_CONTAINER)

            this.header = Component.createElement({ classAttr: "component-grid component-row grid-header" })
            CONTENT_CONTAINER.appendChild(this.header)

            let classAttr = "grid-body"
            if (this.styles.hover) classAttr += ` grid-hover`
            if (this.styles.striped) classAttr += ` grid-striped`
            this.body = Component.createElement({ classAttr })
            if (this.minWidth) this.body.style.setProperty("min-width", `calc(${this.minWidth} + 10px)`)
            CONTENT_CONTAINER.appendChild(this.body)
        }

        this.#buildHeader(COLUMN_LIST)
        this.#buildGridView(COLUMN_LIST, DATA)

        if (this.getActiveFilters().length != 0) this.#buildFilters(DATA)

        if (this.search) this.#buildSearch(COLUMN_LIST)

        super.render()
        
        this.#linkEvents(renderType)
        if (this.callback) this.callback(this.container)
    }

    /**
     * Gets correct display content for column
     * @param {ColumnItem} column Column to get the display from
     * @returns {String} Header text for a column
     */
    #getColumnDisplay(column) {
        return column.display ?? column.key.toUpperCase()
    }

    /**
     * Builds dropdown for toggling columns
     * @param {ColumnItem[]} columnList Used to determine what columns are already active
     */
    #buildControls(columnList) {
        if (this.dynamicColumns) {
            let toggleableColumns = this.columnList.filter(column => column.toggleable === undefined || column.toggleable != false)
            let dropdownItems = []
            for (let column of toggleableColumns) {
                dropdownItems.push({
                    active: columnList.findIndex(activeColumn => activeColumn.key === column.key) != -1 ? true : false,
                    value: column.key,
                    id: column.key,
                    text: this.#getColumnDisplay(column)
                })
            }
            
            new CheckboxDropdown({
                container: this.gridControlsContainer,
                items: dropdownItems,
                btnText: "Add/Remove Columns",
                id: "gridColumnDropdown",
                callback: (checkbox) => { this.checkboxChangeCallback(checkbox) }
            }).render()
        }

        for (let action in this.actionBtns) {
            if (!this.actionBtns[action]) continue
            let content = Component.CONTEXT_MENU_TYPES[action].content
            if (Component.CONTEXT_MENU_TYPES[action].icon) content = `${Component.CONTEXT_MENU_TYPES[action].icon} ${content}`
            this.actionBtnsContainer.appendChild(Component.createElement({ element: "button", classAttr: "component-btn", content }))
        }
    }

    /**
     * Adds filters to top of grid
     * @param {Object[]} [data=null] Used for filter option content
     */
    #buildFilters(data=null) {
        this.filtersContainer.innerHTML = ""

        for (let filter of this.#filterList) {
            if (filter.linkedColumn && !this.columnList.find(column => column.key === filter.linkedColumn)?.active) continue
            if (filter.active != undefined && filter.active === false) continue
            let parentValue
            if (filter.parentId) {
                parentValue = this.filtersContainer.querySelector(`select#${filter.parentId}`).value
                if (parentValue === "") continue
            }

            const FILTER = Component.createElement({ classAttr: "component-flex" })
            if (filter.label) FILTER.appendChild(Component.createElement({ element: "label", content: filter.label, classAttr: "component-label" }))
            const SELECT = Component.createElement({ element: "select", id: filter.id, classAttr: "component-select", dataset: {type: "filter"} })
            if (filter.isNullable != false || filter.isNullable === undefined) SELECT.appendChild(Component.createElement({ element: "option", content: "No Filter", attrSet: {value: "null"} }))

            for (let option of (filter.parentId ? filter.options(parentValue) : filter.options)) {
                if (option.active != undefined && option.active === false) continue
                let optionElem = Component.createElement({
                    element: "option",
                    content: Component.getContent(option.content, data),
                    attrSet: {
                        value: option.value,
                        selected: filter.activeOption === option.value ? "true" : undefined
                    }
                })
                SELECT.appendChild(optionElem)
            }
            FILTER.appendChild(SELECT)
            this.filtersContainer.appendChild(FILTER)
        }
    }

    /**
     * Builds search section for grid
     * @param {Object[]} columnList Used for determining what columns to add to column select
     */
    #buildSearch(columnList) {
        this.searchContainer.innerHTML = ''

        this.searchContainer.appendChild(Component.createElement({ content: "Column: ", classAttr: "component-label" }))
        this.searchColumn = Component.createElement({ element: "select", id: "searchColumn", classAttr: "component-select", dataset: {type: "search"} })
        
        for (let column of columnList) {
            if (column.searchable != undefined && !column.searchable) continue
            const OPTION = Component.createElement({
                element: "option",
                content: this.#getColumnDisplay(column),
                attrSet: {
                    value: column.key,
                    selected: this.searchParams && this.searchParams[0] == column.key ? "true" : (column.searchDefault && !this.searchParams ? "true" : "")
                }
            })
            this.searchColumn.appendChild(OPTION)
        }
        this.searchContainer.appendChild(this.searchColumn)

        this.searchInput = Component.createElement({ element: "input", attrSet: {placeholder: "Search...", type: "search", value: this.searchParams && this.searchParams[1] ? this.searchParams[1] : ""}, classAttr: "component-input"})
        this.searchContainer.appendChild(this.searchInput)

        this.searchBtn = Component.createElement({ element: "button", content: "Search", classAttr: "component-btn"}) //🔍 
        this.clearSearchBtn = Component.createElement({ element: "button", content: "Clear", classAttr: "component-btn"}) //❌ 
        this.searchContainer.appendChild(this.searchBtn)
        this.searchContainer.appendChild(this.clearSearchBtn)

        this.searchInput.addEventListener("keypress", e => {
            if (e.charCode != 13) return
            this.searchBtn.click()
        })
    }

    /**
     * Builds all elements in the header row and appends them to this.header
     * @param {ColumnItem[]} columnList Used to determine what headers to add
     */
    #buildHeader(columnList) {
        this.header.innerHTML = ''
        if (this.layout === DataGrid.LAYOUT_TYPES.list) {
            this.header.style.gridTemplateColumns = this.gridTemplate
            if (this.minWidth) this.header.style.minWidth = this.minWidth
            for (let header of columnList) {
                let direction = this.sortKey == header.key ? this.sortDirection : "none"
                const HEADER_ELEM = Component.createElement({
                    classAttr: "grid-cell",
                    dataset: this.style == DataGrid.STYLE_TYPES.default ? { key: header.key, direction } : undefined,
                    content: this.#getColumnDisplay(header)
                })
                if (this.style === DataGrid.STYLE_TYPES.default && (header.sortable == undefined || header.sortable == true)) HEADER_ELEM.style.cursor = "pointer"
                this.header.appendChild(HEADER_ELEM)
            }
        }
    }

    /** 
     * Adds each cell to the data row
     * @param {Object} rowData data for the row
     * @param {Number} [rowNumber] current row number
     * @param {ColumnItem[]} columnList Used to get data from active columns
     */
    #createRow({rowData, rowNumber, columnList} = {}) {
        const ROW_EVENTS = this.eventListeners.filter(event => event.section == "row")
        let rowEventData = {}
        for (let event of ROW_EVENTS) {
            for (let key of event.dataKeys) {
                rowEventData[key] = rowData[key]
            }
        }

        if (this.dataKeys) {
            for (let key of this.dataKeys) {
                rowEventData[key.toLowerCase()] = rowData[key]
            }
        }
        
        const ROW = Component.createElement({
            classAttr: "grid-row component-row component-grid",
            dataset: (() => {
                let dataset = { gridRowId: rowData.gridRowId }
                if (rowEventData != {}) dataset = { ...dataset, ...rowEventData }
                return dataset
            })()
        })
        ROW.style.gridTemplateColumns = this.gridTemplate

        for (let column of columnList) {
            let content = rowData[column.key] ?? Component.getContent(column.content, {...rowData, layout: this.layout}) ??  null
            if (this.counterColumn != null && this.#getColumnByKey(this.counterColumn) === column) content = (() => {
                if (content.includes("{rowNum}")) return content.replace("{rowNum}", rowNumber)
                return `${rowNumber} ${content}`
            })()

            let classAttr = column.style ?? "grid-cell"
            if (this.expand && rowData[this.expand.key] && column.key === this.expand.expandIconColumn) {
                classAttr += ` expandIcon`
            }

            let dataset = column.key ? { id: column.key } : undefined
            if (this.actions.edit) dataset.editable = true

            ROW.appendChild(Component.createElement({
                classAttr,
                content: content != "" || content ? content : "&mdash;",
                dataset
            }))
        }

        if (this.expand && rowData[this.expand.key]) {
            const DETAILS = Component.createElement({ element: "details" })
            const SUMMARY = Component.createElement({ element: "summary" })
            SUMMARY.appendChild(ROW)
            DETAILS.appendChild(SUMMARY)
            DETAILS.appendChild(Component.createElement({
                content: Component.getContent(this.expand.content, {rowData, key: this.expand.key}) 
            }))
            return DETAILS
        } else return ROW
    }
    
    /**
     * Builds main section of the data display
     * @param {ColumnItem[]} columnList Used to determine what data items to display
     * @param {Object[]} data Data to display
     */
    #buildGridView(columnList, data) {
        this.body.innerHTML = ''
        
        if (data.length === 0) {
            this.body.appendChild(Component.createElement({
                classAttr: "grid-no-data",
                content: this.noDataText
            }))
            return
        }

        let rowNumber = 1
        let currentGroup = ""
        const DONE_GROUPS = []
        for (let row of data) {
            if ((this.style === DataGrid.STYLE_TYPES.grouped || this.style === DataGrid.STYLE_TYPES.sortedGroup) && row[this.groupKey] != "") {
                if (currentGroup == row[this.groupKey]) continue
                if (DONE_GROUPS.includes(row[this.groupKey])) continue

                currentGroup = row[this.groupKey]
                DONE_GROUPS.push(currentGroup)
                this.body.appendChild(Component.createElement({
                    classAttr: "grid-group-header component-row",
                    content: currentGroup
                }))
                
                const GROUPED_ITEMS = data.filter(item => item[this.groupKey] == currentGroup)
                if (this.style === DataGrid.STYLE_TYPES.sortedGroup) this.#sort({ data: GROUPED_ITEMS })
                
                for (let item of GROUPED_ITEMS) {
                    this.body.appendChild(this.#createRow({rowData: item, rowNumber, columnList}))
                    rowNumber += 1
                }

                this.body.appendChild(document.createElement("div"))
                this.body.appendChild(Component.createElement({
                    classAttr: "grid-group-divider"
                }))

            } else {
                this.body.appendChild(this.#createRow({rowData: row, rowNumber, columnList}))
                rowNumber += 1
            }
            
        }
    }

    /**
     * Adds event listeners for all events
     * @param {RenderType} renderType String for the type of render that was preformed
     */
    #linkEvents(renderType) {
        if (renderType === Component.RENDER_TYPES.full && this.dynamicColumns) {
            
        }

        if (this.style === DataGrid.STYLE_TYPES.default) {
            this.header.querySelectorAll(Component.makeQuerySelector("grid-cell")).forEach(headerElem => {
                headerElem.addEventListener("click", (e) => {
                    const COLUMN = this.columnList.find(column => column.key === e.target.dataset.key)
                    if (COLUMN && (COLUMN.sortable || COLUMN.sortable === undefined)) {
                        this.sortKey = e.target.dataset.key,
                        this.sortDirection = e.target.dataset.direction != DataGrid.SORT_DIRECTIONS.asc ? DataGrid.SORT_DIRECTIONS.asc : DataGrid.SORT_DIRECTIONS.desc
                        this.render({ renderType: Component.RENDER_TYPES.partial })
                    }
                })
            })
        }
    
        if (this.getActiveFilters().length != 0) {
            this.filtersContainer.querySelectorAll("select[data-type='filter']").forEach(select => {
                select.addEventListener("change", e => {
                    const FILTER = this.#filterList.find(filter => filter.id === e.target.id)
                    FILTER.activeOption = e.target.value
                    this.#filterList.filter(filter => filter.parentId && filter.parentId === FILTER.id).forEach(filter => {
                        delete filter.activeOption
                    })

                    if (FILTER.activeOption === "null") delete FILTER.activeOption
                    this.render({ renderType: Component.RENDER_TYPES.partial })
                })
            })
        }

        if (this.search) {
            this.searchBtn.addEventListener("click", e => {
                this.searchParams = [this.searchColumn.value, this.searchInput.value]
                this.render({ renderType: Component.RENDER_TYPES.partial })
            })
            this.clearSearchBtn.addEventListener("click", e => {
                this.searchParams = [this.searchColumn.value]
                this.render({ renderType: Component.RENDER_TYPES.partial })
            })
        }

        super.linkEvents({ renderType, linkSections: this.#linkSections })
    }

    /**
     * Callback for when a checkbox value is changed
     * @callback CheckboxDropdown~checkboxEvent
     * @param {HtmlCheckboxElement} checkbox Checkbox that was changed
     */
    checkboxChangeCallback(checkbox) {
        let columnIndex = this.columnList.findIndex(column => column.key === checkbox.value)
        if (columnIndex === -1) throw new Error("Unable to find column")
        this.columnList[columnIndex].active = checkbox.checked

        if (!checkbox.checked) {
            this.#filterList.forEach(filter => {
                if (filter.linkedColumn === checkbox.value) {
                    delete filter.activeOption                                
                }
            })                        
        }

        this.render({ renderType: Component.RENDER_TYPES.partial })
    }

    /**
     * Function called when user clicks on edit in context menu
     * @callback Component~linkEvents
     * @param {HtmlElement} cell Cell used to display the information in the grid
     * @param {HtmlInputElement} input Input that was put in place of the cell
     * @param {String} display Display value for the cell prior to hiding it
     */
    editCellCallback(cell, input, display) {
        const COLUMN = this.columnList.find(column => column.key === cell.dataset.id)

        let valid = true
        if (COLUMN.validate) valid = COLUMN.validate instanceof Function ? COLUMN.validate(input.value) : (() => {
            switch (COLUMN.validate) {
                case "date":
                case "datetime":
                    return new Date(input.value) != "Invalid Date" ? true : false
            }
        })

        if (!valid) throw new Error("Invalid data input")
        
        const ROW = cell.closest(".grid-row")
        if (cell.innerText != input.value) this.addChangelog({
            callback: this.undoCellEdit,
            data: {
                gridRowId: ROW.dataset.gridRowId,
                columnKey: cell.dataset.id,
                oldValue: cell.innerText,
                newValue: input.value
            },
            component: this
        })
        this.data[ROW.dataset.gridRowId][cell.dataset.id] = input.value
        cell.innerText = input.value
        input.remove()
        cell.style.display = display;
    }

    undoCellEdit(change) {
        change.component.data[change.data.gridRowId][change.data.columnKey] = change.data.oldValue
        change.component.render({ renderType: Component.RENDER_TYPES.partial })
    }

    /**
     * Function used to add filters to DataGrid
     * @param {Filter} filter Params for creating the filter
     * @see DataGrid.Filter
     */
    addFilter(filter) {
        Component.test({filter}, Component.isObj, {type: "object"})

        Component.test({id: filter.id}, Component.isString, { key: "filter.id" })
        Component.test({options: filter.options}, Component.isArr, { key: "filter.options" })
        Component.test({filter: filter.filter}, Component.isFunction, { key: "filter.filter" })
        
        Component.test({label: filter.label}, Component.isString, { key: "filter.label", nullable: true })
        Component.test({isNullable: filter.isNullable}, Component.isBool, { key: "filter.isNullable", nullable: true })
        Component.test({parentId: filter.parentId}, Component.inArr, { checkArr: this.#getColumnKeys(this.columnList), key: "filter.parentId", nullable: true })
        Component.test({linkedColumn: filter.linkedColumn}, Component.inArr, { checkArr: this.#getColumnKeys(this.columnList), key: "filter.linkedColumn", nullable: true })
        
        this.#filterList.push(filter)
        return this
    } 

    /**
     * Function for sorting data. Supports strings, int, and date formats
     * @param {string} type Matches a key from data
     * @param {string} direction asc or desc
     */
    #sort({ key=this.sortKey, direction=this.sortDirection, data }) {
        data.sort((a, b) => {
            const trueValue = (value) => { return direction == DataGrid.SORT_DIRECTIONS.desc ? value * -1 : value }
        
            const getValue = (data) => {
                const column = this.columnList.find(column => column.key === key)
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
 
 export default DataGrid
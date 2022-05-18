/**
 * @file Component.js contains the base class for all components
 * @author Tyler Riffle
 * @version 1.0.0
 * @since 10/11/2021
 */

/**
 * @memberof Component
 * @typedef {Object} Event Used to add event listeners to components
 * @property {String} type type of event to listen for
 * @property {String} section section of the component to link the event to
 * @property {Function} callback callback function for the event
 * @property {String[]} data_keys keys for data points to be added to section data attributes
 */

/**
 * content, icon, keybind
 * @memberof Component
 * @typedef {Object} ContextMenuItem Item to be shown in the context menu
 * @property {String} [type] Type of menu item - print, edit, save, download
 * @property {String} [content] Text to display
 * @property {String} [icon] Ascii or unicode icon to display
 * @property {String} [keybind] Key bind for the menu item - example: ctrl+p
 */

/**
 * @memberof Component
 * @typedef {Object} Styles
 * @property {Boolean} [isBordered=false] Determines if the grid has a border
 * @property {Boolean} [isRounded=true] Determines if the grid and some elements have rounded corners
 */

/**
 * @memberof Component
 * @typedef {Object} Changelog
 * @property {Function} callback function to call with data
 * @property {Object} data data to get passed to the callback function
 * @property {Component} component component to undo the change on
 */

/**
 * Base class for all client JS components
 */
class Component {

    /**
     * @memberof Component
     * @static
     * @var {Object} RENDER_TYPES Object of the available render types
     */
    static RENDER_TYPES = { full: "full", partial: "partial" }

    /**
     * @memberof Component
     * @static
     * @var {Object} THEME Built in themes for components
     */
    static THEME = { 
        light: "component-light-theme",
        dark: "component-dark-theme"
    }

    /**
     * @memberof Component
     * @static
     * @var {Object} CONTEXT_MENU_TYPES Available built in context menu types
     */
    static CONTEXT_MENU_TYPES = {
        print: { content: "Print", keybind: "ctrl+p" }, //, icon: "📄" },
        edit: { content: "Edit" }, //, icon: "✏️" },
        undo: { content: "Undo", keybind: "ctrl+z" }, //, icon: "✏️" },
        download: { content: "Download", keybind: "ctrl+d" }, //, icon: "📥" },
        save: { content: "Save", keybind: "ctrl+s" }, //, icon: "💾" }
    }

    #controlHeld

    /**
     * Create new Component
     * @param {HTMLElement} container Location for the component to render
     * @param {Styles} [styles={}] Determines what styles are used for the component
     * @param {Theme} [theme=light] Theme for the component
     * @param {Actions} [actions] Object determining what action events are linked 
     */
    constructor({
        container,
        styles={},
        theme=Component.THEME.light,
        actions={}
    } = {}) {

        if (!(container instanceof HTMLElement)) throw new Error("Container is not an instance of an HTMLElement")
        this.container = container
        this.container.classList.add("component-container")
        
        Component.test({actions}, Component.isObj, { type: "object" })
        for (let key of Object.keys(actions)) {
            Component.test({key: actions[key]}, Component.isBool, { type: "boolean", key: `actions.${key}` })
        }
        this.actions = {
            print: actions.print ?? false,
            save: actions.save ?? false,
            edit: actions.edit ?? false,
            undo: actions.undo ?? false,
            download: actions.download ?? false
        }

        

        Component.test({styles}, Component.isObj, { type: "object" })
        for (let key of Object.keys(styles)) {
            Component.test({key: styles[key]}, Component.isBool, { type: "boolean", key: `styles.${key}` })
        }
        this.styles = {
            bordered: styles.isBordered ?? false,
            rounded: styles.isRounded ?? false
        }

        Component.test({theme}, Component.isString)
        document.documentElement.className = theme
        
        this.eventListeners = []
        this.changelog = []
        this.contextMenuElem = null
        this.editCallback = (item, value) => console.log("Value was changed", item, value)

        this.#controlHeld = null
    }

    /** 
     * Function to check if value is boolean
     * @static
     * @param {Any} value value to check
     * @returns {Boolean}
     */
    static isBool(value) { return typeof value === "boolean" }

    /**
     * Function to check if value is a string
     * @static
     * @param {Any} value value to check
     * @returns {Boolean}
     */
    static isString(value) { return (value instanceof String || typeof value === "string") }

    /**
     * Function to check if value is an array
     * @static
     * @param {Any} value value to check
     * @returns {Boolean}
     */
    static isArr(value) { return value instanceof Array }

    /**
     * Function to check if value is an object
     * @static
     * @param {Any} value value to check
     * @returns {Boolean}
     */
    static isObj(value) { return (value instanceof Object || typeof value === "object") }

    /**
     * Function to check if value is a function
     * @static
     * @param {Any} value value to check
     * @returns {Boolean}
     */
    static isFunction(value) { return (value instanceof Function || typeof value === "function") }

    /**
     * Function to check if value is in given array
     * @static
     * @param {Any} value value to check
     * @param {Array} arr array to check for value
     * @returns {Boolean}
     */
    static inArr(value, arr) { return arr.includes(value) }

    /**
     * Error testing for data types and if data is undefined
     * @static
     * @param {Object} data Object with one key, value pair
     * @param {Function} testFunction Function test data against 
     * @param {String} [type=string] Type to show in error
     * @param {Boolean} [nullable=false] Determines if the value can be null|false|undefined
     */
    static test(data, testFunction, { type="string", nullable=false, checkArr=null, key=null } = {}) {
        const KEY = Object.keys(data)[0]
        if (nullable && (data[KEY] == undefined || data[KEY] == null)) return
        if (data[KEY] == undefined || data[KEY] == null) throw new Error(`Missing ${key ?? KEY}`)
        if (!testFunction(data[KEY], checkArr)) {
            if (!checkArr) throw new Error(`Invalid type ${typeof data[KEY]}. ${key ?? KEY} must be type ${type}.`)
            else throw new Error(`Invalid ${key ?? KEY} - "${data[KEY]}". Valid options: ${checkArr.toString()}`)
        }
    }

    /**
     * Function called to build the context menu
     * @param {ContextMenuItem[]} contextMenu Items to create context menu from
     */
    contextMenu(contextMenu = []) {
        if (contextMenu.length === 0) return
        Component.test({contextMenu}, Component.isArr, { type: "array" })
        this.contextMenuElem = Component.createElement({ classAttr: "component-context-menu" })
        if (this.styles.rounded) this.contextMenuElem.classList.add("rounded")
            
        for (let item of contextMenu) {
            this.contextMenuElem.appendChild(this.#buildContextMenuItem(item))
        }
        
        document.body.appendChild(this.contextMenuElem)

        return this
    }

    /**
     * Takes in a string and returns the keybind in a uniform format for context menu
     * @param {String} keybind Keybind to format
     * @returns {String} Keybind in correct format for context menu
     */
    #buildKeybind(keybind) {
        if (!keybind) return
        let sections = keybind.split("+")
        sections = sections.map(item => item = item.trim().toUpperCase() )
        return sections.join(" + ")
    }

    /**
     * Used to create context menu items
     * @param {ContextMenuItem} menuItem 
     * @returns {HTMLElement} Element for a context menu item
     */
    #buildContextMenuItem({ content, icon, keybind, type }) {
        if (Object.keys(Component.CONTEXT_MENU_TYPES).includes(type)) {
            content = Component.CONTEXT_MENU_TYPES[type].content
            icon = Component.CONTEXT_MENU_TYPES[type].icon
            keybind = Component.CONTEXT_MENU_TYPES[type].keybind
        }
        else Component.test({content}, Component.isString)
        
        const dataset = {}
        if (type) dataset.type = type
        if (icon) dataset.icon = icon
        if (keybind) dataset.keybind = this.#buildKeybind(keybind)
        
        return Component.createElement({
            classAttr: "component-context-menu-item component-grid",
            content,
            dataset
        })
    }

    /**
     * Function used by classes that extend this one to render base component items
     */
    render() {
        if (this.styles.bordered) this.container.classList.add("component-bordered")
        if (this.styles.rounded) this.container.classList.add("component-rounded")

        const SELECT_ELEMS = this.container.querySelectorAll("select.component-select")
        for (let select of SELECT_ELEMS) {
            new CustomSelect(select).render()
        }
    }

    /**
     * Adds event listeners to component
     * @param {Event} event Event data to add
     * @returns {Object} 
     */
    addEventListener({ type="click", section, callback, data_keys } = {}) {
        if (!callback) throw new Error("Missing callback for eventListener")
        if (!(callback instanceof Function)) throw new Error("Missing callback must an instance of Function")
        if (!section) throw new Error("Missing section specification to link event to")
        this.eventListeners.push({ type, section, callback, data_keys })
        return this
    }

    /**
     * Adds data to the changelog
     * @param {Changelog} changelog Type and data to store
     */
    addChangelog(changelog) {
        this.changelog.push(changelog)
        console.log(this.changelog)
    }

    /**
     * Undo last change
     */
    undoChangelog() {
        const CHANGE = this.changelog.pop()
        if (!CHANGE) return
        CHANGE.callback(CHANGE)
    }

    /**
     * Used to create elements
     * @param  {String} [element=div] String of element name to be created
     * @param  {String} [classAttr] String of classes to add to element
     * @param  {String} [id] String to use as the id of the element
     * @param  {Object[]} [dataset] Values to assign to data attributes
     * @param  {String} [content] Text to put inside the element
     * @param  {Object[]} [attrSet] Other attributes that need to be added to element
     */
    static createElement({ element = "div", classAttr, id, dataset, content, attrSet } = {}) {
        const ELEM = document.createElement(element)
        if (element === "button") ELEM.setAttribute("type", "button")
        if (classAttr) ELEM.setAttribute("class", classAttr)
        if (id) ELEM.setAttribute("id", id)
        if (dataset) {
            for (let key of Object.keys(dataset)) {
                ELEM.dataset[key] = dataset[key]
            }
        }
        if (content) ELEM.innerHTML = content
        if (attrSet) {
            for (let attr of Object.keys(attrSet)) {
                if (!attrSet[attr]) ELEM.removeAttribute(attr)
                else ELEM.setAttribute(attr, attrSet[attr])
            }
        }
    
        return ELEM
    }

    /**
     * Used to turn a string into querySelector string with multiple classes
     * @static
     * @param {String} str String to split on spaces
     * @returns {String} String split on spaces and then joined by .
     */
    static makeQuerySelector(str) {
        return `.${str.split(" ").join(".")}`
    }

    /**
     * Links all events from this.eventListeners to elements based on linkSections param
     * @param {Event[]} linkSections Array of event objects that get looped through and linked to the component sections
     */
    linkEvents({ renderType, linkSections }) {
        for (let event of this.eventListeners) {
            this.container.querySelectorAll(Component.makeQuerySelector(linkSections[event.section])).forEach(item => {
                item.addEventListener(event.type, (e) => {
                    return event.callback(e, e.target.closest(Component.makeQuerySelector(linkSections[event.section])))
                })
            })
        }

        if (renderType === Component.RENDER_TYPES.full) {
            document.addEventListener("click", e => {
                if (this.contextMenuElem && !e.target.closest(".component-context-menu")) this.contextMenuElem.classList.remove("active")
            })

            if (this.contextMenuElem) {
                this.container.addEventListener('contextmenu', e => {
                    e.preventDefault();
    
                    if (this.actions.edit) {
                        const editBtn = this.contextMenuElem.querySelector("[data-type='edit']")
                        if (editBtn) {
                            this.contextMenuTarget = e.target
                            if (e.target.dataset.editable == "true") editBtn.classList.remove("disabled")
                            else editBtn.classList.add("disabled")
                        }

                        const undoBtn = this.contextMenuElem.querySelector("[data-type='undo']")
                        if (undoBtn) {
                            if (this.changelog.length != 0) undoBtn.classList.remove("disabled")
                            else undoBtn.classList.add("disabled")
                        }
                    }
    
                    this.contextMenuElem.setAttribute("style", this.#getPositionStyle({ x: e.x, y: e.y, element: this.contextMenuElem }))
                    this.contextMenuElem.classList.add("active")
                }, false);

                if (this.actions.edit) {
                    this.contextMenuElem.querySelector("[data-type='edit']").addEventListener("click", () => {
                        this.contextMenuElem.classList.remove("active")
                        const DISPLAY = this.contextMenuTarget.style.display
                        this.contextMenuTarget.style.display = "none";
                        const INPUT = Component.createElement({
                            element: "input",
                            attrSet: {
                                type: "text",
                                value: this.contextMenuTarget.innerText
                            },
                            classAttr: "component-input"
                        })
                        this.contextMenuTarget.parentNode.insertBefore(INPUT, this.contextMenuTarget)
                        INPUT.select()
                        INPUT.addEventListener("blur", () => {
                            this.editCallback(this.contextMenuTarget, INPUT, DISPLAY)
                        })
        
                        INPUT.addEventListener("keyup", e => { if (e.keyCode === 13) INPUT.blur() });
                    })

                    if (this.actions.undo) {
                        this.contextMenuElem.querySelector("[data-type='undo']").addEventListener("click", () => {
                            this.contextMenuElem.classList.remove("active");
                            this.undoChangelog()
                        })

                        document.addEventListener("keydown", e => {
                            if (e.code === "KeyZ" && this.#controlHeld) this.undoChangelog()
                        })
                    }
                }
            }

            document.addEventListener("keydown", e => {
                if (e.code === "ControlLeft") this.#controlHeld = true
                if (this.#controlHeld) {
                    if (this.actions.print && e.code === "KeyP") {
                        e.preventDefault();
                        alert("print the page")
                    }
                    if (this.actions.print && e.code === "KeyS") {
                        e.preventDefault();
                        console.log("SAVE", this.data)
                    }
                    if (this.actions.print && e.code === "KeyD") {
                        e.preventDefault();
                        console.log("DOWNLOAD", this.data)
                    }
                }
            })

            document.addEventListener("keyup", e => {
                if (e.code === "ControlLeft") this.#controlHeld = false
            })
        }

    }

    /**
     * Gets the correct element based on the querySelector provided to the event
     * @deprecated No longer called by event
     * @param {HTMLElement} elem Html element that is checked to see if it is the element that was clicked on
     * @param {String} classStr String of classes used to determine if the current element if the correct element
     * @returns {HTMLElement} Element matching the requested classlist
     */
    correctElement(elem, classStr) {
        let classList = []
        elem.classList.forEach(str => classList.push(str))
        if (classList.join(" ") == classStr) return elem
        return this.correctElement(elem.parentNode, classStr)
    }

    /**
     * Determines the position of the element and the transform origin
     * @param {Number} x X coordinate
     * @param {Number} y Y coordinate
     * @param {HTMLElement} element element to display
     * @returns {String} Style string for element
     */
    #getPositionStyle({ x, y, element }) {
        let verticalStyle = "top", horizontalStyle = "left"

        if (window.innerWidth <= (element.clientWidth + x)) {
            x = x - element.clientWidth;
            horizontalStyle = "right";
        }

        if (window.innerHeight <= (element.clientHeight + y)) {
            y = y - element.clientHeight;
            verticalStyle = "bottom";
        }
        
        return `top: ${y}px; left: ${x}px; transform-origin: ${verticalStyle} ${horizontalStyle}`
    }

    /**
     * Gets the content for given item, if function runs function with give n data
     * @static
     * @param {String|Function} item item to check if is a function
     * @param {Any} [data=null] Data to get passed to function if item is a function
     * @returns {String}
     */
    static getContent(item, data=null) {
        return item instanceof Function ? item(data) : item
    }
}


/**
 * Class for creating a custom select element
 */
export class CustomSelect {
    /**
     * @param {HTMLSelectElement} select Select to replace
     */
    constructor(select) {
        if (!(select instanceof HTMLSelectElement)) throw new Error("select must be instance of HTMLSelectElement")
        this.select = select
        this.optionElems = this.select.querySelectorAll("option")
        this.activeOption = this.select[this.select.selectedIndex]

        this.dropdown = Component.createElement({ classAttr: "dropdown" })
        this.customSelect = Component.createElement({ element: "button", content: this.activeOption.textContent, classAttr: "dropdown-select-btn" })
        this.dropdown.appendChild(this.customSelect)
        this.optionsContainer = Component.createElement({ classAttr: "dropdown-item dropdown-select-item" })
        this.dropdown.appendChild(this.optionsContainer)
        
        this.longestValue = 0
        
        this.select.addEventListener("change", () => this.update())
    }

    /**
     * Renders the custom select on the screen in place of the given select
     * @returns {HTMLElement} Element rendered containing the new select
     */
    render() {
        this.addOptions()
        this.dropdown.style.width = `${8 * this.longestValue + 45}px`
        this.select.parentNode.insertBefore(this.dropdown, this.select)
        this.select.style.display = "none"
        this.linkOptionsEvent()

        document.addEventListener("click", e => this.toggleDropdown(e))

        return this.dropdown
    }

    /**
     * Function called when the select value is updated to update the custom select
     */
    update() {
        this.activeOption = this.select[this.select.selectedIndex]
        this.customSelect.innerText = this.activeOption.textContent

        this.addOptions()
        this.linkOptionsEvent()
    }

    /**
     * Function called when the document is clicked to handle display for the custom select dropdown
     * @param {Event} e 
     */
    toggleDropdown(e) {
        let visible = false
        if (!this.customSelect.classList.contains("active") && e.target.closest(".dropdown-select-btn") === this.customSelect) visible = true

        if (visible) {
            this.customSelect.classList.add("active")
            this.optionsContainer.classList.add("active")
        }
        else {
            this.customSelect.classList.remove("active")
            this.optionsContainer.classList.remove("active")
        }
    }

    /**
     * Adds the custom option elements to the custom select
     */
    addOptions() {
        this.optionsContainer.innerHTML = ""
        for (let option of this.optionElems) {
            if (this.longestValue < option.text.length) this.longestValue = option.text.length
            this.optionsContainer.appendChild(Component.createElement({
                element: "button",
                dataset: {
                    id: this.select.id,
                    selectValue: option.value
                },
                content: option.text,
                classAttr: this.activeOption === option ? "select-selected" : undefined
            }))
        }
    }

    /**
     * Call to add event listener to custom options
     */
    linkOptionsEvent() {
        this.optionsContainer.querySelectorAll("button[data-select-value]").forEach(option => {
            option.addEventListener("click", e => {
                this.select.value = e.target.dataset.selectValue
                this.activeOption = e.target

                this.select.dispatchEvent(new Event('change'))
            })
        })
    }
}

/**
 * Class to create custom checkbox dropdowns
 */
export class CheckboxDropdown {
    constructor({ container, items, btnText, id, callback }) {
        this.container = container
        this.callback = callback
        this.id = id

        this.dropdown = Component.createElement({ classAttr: "dropdown" })
        this.actionBtn = Component.createElement({ element: "button", content: btnText, classAttr: "component-btn" + " dropdown-btn", dataset: { active: "false", target: id } })
        this.dropdown.appendChild(this.actionBtn)

        this.checkboxes = new Map()

        this.itemsContainer = Component.createElement({ classAttr: "grid-column-select-container dropdown-item dropdown-multi-item", id })
        for (let item of items) {
            const CONTAINER = Component.createElement({ classAttr: "flex-container" })
            const CHECKBOX = Component.createElement({
                element: "input",
                attrSet: {
                    checked: item.active,
                    type: "checkbox",
                    value: item.value
                },
                id: `checkbox_${item.id}`
            })
            this.checkboxes.set(item.id, { value: item.value, checked: item.active })
            CONTAINER.appendChild(CHECKBOX)
            CHECKBOX.addEventListener("change", e => this.checkboxEvent(e))

            CONTAINER.appendChild(Component.createElement({
                element: "label",
                content: item.text,
                attrSet: { for: `checkbox_${item.id}` }
            }))
            this.itemsContainer.appendChild(CONTAINER)
        }
        

        document.addEventListener("click", e => this.toggleDropdown(e))
    }

    /**
     * Function to render custom checkbox dropdown
     */
    render() {
        this.dropdown.appendChild(this.itemsContainer)
        this.container.appendChild(this.dropdown)
    }

    /**
     * Function called when the document is clicked to handle display for the custom dropdown
     * @param {Event} e 
     */
    toggleDropdown(e) {
        if (e.target.closest(".dropdown-multi-item") === this.itemsContainer) return
        
        let visible = false
        if (e.target.closest(`[data-target=${this.id}]`) === this.actionBtn && !this.actionBtn.classList.contains("active")) visible = true

        if (visible) {
            this.actionBtn.classList.add("active")
            this.itemsContainer.classList.add("active")
        }
        else {
            this.actionBtn.classList.remove("active")
            this.itemsContainer.classList.remove("active")
        }
    }

    /**
     * Function called when a checkbox value is changed
     * @param {Event} e 
     */
    checkboxEvent(e) {
        this.checkboxes.set(e.target.id, { value: e.target.value, checked: e.target.checked })
        if (this.callback) this.callback(e.target)
    }

    /**
     * Function to get all data for the checkboxes
     * @returns {Object} Data for all the checkboxes on the dropdown
     */
    getCheckboxData() {
        return this.checkboxes
    }
}

export default Component
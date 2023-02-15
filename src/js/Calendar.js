/**
 * @file Calendar.js File containing the calendar class
 * @author Tyler Riffle
 * @since 10/22/2021
 */

import Component from "./Component.js"

/**
 * @memberof Calendar
 * @typedef {Object} Holiday
 * @property {String} name Name of the holiday
 * @property {Number} month Month the hiliday is in
 * @property {Number} [weekday] Day of the week that the holiday occurs
 * @property {Number} [week] Week the holiday occurs 
 * @property {Number} [day] Day of the month the holiday occurs
 */

/**
 * @memberof Calendar
 * @typedef {Object} Event
 * @property {String} name Name of the Event
 * @property {Number} [month] Month the event is in
 * @property {Number} [weekday] Day of the week that the event starts
 * @property {Number} [week] Week the event starts 
 * @property {Number} [day] Day of the month the event starts
 * @property {Number} [year] Year the event starts
 * @property {Time} [startTime] Time the events starts
 * @property {Time} [endTime] Time the events ends
 * @property {Boolean} [recurring] Determines is the event should reaccure
 * @property {Boolean} [allDay] Determines if the event is an all day event
 */

/**
 * Class for creating a calendar component
 * @extends Component
 * @see Calendar.Event
 * @see Calendar.EventConfig
 */
class Calendar extends Component {

    static FORMAT = { long: "long", short: "short", picker: "picker" }

    static TYPE = {
        default: "default",
        scheduler: "scheduler",
        picker: "picker"
    }

    static #LABELS = {
        months: {
            long: ["January","February","March","April","May","June","July", "August","September","October","November","December"],
            short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct", "Nov", "Dec"],
            picker: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct", "Nov", "Dec"]
        },
        weekdays: {
            long: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            short: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            picker: ["S", "M", "T", "W", "Th", "F", "S"]
        }
    }

    static #DEFAULT_HOLIDAYS = [
        {
            name: "Martin Luther King, Jr. Day",
            month: 0,
            occurance: 2,
            weekday: 1
        },
        {
            name: "President's Day",
            month: 1,
            occurance: 2,
            weekday: 1
        },
        {
            name: "Daylight Savings Time Begins",
            month: 2,
            occurance: 1,
            weekday: 0
        },
        {
            name: "Mother's Day",
            month: 4,
            occurance: "last",
            weekday: 0
        },
        {
            name: "Father's Day",
            month: 5,
            occurance: 2,
            weekday: 0
        },
        {
            name: "Labor Day",
            month: 8,
            occurance: 0,
            weekday: 1
        },
        {
            name: "Columbus Day",
            month: 9,
            occurance: 1,
            weekday: 1
        },
        {
            name: "Halloween",
            month: 9,
            day: 31
        },
        {
            name: "Daylight Savings Time Ends",
            month: 10,
            occurance: 0,
            weekday: 0
        },
        {
            name: "Thanksgiving Day",
            month: 10,
            occurance: 3,
            weekday: 4
        },
        {
            name: "Christmas",
            month: 11,
            day: 25
        }
    ]

    #selectedDates = []
    #clearBtn
    #confirmBtn
    #pickerBtn
    #display = true
    #dayCallback
    
    /**
     * @param {Number} [month=new Date().getMonth()] Month the calender start on
     * @param {Number} [day=new Date().getDate()] Month the calender start on
     * @param {Number} [year=new Date().getFullYear()] Month the calender start on
     * @param {Calendar.FORMAT} [format=Calendar.FORMAT.long] Month the calender start on
     * @param {Boolean} [defaultHolidays=true] Determines if the builting holidays should be displayed
     * @param {Holiday[]} [holidays] Array of holidays to display on the calendar
     * @param {Event[]} [events] Array of events to display on the calendar
     * @param {Calendar.TYPE} [type=Calendar.TYPE.default] Used to determine calendar type
     * @param {Boolean} [readOnly=false] Determines if events and reservations have CRUD interactions
     */
    constructor({
        container,
        styles,
        contextMenu,
        theme,
        month=new Date().getMonth(),
        day=new Date().getDate(),
        year=new Date().getFullYear(),
        format=Calendar.FORMAT.long,
        defaultHolidays=true,
        holidays=[],
        events=[],
        type=Calendar.TYPE.default,
        readOnly=false
    } = {}) {

        super({ container, styles, contextMenu, theme })

        Component.test({ month }, Number.isInteger, { type: "number" })
        this.month = month

        Component.test({ day }, Number.isInteger, { type: "number" })
        this.day = day

        Component.test({ year }, Number.isInteger, { type: "number" })
        this.year = year

        Component.test({ format }, Component.isString)
        this.format = format

        Component.test({ defaultHolidays }, Component.isBool, {type: "boolean"})
        this.defaultHolidays = defaultHolidays

        Component.test({ holidays }, Component.isArr, {type: "array"})
        this.holidays = holidays

        Component.test({ events }, Component.isArr, {type: "array"})
        this.events = events

        Component.test({ type }, Component.inArr, { type: "string", checkArr: Object.values(Calendar.TYPE)})
        this.type = type

        if (this.type == Calendar.TYPE.scheduler) this.#dayCallback = this.#schedulerCallback

        if (this.type == Calendar.TYPE.picker) {
            this.#dayCallback = this.#pickerCallback
            this.format = Calendar.FORMAT.picker
            this.#display = false
            this.defaultHolidays = false
        }

        Component.test({ readOnly }, Component.isBool, { type: "boolean" })
        this.readOnly = readOnly

        /**
         * @event confirm
         * @description Fired when user clicks confirm button for scheduler
         * @memberof Calendar
         */
        this.calendarSchedulerEvent = new CustomEvent("confirm", { detail: { dates: this.#selectedDates } })

        /**
         * @event change
         * @description Fired when user chooses date in picker
         * @memberof Calendar
         */
        this.calendarPickerEvent = new CustomEvent("change", { detail: { date: this.#selectedDates } })

        /**
         * @event renderComplete
         * @description Fired when calendar has completed its render process
         * @memberof Calendar
         */
        this.calendarCompleteEvent = this.#calendarRenderEvent()
    }

    #calendarRenderEvent() {
        return new CustomEvent("renderComplete", {
            detail: {
                month: this.month,
                year: this.year
            }
        })
    }

    #getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate() }
    #getStartWeekDay(year, month) { return new Date(year, month, 1).getDay() }
    #isToday(year, month, day) { return day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear() }
    #isWeekend(weekday) { return weekday === 0 || weekday === 6 }

    #getPreviousMonthYear(month, year) {
        month--
        if (month < 0) {
            month = 11
            year--
        }
        return { month, year }
    }

    #getNextMonthYear(month, year) {
        month++
        if (month > 11) {
            month = 0
            year++
        }
        return { month, year }
    }

    #isDateBetween(dateFrom, dateTo, date) { return dateFrom <= date && date <= dateTo }

    #datesEqual(dateOne, dateTwo) { return dateOne.getTime() == dateTwo.getTime() }

    #getHolidayContent({ month, day, year, holidays = Calendar.#DEFAULT_HOLIDAYS, weekday } = {}) {
        let holidayContent = ""

        weekday = weekday === undefined ? new Date(year, month, day).getDay() : weekday

        holidays = holidays.filter(holiday => {
            if (holiday.month != month) return false
            if (holiday.day != undefined && holiday.day != day) return false
            if (holiday.occurance != undefined && holiday.occurance != this.#getWeekdayOccurance({ month, day, year, weekday })) return false
            if (holiday.weekday != undefined && holiday.weekday != weekday) return false
            return true
        })
        
        if (holidays.length != 0) {
            holidayContent += `<div class="calendar-holiday-container">`
            for (let holiday of holidays) {
                holidayContent += `<div class="calendar-holiday">${holiday.name}</div>`
            }
            holidayContent += "</div>"
        }   

        return holidayContent
    }

    #getEventContent({ month, day, year }) {
        const EVENTS = this.events.sort((a, b) => {
            if (a.allDay === b.allDay) return a.startTime > b.startTime ? 1 : -1
            return a.allDay == true && !b.allDay ? -1 : 1
        }).filter(event => {
            if (event.month === month && event.year === year && event.day === day) return true
            if (event.recurring && day === event.day) return true
            if (event.recurring && event.week == this.#getWeekdayOccurance({ month, year, day }) && event.weekday == new Date(year, month, day).getDay()) return true
            return false
        })

        if (EVENTS.length === 0) return ""
        
        let eventContent = `<div class="calendar-event-container">`
        for (let event of EVENTS) {
            const STYLE = `style="--event-bg: ${event.bgColor ?? "#96ccff"}; --event-color: ${event.color ?? "#001b44"}"`
            const ALL_DAY = event.allDay ? "data-all-day='true'" : ""
            if (event.endDay === day) content += " - End"
            eventContent += `<div id="${this.events.indexOf(event)}" class="calendar-event" ${STYLE} ${ALL_DAY}>${event.name}</div>`
        }
        return eventContent += "</div>"
    }

    #getWeekNumber({ month, day, year }) {
        const startDay = this.#getStartWeekDay(year, month)
        return Math.ceil((day + startDay) / 7) - 1;
    }

    #getWeekdayOccurance({ month, day, year, weekday } = {}) {
        weekday = weekday ?? new Date(year, month, day).getDay()
        const WEEK_NUMBER = this.#getWeekNumber(({ month, day, year }))
        const START_WEEKDAY = this.#getStartWeekDay(year, month)

        if (START_WEEKDAY > weekday) return WEEK_NUMBER - 1
        return WEEK_NUMBER
    }

    addEvent(event) {
        if (!event.name) throw new Error("Event missing name param")
        this.events.push(event)
    }

    render(renderType=Component.RENDER_TYPES.full) {
        // Parial render
        if (renderType == Component.RENDER_TYPES.partial) {
            this.#renderBody()
        }
        // Full render
        else {
            this.container.innerHTML = ""
            this.calendar = Component.createElement({ classAttr: `calendar ${!this.#display ? "calendar-hidden" : ""}` })
            
            // Adds parent style for picker
            if (this.format === Calendar.FORMAT.picker) {
                this.container.classList.add("calendar-container")
                this.#renderPickerBtn()
                this.container.classList.add("calendar-picker")
            }
            
            // Creates calendar header section
            this.headerContainer = Component.createElement({ classAttr: "calendar-header" })
            this.calendar.appendChild(this.headerContainer)
            this.#renderHeader()
            
            // Creates calendar weekday section
            this.dayLabelContainer = Component.createElement({ classAttr: "calendar-weekday"})
            this.calendar.appendChild(this.dayLabelContainer)
            this.#renderDayLabels()
            
            // Creates calendar body section
            this.body = Component.createElement({ classAttr: "calendar-body"})
            this.calendar.appendChild(this.body)
            this.#renderBody()
            
            // Creates calendar footer section
            if (this.type === Calendar.TYPE.scheduler) {
                this.footer = Component.createElement({ classAttr: "calendar-footer" })
                this.calendar.appendChild(this.footer)
                this.#renderFooter()
            }
        }
        
        this.container.appendChild(this.calendar)
        this.#linkEvents(renderType)

        this.container.dispatchEvent(this.#calendarRenderEvent())
    }
    
    /**
     * Renders button for picker
     */
    #renderPickerBtn() {
        this.#pickerBtn = Component.createElement({
            element: "button",
            classAttr: "calendar-picker-btn component-btn",
            content: "Select Date"
        })
        this.container.appendChild(this.#pickerBtn)
    }

    /**
     * Renders components for the header
     */
    #renderHeader() {
        this.headerContainer.innerHTML = ""

        const MONTH = Component.createElement({ classAttr: "calendar-month", content: `${Calendar.#LABELS.months[this.format][this.month]} ${this.year}` })
        this.headerContainer.appendChild(MONTH)
        
        const BTN_CONTAINER = Component.createElement({ classAttr: "calendar-header-btn-container"})

        if (!this.readOnly && this.type != Calendar.TYPE.picker) this.addEventBtn = Component.createElement({ element: "button", classAttr: "component-btn calendar-btn", content: "Add Event" })

        this.prevBtn = Component.createElement({ element: "button", classAttr: "component-btn calendar-btn", content: "🡸" })
        this.todayBtn = Component.createElement({ element: "button", classAttr: "component-btn calendar-btn", content: "Today" })
        this.nextBtn = Component.createElement({ element: "button", classAttr: "component-btn calendar-btn", content: "🡺" })

        if (this.addEventBtn) BTN_CONTAINER.appendChild(this.addEventBtn)
        BTN_CONTAINER.appendChild(this.prevBtn)
        BTN_CONTAINER.appendChild(this.todayBtn)
        BTN_CONTAINER.appendChild(this.nextBtn)     

        this.headerContainer.appendChild(BTN_CONTAINER)
    }

    /**
     * Renders weekday labels
     */
    #renderDayLabels() {
        this.dayLabelContainer.innerHTML = ""

        for (let label of Calendar.#LABELS.weekdays[this.format]) {
            this.dayLabelContainer.appendChild(Component.createElement({classAttr: "calendar-weekday-label", content: label}))
        }
    }

    /**
     * Used to create the day anchor element
     * @param {Number} day
     * @param {Number} month
     * @param {Number} year 
     * @param {Number} weekday 
     * @param {Boolean} filler 
     * @returns {HTMLAnchorElement} Element used for the day sections
     */
    #createDay({ day, month, year, weekday, filler } = {}) { 
        // Dataset used to get date when clicking on element and to set styles
        let dataset = { day, month, year }
        if (this.#isWeekend(weekday)) dataset.weekend = true
        if (this.#isToday(year, month, day)) dataset.today = true
        if (filler) dataset.filler = true

        // Used when type scheduler to highlisght all dates between the two that were selected
        if (this.type === Calendar.TYPE.scheduler
            && this.#selectedDates.length === 2
            && this.#isDateBetween(this.#selectedDates[0], this.#selectedDates[1], new Date(year, month, day))) {
                dataset.selected = true
            }

        // Used when type picker to highlight the selected date
        if (this.type === Calendar.TYPE.picker
            && this.#selectedDates.length === 1
            && month === this.#selectedDates[0].getMonth()
            && day === this.#selectedDates[0].getDate()
            && year === this.#selectedDates[0].getFullYear()) {
                dataset.selected = true
            } 

        // If default holidays are allowed or holidays were passed in, this section adds them to the day
        let holidayContent = this.defaultHolidays ? this.#getHolidayContent({ month, day, year, holidays: Calendar.#DEFAULT_HOLIDAYS, weekday }) : ""
        holidayContent +=  this.holidays.length != 0 ? this.#getHolidayContent({ month, day, year, holidays: this.holidays, weekday }) : ""

        let eventContent = this.events.length != 0 && this.type != Calendar.TYPE.picker ? this.#getEventContent({ month, day, year }) : ""  

        return Component.createElement({
            element: "a",
            classAttr: (() => {
                let str = "calendar-day"
                if (this.#dayCallback && !this.readOnly) str += " hover"
                return str
            })(),
            content: `<p class="calendar-day-label" ${this.type != Calendar.TYPE.picker && filler ? "data-month='" + Calendar.#LABELS.months.short[month] + "'" : ""}>${day}</p>${eventContent}${holidayContent}`,
            dataset,
            attrSet: this.#dayCallback ? { href: "#" } : {}
        })
    }

    /**
     * Renders main body of the calendar - all the days
     * @param {Number} year 
     * @param {Number} month 
     * @param {Number} day 
     */
    #renderBody({ year=this.year, month=this.month } = {}) {
        this.body.innerHTML = ""

        const TOTAL_DAYS = this.#getDaysInMonth(year, month)
        const START_WEEKDAY = this.#getStartWeekDay(year, month)
        
        let weekday = 0

        // Adds the last few days of the previous month if needed
        while (weekday < START_WEEKDAY) {
            this.body.appendChild(this.#createDay({
                day: new Date(year, month, 1 - START_WEEKDAY + weekday).getDate(),
                month: this.#getPreviousMonthYear(month, year).month,
                year: this.#getPreviousMonthYear(month, year).year,
                weekday,
                filler: true
            }))
            weekday++
        }

        // Adds the days for the current month
        for (let day = 1; day <= TOTAL_DAYS; day++) {
            if (weekday === 7) weekday = 0
            this.body.appendChild(this.#createDay({ day, month, year, weekday }))
            weekday++
        }

        // Adds the first few days of the next month if needed
        let endDate = 1
        while (weekday < 7) {
            this.body.appendChild(this.#createDay({
                day: endDate,
                month: this.#getNextMonthYear(month, year).month,
                year: this.#getNextMonthYear(month, year).year,
                weekday,
                filler: true
            }))
            weekday++
            endDate++
        }

    }

    /**
     * Renders the footer elements
     */
    #renderFooter() {
        this.#clearBtn = Component.createElement({ element: "button", classAttr: "component-btn calendar-btn", content: "Clear" })
        this.footer.appendChild(this.#clearBtn)   

        this.#confirmBtn = Component.createElement({ element: "button", classAttr: "component-btn calendar-btn", content: "Confirm" })
        this.footer.appendChild(this.#confirmBtn)
    }

    /**
     * Callback for day click when the calendar is type scheduler
     * @callback
     * @param {HTMLAnchorElement} day The day element that was clicked
     */
    #schedulerCallback(day) {
        // Adds the date that was clicked
        this.#selectedDates.push(new Date(day.dataset.year, day.dataset.month, day.dataset.day))
        day.dataset.selected = true
        
        // Re-renders the body to included all the dates between the two selected
        if (this.#selectedDates.length == 2) {
            this.render(Component.RENDER_TYPES.partial)
        }
    }

    /**
     * Callback for day click when the calendar is type picker
     * @callback
     * @param {HTMLAnchorElement} day 
     */
    #pickerCallback(day) {
        this.#selectedDates[0] = (new Date(day.dataset.year, day.dataset.month, day.dataset.day))
        this.#display = false
        this.render()
        this.container.dispatchEvent(this.calendarPickerEvent)
    }

    /**
     * Called to link the events to the buttons and the day elements
     * @param {Component.RENDER_TYPES} renderType 
     */
    #linkEvents(renderType) {
        // Full render
        if (renderType === Component.RENDER_TYPES.full) {
            if (this.addEventBtn) this.addEventBtn.addEventListener("click", e => {
                this.container.dispatchEvent(new Event("newEvent"))
            })            

            this.todayBtn.addEventListener("click", e => {
                const TODAY = new Date()
                this.year = TODAY.getFullYear()
                this.month = TODAY.getMonth()
                this.day = TODAY.getDate()
                this.render()
            })

            this.prevBtn.addEventListener("click", e => {
                const {month, year} = this.#getPreviousMonthYear(this.month, this.year)
                this.month = month
                this.year = year
                this.render()
            })

            this.nextBtn.addEventListener("click", e => {
                const {month, year} = this.#getNextMonthYear(this.month, this.year)
                this.month = month
                this.year = year
                this.render()
            })

            if (this.#clearBtn) {
                this.#clearBtn.addEventListener('click', e => {
                    this.#selectedDates = []
                    this.container.dispatchEvent(new Event("clear"))
                    this.render(Component.RENDER_TYPES.partial)
                })
            }
    
            if (this.#confirmBtn) {
                this.#confirmBtn.addEventListener('click', e => {
                    this.container.dispatchEvent(this.calendarSchedulerEvent)
                })
            }

            if (this.#pickerBtn) {
                this.#pickerBtn.addEventListener("click", e => {
                    this.#display = !this.#display
                    this.render()
                })
            }
        }

        // Always run when regardless of render type
        if (this.#dayCallback && !this.readOnly) {
            this.body.querySelectorAll(".calendar-day").forEach(day => {
                day.addEventListener("click", e => {
                    e.preventDefault()
                    if (this.type === Calendar.TYPE.scheduler && this.#selectedDates.length === 2) return
                    this.#dayCallback(day)
                })
            })
        }

        if (this.events.length != 0) {
            this.body.querySelectorAll(".calendar-event").forEach(event => {
                event.addEventListener("click", e => {
                    this.container.dispatchEvent(new CustomEvent("eventClick", { detail: { event: this.events[event.id] }}))
                })
            })
        }
    }
}

export default Calendar
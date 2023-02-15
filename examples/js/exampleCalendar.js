import Calendar from "../components/Calendar.js"
import { EVENTS } from "./data.js"


export function buildCalendar(container) {
    return new Calendar({
        container,
        events: EVENTS,
        // type: Calendar.TYPE.picker,
        // readOnly: true,
        // defaultHolidays: false,
        // format: Calendar.FORMAT.short,
    })
}
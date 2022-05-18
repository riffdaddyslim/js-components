import {buildCalendar} from "./exampleCalendar.js";
import buildGrid from "./exampleGrid.js";

// const GRID = buildGrid(document.getElementById("grid"))
// GRID.render()

// document.getElementById("calendar").addEventListener("renderComplete", e => {
//     console.log(e)
// })

const CALENDAR = buildCalendar(document.getElementById("calendar"))
CALENDAR.render()

// document.getElementById("calendar").addEventListener("change", e => {
//     console.log(e)
// })

// document.getElementById("calendar").addEventListener("confirm", e => {
//     console.log(e)
// })

document.getElementById("calendar").addEventListener("eventClick", e => {
    console.log(e)
})



document.getElementById("toggleTheme").addEventListener("click", e => {
    if (document.documentElement.classList.contains("component-light-theme")) {
        document.documentElement.classList.replace("component-light-theme", "component-dark-theme")
    }
    else if (document.documentElement.classList.contains("component-dark-theme")) {
        document.documentElement.classList.replace("component-dark-theme", "component-light-theme")
    }
})
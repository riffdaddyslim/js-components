export const GRID_DATA = [
    { fname: "Tyler", lname: "Riffle", dob: "09/04/1997", gender: "m", shoe: 15 },
    { fname: "Hannah", lname: "Greeley", dob: "03/19/2000", gender: "f", shoe: 6, additional: { height: { feet: 5, inch: 6 }, hair: "straw-blonde" } },
    { fname: "Mark", lname: "Riffle", dob: "07/18/1976", gender: "m", shoe: 13 },
    { fname: "Olivia", lname: "Riffle", dob: "09/17/2019", gender: "f", shoe: { size: 7, type: "child" }, additional: { height: { feet: 3, inch: 0 }, hair: "blonde" } },
    { fname: "Riley", lname: "Riffle", dob: "09/30/2000", gender: "m", shoe: 16, additional: { height: { feet: 6, inch: 5 }, hair: "brown" } },
    { fname: "Elizabeth", lname: "Riffle", dob: "01/04/1974", gender: "f", shoe: 11 },
    { fname: "Trinity", lname: "Riffle", dob: "01/08/2005", gender: "f", shoe: 10, additional: { height: { feet: 5, inch: 8 }, hair: "blonde" } }
]

export const EVENTS = [
    {
        name: "Test Event 1",
        recurring: true,
        day: 3
    },
    {
        name: "Test Event 2",
        month: 2,
        day: 13,
        year: 2022,
        bgColor: "#9eebcf",
        color: "#137752"
    },
    {
        name: "All Day",
        month: 2,
        day: 13,
        year: 2022,
        allDay: true,
        bgColor: "#9eebcf",
        color: "#137752"
    },
    {
        name: "Test Event 3",
        week: 0,
        weekday: 6, 
        bgColor: "#ffdfdf",
        color: "#e7040f",
        recurring: true
    },
    // {
    //     name: "multi day",
    //     month: 2,
    //     day: 25,
    //     year: 2022,
    //     endDay: 2,
    //     endMonth: 3,
    //     endYear: 2022
    // }
]
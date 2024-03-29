export const GRID_DATA = [
    {
        id: 1,
        fname: "Tyler",
        lname: "Riffle",
        dob: "09/04/1997",
        gender: "m",
        shoe: 15
    },
    {
        id: 2,
        fname: "Hannah",
        lname: "Greeley",
        dob: "03/19/2000",
        gender: "f",
        shoe: 6,
        additional: {
            height: {
                feet: 5,
                inch: 6
            },
            hair: "straw-blonde"
        }
    },
    {
        id: 3,
        fname: "Mark",
        lname: "Riffle",
        dob: "07/18/1976",
        gender: "m",
        shoe: 13
    },
    {
        id: 4,
        fname: "Olivia",
        lname: "Riffle",
        dob: "09/17/2019",
        gender: "f",
        shoe: {
            size: 7,
            type: "child"
        },
        additional: {
            height: {
                feet: 3,
                inch: 0
            },
            hair: "blonde"
        }
    },
    {
        id: 5,
        fname: "Riley",
        lname: "Riffle",
        dob: "09/30/2000",
        gender: "m",
        shoe: 16,
        additional: {
            height: {
                feet: 6,
                inch: 5
            },
            hair: "brown"
        }
    },
    { 
        id: 6,
        fname: "Elizabeth",
        lname: "Riffle",
        dob: "01/04/1974",
        gender: "f",
        shoe: 11
    },
    {
        id: 7,
        fname: "Trinity",
        lname: "Riffle",
        dob: "01/08/2005",
        gender: "f",
        shoe: 10,
        additional: {
            height: {
                feet: 5,
                inch: 8
            },
            hair: "blonde"
        }
    }
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
        year: 2023,
        bgColor: "#9eebcf",
        color: "#137752"
    },
    {
        name: "All Day",
        month: 2,
        day: 3,
        year: 2023,
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
    }
]
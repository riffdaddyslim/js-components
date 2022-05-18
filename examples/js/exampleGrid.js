import DataGrid from "../components/Grid.js"
import { GRID_DATA } from "./data.js"

// function expandContent({rowData, key}) {
//     const CONTENT = rowData[key]
//     return `
//         <p>Height: ${CONTENT.height.feet}'${CONTENT.height.inch}"</p>
//         <p>Hair: ${CONTENT.hair}</p>
//     `
// }

export default function buildGrid(container) {
    return new DataGrid({
        container,
        columnList: [
            { content: (rowData) => { return `${rowData.lname}, ${rowData.fname}` }, key: "name", display: "Last, First", toggleable: false },
            { key: "dob", display: "DOB", width: "100px", sortType: "date" },
            { content: (rowData) => rowData.gender.toUpperCase(), key: "gender", display: "M/F", width: "50px", active: false, validate: (value) => ["m", "f"].includes(value) },
            { content: (rowData) => rowData.shoe instanceof Object ? `${rowData.shoe.size} - ${rowData.shoe.type}` : rowData.shoe, key: "size", display: "Shoe Size", width: "115px", sortType: "int" }
        ],
        // expand: { key: "additional", content: expandContent, expandIconColumn: "name" },
        data: GRID_DATA,
        // dynamicColumns: true,
        // search: true,
        // actions: {
        //     edit: true,
        //     undo: true,
        //     save: true,
        //     download: true,
        //     print: true,
        // },
        // style: DataGrid.STYLE_TYPES.grouped,
        // groupKey: "lname",
        // minWidth: "500px",
        // styles: {
        //     isRounded: true,
        //     isBordered: true,
        //     hasHover: true,
        //     isStriped: true
        // }
    })
    // .addFilter({
    //     id: "Gender",
    //     label: "Gender:",
    //     options: [
    //         { value: "m", content: "Male" },
    //         { value: "f", content: "Female" }
    //     ],
    //     filter(rowData, value) {
    //         return rowData.gender === value
    //     },
    //     linkedColumn: "gender"
    // }).addFilter({
    //     id: "expandable",
    //     label: "IsExpandable:",
    //     options: [
    //         {value: "true", content: "True"},
    //         {value: "false", content: "False"}
    //     ],
    //     filter(rowData, value) {
    //         if (value === "true") return rowData.additional ? true : false
    //         else return rowData.additional ? false : true
    //     }
    // })
    // .contextMenu([
    //     { type: "print" },
    //     { type: "save" },
    //     { type: "download" },
    //     { type: "edit" },
    //     { type: "undo" }
    // ])
}
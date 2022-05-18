const PACKAGE = require("./package.json")
const JSDOC_CONFIG = require("./jsdoc.json")

const express = require("express")
const APP = express()

APP.use("/", express.static("./examples"))
APP.use("/components", express.static("./src/js"))

APP.use("/docs", express.static(`${JSDOC_CONFIG.opts.destination}/${PACKAGE.name}/${PACKAGE.version}`))

APP.listen("8000")
console.log(`App launched at http://localhost:8000`)
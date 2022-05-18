const PACKAGE = require(process.argv.pop())

const UglifyJS = require("uglify-js")
const sass = require("sass")
const fs = require("fs")

const DIST_FOLDER = PACKAGE.compiler?.dist ?? "./dist"
const SRC_FOLDER = PACKAGE.compiler?.src ?? "./src"

if (!fs.existsSync(DIST_FOLDER)) fs.mkdirSync(DIST_FOLDER)
if (!fs.existsSync(`${DIST_FOLDER}/js`)) fs.mkdirSync(`${DIST_FOLDER}/js`)
if (!fs.existsSync(`${DIST_FOLDER}/css`)) fs.mkdirSync(`${DIST_FOLDER}/css`)

const COMPILER = (types=["js"]) => {

    function compileJS(filePath) {
        console.info(`Compiling JS File: ${filePath}`)
        let code = UglifyJS.minify(fs.readFileSync(filePath, {encoding:'utf8', flag:'r'})).code
        return code.replace(/.js/g, ".min.js")
    }

    function compileSCSS(filePath) {
        console.info(`Compiling SCSS File: ${filePath}`)
        return sass.renderSync({ file: filePath, outputStyle: "compressed" }).css.toString()
    }

    for (let type of types) {
        const FILES = fs.readdirSync(`${SRC_FOLDER}/${type}`)
        for (let file of FILES) {
            if (fs.lstatSync(`${SRC_FOLDER}/${type}/${file}`).isDirectory()) continue
            let data, fileType
            switch (type) {
                case "js": data = compileJS(`${SRC_FOLDER}/js/${file}`); fileType = "js"; break;
                case "scss": data = compileSCSS(`${SRC_FOLDER}/scss/${file}`); fileType = "css"; break;
            }
            fs.writeFileSync(`${DIST_FOLDER}/${fileType}/${file.split(".")[0]}.min.${fileType}`, data)
        }
    }
}

COMPILER(PACKAGE.compiler?.types)
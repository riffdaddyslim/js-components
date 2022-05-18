const fs = require("fs")

const APP = (readme_content="") => {
    function parseArgs() {
        const CLI_ARGS = process.argv.slice(2)

        const getArgByFlag = (flag) => {
            const FLAG_INDEX = CLI_ARGS.indexOf(flag)
            if (FLAG_INDEX === -1) return
            return CLI_ARGS[FLAG_INDEX + 1]
        }
    
        const FLAGS = [
            { key: "packagePath", flag: "-p" }
        ]
    
        const ARGS = {}
        for (let item of FLAGS) {
            ARGS[item.key] = getArgByFlag(item.flag)
        }
    
        return ARGS
    }

    const { packagePath } = parseArgs()
    let package
    package = require(packagePath ?? "./package.json")

    function getPackageValue(keys, value=package) {
        value = value[keys[0]]
        keys.shift()
        if (keys.length === 0) return value
        else return getValue(keys, value) 
    }

    function replaceVars(content) {
        if (typeof content != "string") throw new Error(`Content must be type string`)
        
        if (package) {
            const PKG_ITEMS = content.match(/package.\S+/g)
            if (PKG_ITEMS != null) {
                for (let pkgItem of PKG_ITEMS) {
                    const KEYS = pkgItem.split(".").slice(1)
                    content = content.replace(pkgItem, getPackageValue(KEYS))
                }
            }
        } else console.info("Skipping replacing package vars as no package was given")

        content = content.replace("DATE", new Date().toDateString())
        return content
    }

    function getContent(item) {
        let content = ""
        switch (item.type) {
            case "title": content += `# `; break;
            case "h2": content += `## `; break;
            case "footer": content += `*** `; break;
            default: content += ""
        }
        content += replaceVars(item.content)
    
        if (item.type === "footer") return content += "***"
        if (item.break === undefined || item.break === true) content += "\n\n"

        return content
    }

    if (!package.readmeItems) throw new Error(`No items to add to readme`)
    for (let item of package.readmeItems) {
        readme_content += getContent(item)
    }

    try { fs.writeFileSync(package.readme ?? "./readme.md", readme_content) }
    catch(err) { console.error(err) }
}

APP()
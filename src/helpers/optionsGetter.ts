/**
 * Provide parsing of config, based on params secification
 */
export const OptionsGetter = {

    parseOptions(specs, options) {
        Object.keys(specs).forEach(key => options[key] = OptionsGetter[specs[key].type](options, key, specs[key].default, specs[key].enum))
        return options
    },

    int(options, name, def = 0) {
        return parseInt((options[name] || '0') + '') || def
    },

    bool(options, name, def = false) {
        if (name in options && typeof options[name] == 'string') {
            const lc = options[name].toLowerCase().trim()
            if (lc == 'true')
                return true

            if (lc == 'false')
                return false

            if (lc == '0')
                return false
        }

        if (OptionsGetter.int(options, name) > 0)
            return true

        return name in options ? !!options[name] : def
    },

    string(options, name, def, enu = []) {
        let val = name in options ? options[name] : def
        if (enu && enu.length) {
            val = val.trim()
            if (enu.indexOf(val) >= 0)
                return val

            if (enu.indexOf(def) >= 0)
                return def

            return enu[0]
        }

        return val
    },

    rgb(options, name, def = '000000') {
        let val = name in options ? options[name] : def
        val = ('' + val).trim()
        let match
        if (match = val.match(/^\#?([0-9a-f]{6})$/i))
            return match[1].toUpperCase()

        if (match = def.match(/^\#?([0-9a-f]{6})$/i))
            return match[1].toUpperCase()

        return '000000'
    }
}

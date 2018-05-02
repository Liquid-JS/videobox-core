import * as Plyr from 'plyr'
import { parse as parseQuery } from 'query-string'

function parseString(val: any) {
    return ('' + (val || '')).trim()
}

function parseNumber(val: any) {
    const numVal = parseInt(parseString(val))
    if (numVal === 0)
        return 0

    return numVal || null
}

function parseBoolean(val: any) {
    const num = parseNumber(val)

    if (num === 0)
        return false

    if (num)
        return true

    const str = parseString(val).toLowerCase()

    if (str == 'true')
        return true

    if (str == 'false')
        return false

    return !!str
}

const query = parseQuery(window.location.search || '')
query.autoplay = parseBoolean(query.autoplay)
query.start = parseNumber(query.start) || 0
query.end = parseNumber(query.end) || 0

let ended = !(query.end > 0 && query.end > query.start)

const player = new (Plyr.default || Plyr)('#video-element', {
    iconUrl: '/assets/player.svg'
})

player.on('ready', _event => {
    if (query.start > 0)
        player.currentTime = query.start

    player.on('timeupdate', _evt => {
        if (!ended && query.end <= player.currentTime) {
            player.stop()
            ended = true
        }
    })

    if (query.autoplay)
        player.play()
})

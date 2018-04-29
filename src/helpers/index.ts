import * as path from 'path'
import * as request from 'request'
import * as url from 'url'

export * from './generator'
export * from './optionsGetter'

export function checkExtensions(baseUrl: string | url.URL, extensions: string[], mime: true): Promise<{ url: string, mime: string }[]>
export function checkExtensions(baseUrl: string | url.URL, extensions: string[]): Promise<string[]>
export function checkExtensions(baseUrl: string | url.URL, extensions: string[], mime = false) {
    const fileUrl = new url.URL(baseUrl.toString())
    fileUrl.hash = ''
    fileUrl.search = ''
    fileUrl.password = ''
    fileUrl.username = ''
    fileUrl.port = ''

    const extension = path.extname(fileUrl.pathname)
    fileUrl.pathname = fileUrl.pathname.substr(0, fileUrl.pathname.length - extension.length + 1)
    const uniqueExtensions = [...new Set([...extensions, extension.substr(1)])]
    return Promise.all(uniqueExtensions.map(ext =>
        new Promise<{ url: string, mime: string }>((resolve, reject) => {
            request.head(fileUrl.href + ext, (err, res, _body) => {
                if (err)
                    return reject(err)

                if (res.statusCode == 200)
                    return resolve({
                        url: fileUrl.href + ext,
                        mime: (res.headers || {})['content-type'] || ''
                    })

                resolve()
            })
        })
            .catch<any>(err => console.error(err))
    ))
        .then(matches => matches.filter(match => !!match))
        .then(matches => mime ? matches : matches.map(match => match.url))
}

export function splitTime(time = 0) {
    let t = ''
    if (time > 0) {
        t = (time % 60) + 's' + t
        time = Math.floor(time / 60)
    }
    if (time > 0) {
        t = (time % 60) + 'm' + t
        time = Math.floor(time / 60)
    }
    if (time > 0)
        t = time + 'h' + t

    return t
}

export function timeToSeconds(time: string) {
    return time
        .split(':')
        .map(el => '0' + ('' + (el || '')).trim())
        .map(el => parseInt(el) || 0)
        .reverse()
        .reduce((t, el, i) => t + el * Math.pow(60, i), 0)
}

export function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

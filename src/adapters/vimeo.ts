import * as request from 'request'
import { splitTime } from '../helpers'
import { Adapter, AdapterOptions } from './base'

const adapterType = 'vimeo'

export class Vimeo extends Adapter<AdapterOptions> {

    static load(type: string, id: string) {
        if (type == adapterType)
            return new Vimeo({}, id)

        return false
    }

    static parse(options, videoUrl, title = '', start = 0, end = 0) {
        // URL is only numeric
        // e.g. 230564722
        if (
            videoUrl.href
            && videoUrl.href.match(/^\d+$/)
        )
            return new Vimeo(options, videoUrl.href, title, start, end, adapterType)

        // URL is a full vimeo video URL
        // e.g. https://vimeo.com/230564722
        if (
            videoUrl.hostname
            && videoUrl.hostname.match(/^(.*\.)?vimeo\.com$/i)
            && videoUrl.pathname
            && videoUrl.pathname.substr(1).match(/^\d+$/)
        )
            return new Vimeo(options, videoUrl.pathname.substr(1), title, start, end, adapterType)

        return false
    }

    async getThumbnailBaseUrl() {
        return new Promise<string>((resolve, reject) => request.get('http://vimeo.com/api/v2/video/' + this.id + '.json', { encoding: null }, (err, _resp, buff) => {
            if (err)
                return reject(err)

            resolve(JSON.parse(buff)[0].thumbnail_large)
        }))
    }

    async getPlayerUrl() {
        let src = 'https://player.vimeo.com/video/' + this.id + '?byline=0&portrait=0'
        src += '&autoplay=' + (this.options.autoplay ? '1' : '0')
        if (this.options.color)
            src += '&color=' + this.options.color
        if (this.start > 0)
            src += '#t=' + splitTime(this.start)

        return src
    }
}

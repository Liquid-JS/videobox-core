import { Adapter, AdapterOptions } from './base'

const adapterType = 'youtube'

export class YouTube extends Adapter<AdapterOptions> {

    static load(type, id) {
        if (type == adapterType)
            return new YouTube({}, id)

        return false
    }

    static parse(options, videoUrl, title = '', start = 0, end = 0) {
        // URL is only 11 YouTube-style characters
        // e.g. dRBmavn6Wk0
        if (
            videoUrl.href
            && videoUrl.href.match(/^[a-zA-Z0-9_-]{11}$/)
        )
            return new YouTube(options, videoUrl.href, title, start, end, adapterType)

        // URL is a full YouTube video URL
        // e.g. https://www.youtube.com/watch?v=dRBmavn6Wk0
        if (
            videoUrl.hostname
            && videoUrl.hostname.match(/^(.*\.)?youtube\.com$/i)
            && videoUrl.query
            && videoUrl.query.v
            && videoUrl.query.v.match(/^[a-zA-Z0-9_-]{11}$/)
        )
            return new YouTube(options, videoUrl.query.v, title, start, end, adapterType)

        // URL is a short youtu.be sharing URL
        // e.g. https://youtu.be/OfJ-Uz-eEkA
        if (
            videoUrl.hostname
            && videoUrl.hostname.match(/^(.*\.)?youtu\.be$/i)
            && videoUrl.pathname
            && videoUrl.pathname.substr(1).match(/^[a-zA-Z0-9_-]{11}$/)
        )
            return new YouTube(options, videoUrl.pathname.trim('/'), title, start, end, adapterType)

        return false
    }

    async getThumbnailBaseUrl() {
        return 'http://i2.ytimg.com/vi/' + this.id + '/hqdefault.jpg'
    }

    async getPlayerUrl() {
        let src = 'https://www.youtube-nocookie.com/embed/' + this.id + '?rel=0&fs=1'
        src += '&autoplay=' + (this.options.autoplay ? '1' : '0')
        if (this.start > 0)
            src += '&start=' + this.start
        if (this.end > 0)
            src += '&end=' + this.end

        return src
    }
}

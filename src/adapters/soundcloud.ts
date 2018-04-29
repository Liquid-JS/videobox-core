import * as querystring from 'querystring'
import * as request from 'request'
import * as url from 'url'
import { Videobox } from '../core'
import { OptionsGetter } from '../helpers/optionsGetter'
import { Adapter, AdapterOptions } from './base'

const adapterType = 'soundcloud'

const optionsSpecs = {
    visualPlayer: { type: 'bool', default: true }
}

export interface SoundCloudOptions extends AdapterOptions {
    soundCloud?: {
        visualPlayer?: boolean
    }
}

export class SoundCloud extends Adapter<SoundCloudOptions> {

    static load(videobox: Videobox, type: string, id: string) {
        if (type == adapterType)
            return new SoundCloud(videobox, {}, id)

        return false
    }

    static parse(videobox: Videobox, options: SoundCloudOptions, videoUrl: url.UrlWithParsedQuery, title = '', start = 0, end = 0) {
        const splitPath = (videoUrl.pathname || '').split('/').filter(p => !!p)

        // URL is a SoundCloud track URL
        // e.g. https://soundcloud.com/liluzivert/15-xo-tour-llif3
        if (
            videoUrl.hostname
            && videoUrl.hostname.match(/^(.*\.)?soundcloud\.com/i)
            && splitPath.length > 1
        )
            return new SoundCloud(videobox, options, 'https://soundcloud.com/' + splitPath.splice(0, 2).join('/'), title, start, end, adapterType)

        return false
    }

    constructor(videobox: Videobox, options: SoundCloudOptions, id: string, title = '', start = 0, end = 0, type = 'none') {
        options = options || {}
        options.soundCloud = options.soundCloud || {}
        OptionsGetter.parseOptions(optionsSpecs, options.soundCloud)

        super(videobox, options, id, title, start, end, type)
    }

    async getThumbnailBaseUrl() {
        return new Promise<string>((resolve, reject) => request.get('http://soundcloud.com/oembed?format=json&url=' + querystring.escape(this.id), { encoding: null }, (err, _resp, buff) => {
            if (err)
                return reject(err)

            resolve(JSON.parse(buff).thumbnail_url)
        }))
    }

    async getPlayerUrl() {
        let src = 'https://w.soundcloud.com/player/?url=' + querystring.escape(this.id) + '&show_artwork=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false'
        src += '&auto_play=' + (this.options.autoplay ? 'true' : 'false')
        src += '&visual=' + (this.options.soundCloud.visualPlayer ? 'true' : 'false')

        if (this.options.color)
            src += '&color=' + this.options.color

        return src
    }
}

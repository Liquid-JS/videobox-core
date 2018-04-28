import * as querystring from 'querystring'
import * as request from 'request'
import * as url from 'url'
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

    static load(type: string, id: string) {
        if (type == adapterType)
            return new SoundCloud({}, id)

        return false
    }

    static parse(options: SoundCloudOptions, videoUrl: url.URL, title = '', start = 0, end = 0) {
        const splitPath = (videoUrl.pathname || '').split('/').filter(p => !!p)

        // URL is a SoundCloud track URL
        // e.g. https://soundcloud.com/liluzivert/15-xo-tour-llif3
        if (
            videoUrl.hostname
            && videoUrl.hostname.match(/^(.*\.)?soundcloud\.com/i)
            && splitPath.length > 1
        )
            return new SoundCloud(options, 'https://soundcloud.com/' + splitPath.splice(0, 2).join('/'), title, start, end, adapterType)

        return false
    }

    constructor(options: SoundCloudOptions, id: string, title = '', start = 0, end = 0, type = 'none') {
        options = options || {}
        options.soundCloud = options.soundCloud || {}
        OptionsGetter.parseOptions(optionsSpecs, options.soundCloud)

        super(options, id, title, start, end, type)
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

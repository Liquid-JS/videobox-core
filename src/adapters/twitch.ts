import * as request from 'request'
import * as url from 'url'
import { VideoboxEncoder } from '../encoder'
import { splitTime } from '../helpers'
import { OptionsGetter } from '../helpers/optionsGetter'
import { Adapter, AdapterOptions } from './base'

const adapterType = 'twitch'

const optionsSpecs = {
    channelImage: { type: 'string', default: 'logo', enum: ['logo', 'video_banner', 'profile_banner'] }
}

export interface TwitchOptions extends AdapterOptions {
    twitch?: {
        channelImage?: string
    }
}

export class Twitch extends Adapter<TwitchOptions> {

    static load(encoder: VideoboxEncoder, type: string, id: string) {
        if (type == adapterType)
            return new Twitch(encoder, {}, id)

        return false
    }

    static parse(encoder: VideoboxEncoder, options: TwitchOptions, videoUrl: url.UrlWithParsedQuery, title = '', start = 0, end = 0) {
        const splitPath = (videoUrl.pathname || '').split('/').filter(p => !!p)

        // URL is old Twitch video URL
        // e.g. https://www.twitch.tv/familyjules/v/169051374
        if (
            videoUrl.hostname
            && videoUrl.hostname.match(/^(.*\.)?twitch\.tv/i)
            && splitPath.length > 2
            && splitPath[1] == 'v'
            && splitPath[2].match(/^\d+$/)
        )
            return new Twitch(encoder, options, 'v/' + splitPath[2], title, start, end, adapterType)

        // URL is new Twitch video URL
        // e.g. https://www.twitch.tv/videos/169051374
        if (
            videoUrl.hostname
            && videoUrl.hostname.match(/^(.*\.)?twitch\.tv$/i)
            && splitPath.length > 1
            && splitPath[0] == 'videos'
            && splitPath[1].match(/^\d+$/)
        )
            return new Twitch(encoder, options, 'v/' + splitPath[1], title, start, end, adapterType)

        // URL is a Twitch clip URL
        // e.g. https://clips.twitch.tv/EmpathicAbrasiveJayOptimizePrime
        if (
            videoUrl.hostname
            && videoUrl.hostname.match(/^clips\.twitch\.tv$/i)
            && splitPath.length > 0
        )
            return new Twitch(encoder, options, 'c/' + splitPath[0], title, start, end, adapterType)

        // URL is a Twitch channel URL
        // e.g. https://www.twitch.tv/familyjules
        if (
            videoUrl.hostname
            && videoUrl.hostname.match(/^(.*\.)?twitch\.tv$/i)
            && splitPath.length > 0
            && splitPath[0] != 'videos'
        )
            return new Twitch(encoder, options, 'c/' + options.twitch.channelImage + '/' + splitPath[0], title, start, end, adapterType)

        return false
    }

    constructor(encoder: VideoboxEncoder, options: TwitchOptions, id: string, title = '', start = 0, end = 0, type = 'none') {
        options = options || {}
        options.twitch = options.twitch || {}
        OptionsGetter.parseOptions(optionsSpecs, options.twitch)

        super(encoder, options, id, title, start, end, type)
    }

    private get plainId() {
        const id = this.id.split('/')
        return id[id.length - 1]
    }

    private get type() {
        const id = this.id.split('/')
        if (id[0] == 'v')
            return 'video'

        if (id[0] == 'c')
            if (id.length == 3)
                return 'channel'
            else
                return 'clip'

        return 'none'
    }

    private get channelImage() {
        if (this.type == 'channel') {
            const id = this.id.split('/')
            return id[1] || this.options.twitch.channelImage
        }
        return this.options.twitch.channelImage
    }

    async getThumbnailBaseUrl() {
        return new Promise<string>((resolve, reject) => request.get(
            'https://api.twitch.tv/kraken/' + this.type + 's/' + this.plainId,
            {
                encoding: null,
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT,
                    'Accept': 'application/vnd.twitchtv.v5+json'
                }
            },
            (err, _resp, buff) => {
                if (err)
                    return reject(err)

                const data = JSON.parse(buff)
                switch (this.type) {
                    case 'video':
                        return resolve(data.thumbnails.large[0].url)

                    case 'clip':
                        return resolve(data.thumbnails.medium)

                    case 'channel':
                        return resolve(data[this.channelImage] || data.logo)
                }
                reject(new Error('Unknown type'))
            })
        )
    }

    async getPlayerUrl() {
        let src = ''
        switch (this.type) {
            case 'video':
                src = 'https://player.twitch.tv/?video=v' + this.plainId
                if (this.start > 0)
                    src += '&time=' + splitTime(this.start)
                break

            case 'clip':
                src = 'https://clips.twitch.tv/embed?clip=' + this.plainId
                break

            case 'channel':
                src = 'https://player.twitch.tv/?channel=' + this.plainId
                break
        }
        if (src)
            src += '&autoplay=' + (this.options.autoplay ? 'true' : 'false')

        return src
    }
}

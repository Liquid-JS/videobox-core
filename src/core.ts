import * as url from 'url';
import { DefaultAdapters } from './adapters';
import { Adapter, AdapterOptions } from './adapters/base';
import { VideoboxEncoder } from './encoder';
import { BasicEncoder } from './encoder/basic';
import { timeToSeconds } from './helpers';
import { OptionsGetter } from './helpers/optionsGetter';

export const defaultOptionsSpecs = {
    thumbnailWidth: { type: 'int', default: 480 },
    thumbnailHeight: { type: 'int', default: 360 },
    removeBorder: { type: 'bool', default: true },
    autoplay: { type: 'bool', default: true },
    color: { type: 'rgb', default: '50bf82' }
}

export type VideoboxOptions = AdapterOptions

export class Videobox {

    constructor(
        private options: VideoboxOptions,
        private encoder: VideoboxEncoder = new BasicEncoder(),
        private adapters = DefaultAdapters
    ) {
        options = options || {}
        OptionsGetter.parseOptions(defaultOptionsSpecs, options)
        this.options = options
    }

    async imageUrl(type: string, id: string, width = 300, height = 225, removeBorder = true) {
        return this.encoder.encodeThumbnail(type, id, width, height, removeBorder)
    }

    async embedUrl(type: string, id: string) {
        return this.encoder.encodePlayer(type, id)
    }

    async parse(code: string) {
        return Promise.all(code
            .split(/\|,/)
            .map(el => el.trim().split('|'))
            .map(async el => {
                let id = el.splice(0, 1)[0].trim()
                const title = el.join('|').trim()
                let start = 0
                let end = 0

                const match = id.match(/^(.*?)(#([0-9]+(:[0-9]+){0,2})(-([0-9]+(:[0-9]+){0,2}))?)?$/)
                if (match[2]) {
                    id = match[1]
                    const time = match[2].substr(1).split('-')

                    if (time[0])
                        start = timeToSeconds(time[0])

                    if (time[1])
                        end = timeToSeconds(time[1])
                }

                const matches = this.adapters
                    .map(adapter => adapter.parse(this.options, <any>url.parse(id, true, true), title, start, end))
                    .filter(v => !!v)

                if (matches.length)
                    return matches[0]
            }))
            .then(videos => Promise.all(videos
                .filter(v => !!v)
                .map((video: Adapter<any>) => video.serialize())
            ))
    }
}

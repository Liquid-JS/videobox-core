import * as url from 'url'
import { defaultOptionsSpecs } from '../core'
import { VideoboxEncoder } from '../encoder'
import { OptionsGetter } from '../helpers/optionsGetter'

export interface AdapterOptions {
    thumbnailWidth?: number
    thumbnailHeight?: number
    removeBorder?: boolean
    autoplay?: boolean
    color?: string
}

export abstract class Adapter<T extends AdapterOptions> {

    static load(_encoder: VideoboxEncoder, _type: string, _id: string): Adapter<any> | false {
        throw new Error('Not implemented')
    }

    static parse<T extends AdapterOptions>(_encoder: VideoboxEncoder, _options: T, _videoUrl: url.UrlWithParsedQuery, _title: string, _start: number, _end: number): Adapter<any> | false {
        throw new Error('Not implemented')
    }

    constructor(
        protected encoder: VideoboxEncoder,
        protected options: T,
        protected id: string,
        protected title = '',
        protected start = 0,
        protected end = 0,
        protected adapterType = 'none'
    ) {
        options = <any>(options || {})
        OptionsGetter.parseOptions(defaultOptionsSpecs, options)
        this.options = options
    }

    abstract async getThumbnailBaseUrl(): Promise<string>

    abstract async getPlayerUrl(): Promise<string>

    async getThumbnailUrl(): Promise<string> {
        return this.encoder.encodeThumbnail(
            this.adapterType,
            this.id,
            this.options.thumbnailWidth,
            this.options.thumbnailHeight,
            this.options.removeBorder
        )
    }

    serialize() {
        return Promise.all([
            this.getThumbnailUrl(),
            this.getPlayerUrl()
        ]).then(urls => {
            return {
                id: this.id,
                title: this.title,
                start: this.start,
                end: this.end,
                img: urls[0],
                src: urls[1]
            }
        })
    }
}

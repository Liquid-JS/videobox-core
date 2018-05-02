import * as crypto from 'crypto'
import * as url from 'url'
import { defaultOptionsSpecs, Videobox } from '../core'
import { OptionsGetter } from '../helpers/optionsGetter'

export interface AdapterOptions {
    thumbnailWidth?: number
    thumbnailHeight?: number
    removeBorder?: boolean
    autoplay?: boolean
    color?: string
    baseUrl?: string
}

export abstract class Adapter<T extends AdapterOptions> {

    options: T
    protected visibleId: string

    static load(_videobox: Videobox, _type: string, _id: string): Adapter<any> | false {
        throw new Error('Not implemented')
    }

    static parse(_videobox: Videobox, _videoUrl: url.UrlWithParsedQuery, _title: string, _start: number, _end: number): Adapter<any> | false {
        throw new Error('Not implemented')
    }

    constructor(
        protected videobox: Videobox,
        protected id: string,
        protected title = '',
        protected start = 0,
        protected end = 0,
        protected adapterType = 'none'
    ) {
        const options = <any>(videobox.options || {})
        OptionsGetter.parseOptions(defaultOptionsSpecs, options)
        this.options = options
    }

    abstract async getThumbnailBaseUrl(): Promise<string>

    abstract async getPlayerUrl(): Promise<string>

    async getThumbnailUrl(): Promise<string> {
        return this.videobox.imageUrl(
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
        ]).then(([img, src]) => {
            const rawId = this.visibleId || this.id
            const id = crypto.createHash('md5')
                .update(this.adapterType)
                .update(rawId)
                .digest('hex')

            return {
                id,
                rawId,
                title: this.title,
                start: this.start,
                end: this.end,
                img,
                src
            }
        })
    }
}

import * as crypto from 'crypto';
import { DefaultAdapters } from './adapters';
import { VideoboxCache } from './cache';
import { BasicCache } from './cache/basic';
import { defaultOptionsSpecs } from './core';
import { VideoboxEncoder } from './encoder';
import { BasicEncoder } from './encoder/basic';
import { Generator } from './helpers/generator';
import { OptionsGetter } from './helpers/optionsGetter';
import { playerTemplate } from './views/player';

export class VideoboxContent {

    constructor(
        private cache: VideoboxCache = new BasicCache(),
        private encoder: VideoboxEncoder = new BasicEncoder(),
        private adapters = DefaultAdapters
    ) { }

    async thumbnail(path: string) {
        const cacheKey = crypto.createHash('md5')
            .update('thumbnail')
            .update(path)
            .digest('hex')

        return this.cahched(cacheKey, async () => {
            const spec = await this.encoder.decodeThumbnail(path)
            return new Generator(spec.width, spec.height, spec.removeBorder, this.adapters)
                .generateThumbnail(spec.type, spec.id)
        })
    }

    async embed(path: string, color?: string) {
        const options = {
            color: color
        }
        OptionsGetter.parseOptions(defaultOptionsSpecs, options)

        const cacheKey = crypto.createHash('md5')
            .update('embed')
            .update(path)
            .update(options.color)
            .digest('hex')

        return this.cahched(cacheKey, async () => {
            const spec = await this.encoder.decodePlayer(path)
            const videos = await Promise.all<any>(this.adapters.map(async adapter => adapter.load(spec.type, spec.id)))
            const video = videos.find(v => !!v)
            if (!video)
                throw new Error('Invalid type: ' + spec.type)

            const [sources, source, poster] = await Promise.all([
                video.getSourceTracks(),
                video.getOriginalTrack(),
                video.getThumbnailBaseUrl()
            ])

            return playerTemplate(sources, source, poster, options.color)
        })
    }

    private async cahched<T>(key: string, resolver: () => Promise<T>) {
        let val: T = await this.cache.get(key)
        if (val)
            return val

        val = await resolver()

        this.cache.set(key, val, 15 * 60)
            .catch(err => console.log(err))

        return val
    }
}

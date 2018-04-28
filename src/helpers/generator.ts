import { subClass } from 'gm'
import * as request from 'request'
import { DefaultAdapters } from '../adapters'
import { Adapter } from '../adapters/base'
import { VideoboxEncoder } from '../encoder'

const gm = subClass({ imageMagick: true })

export class Generator {

    constructor(
        private width = 0,
        private height = 0,
        private removeBorder = true,
        private adapters = DefaultAdapters,
        private encoder: VideoboxEncoder
    ) { }

    async resizeBuffer(buff: Buffer) {
        const image = gm(buff, 'image')
            .autoOrient()

        let pr = Promise.resolve(image)
        if (this.removeBorder)
            pr = new Promise((resolve, reject) => {
                image
                    .fuzz(10, true)
                    .borderColor('#000000')
                    .border(1, 1)
                    .trim()
                    .toBuffer('JPEG', (err, buffer) => {
                        if (err)
                            return reject(err)

                        resolve(gm(buffer, 'image.jpg'))
                    })
            })

        return pr.then(img => new Promise<Buffer>((resolve, reject) => {
            img
                .resize(this.width, this.height)
                .background('#000000')
                .gravity('Center')
                .extent(this.width, this.height)
                .toBuffer('JPEG', (err, buffer) => {
                    if (err)
                        return reject(err)

                    resolve(buffer)
                })
        }))
    }

    async generateThumbnail(type, id) {
        return Promise.all(this.adapters.map(async adapter => adapter.load(this.encoder, type, id)))
            .then(videos => {
                videos = videos.filter(v => !!v)
                if (videos.length > 0)
                    return videos[0]

                throw new Error('Invalid type: ' + type)
            })
            .then((video: Adapter<any>) => video.getThumbnailBaseUrl())
            .then(url => new Promise<Buffer>((resolve, reject) => request.get(url, { encoding: null }, (err, _resp, buff: Buffer) => {
                if (err)
                    return reject(err)

                resolve(buff)
            })))
            .then(buff => this.resizeBuffer(buff))
    }
}

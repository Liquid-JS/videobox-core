import { expect } from 'chai'
import { suite, test } from 'mocha-typescript'
import { BasicEncoder } from '.'

const videoType = 'playerType'
const videoId = 'videoId'
const thumbnailWidth = 360
const thumbnailHeight = 240
const removeBorder = true

const invalid = 'lcs8bc8tdzv87e4cdzu'

@suite
export class Encoder {

    @test('should encode / decode player')
    async player() {
        const encoder = new BasicEncoder()
        const encoded = await encoder.encodePlayer(videoType, videoId)
        expect(await encoder.decodePlayer(encoded)).to.deep.equal({
            type: videoType,
            id: videoId
        })
    }

    @test('should encode / decode player')
    async thumbnail() {
        const encoder = new BasicEncoder()
        const encoded = await encoder.encodeThumbnail(videoType, videoId, thumbnailWidth, thumbnailHeight, removeBorder)
        expect(await encoder.decodeThumbnail(encoded)).to.deep.equal({
            type: videoType,
            id: videoId,
            width: thumbnailWidth,
            height: thumbnailHeight,
            removeBorder
        })
    }

    @test('should encode / decode across instances')
    async stable() {
        const encoder = new BasicEncoder()
        const encoder2 = new BasicEncoder()

        const encodedPlayer = await encoder.encodePlayer(videoType, videoId)
        expect(await encoder2.decodePlayer(encodedPlayer)).to.deep.equal({
            type: videoType,
            id: videoId
        })

        const encodedThumbnail = await encoder2.encodeThumbnail(videoType, videoId, thumbnailWidth, thumbnailHeight, removeBorder)
        expect(await encoder.decodeThumbnail(encodedThumbnail)).to.deep.equal({
            type: videoType,
            id: videoId,
            width: thumbnailWidth,
            height: thumbnailHeight,
            removeBorder
        })
    }

    @test('should not decode invalid path')
    async invalid() {
        const encoder = new BasicEncoder()
        expect(await encoder.decodePlayer(invalid)).to.equal(undefined)
        expect(await encoder.decodeThumbnail(invalid)).to.equal(undefined)
    }
}

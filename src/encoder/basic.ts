import * as crypto from 'crypto'
import * as stringify from 'json-stable-stringify'
import * as LRU from 'lru-cache'
import { VideoboxEncoder } from '.'

const thumbMap: LRU.Cache<string, { type: string; id: string; width: number; height: number; removeBorder: boolean; }> = LRU({ max: 1000 })
const playerMap: LRU.Cache<string, { type: string; id: string; }> = LRU({ max: 1000 })

export class BasicEncoder implements VideoboxEncoder {

    async encodePlayer(type: string, id: string): Promise<string> {
        const doc = {
            type,
            id
        }
        const key = crypto.createHash('md5')
            .update(stringify(doc))
            .digest('hex')

        playerMap.set(key, doc)
        return key
    }

    async decodePlayer(path: string): Promise<{ type: string; id: string; }> {
        return playerMap.get(path)
    }

    async encodeThumbnail(type: string, id: string, width: number, height: number, removeBorder: boolean): Promise<string> {
        const doc = {
            type,
            id,
            width,
            height,
            removeBorder
        }
        const key = crypto.createHash('md5')
            .update(stringify(doc))
            .digest('hex')

        thumbMap.set(key, doc)
        return key
    }

    async decodeThumbnail(path: string): Promise<{ type: string; id: string; width: number; height: number; removeBorder: boolean; }> {
        return thumbMap.get(path)
    }
}

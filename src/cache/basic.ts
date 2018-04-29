import * as NodeCache from 'node-cache'
import { VideoboxCache } from '.'

const cache = new NodeCache()

export class BasicCache implements VideoboxCache {

    constructor() { }

    async get(key: string): Promise<any> {
        const val = cache.get(key)
        return val === undefined ? null : val
    }

    async set(key: string, value: any, life?: number): Promise<any> {
        return cache.set(key, value, life || 0)
    }
}

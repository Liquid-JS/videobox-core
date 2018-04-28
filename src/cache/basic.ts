import * as NodeCache from 'node-cache'
import { VideoboxCache } from '.'

export class BasicCache implements VideoboxCache {

    private cache: NodeCache

    constructor() {
        this.cache = new NodeCache()
    }

    async get(key: string): Promise<any> {
        return this.cache.get(key)
    }

    async set(key: string, value: any, life?: number): Promise<any> {
        return this.cache.set(key, value, life || 0)
    }
}

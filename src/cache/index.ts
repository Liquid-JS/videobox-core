export interface VideoboxCache {

    /**
     * Return the cached value for key
     *
     * @param key Cache key
     * @returns Value or null if value has expired
     */
    get(key: string): Promise<any>

    /**
     * Store a value in cache
     *
     * @param key Cache key
     * @param value Cached value
     * @param life Cache lifetime in seconds, 0 means no expiration
     */
    set(key: string, value: any, life?: number): Promise<any>
}

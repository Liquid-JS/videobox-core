export * from './basic'

export interface VideoboxEncoder {

    /**
     * Encode video paramters to an URL-safe string
     *
     * @param type Video type
     * @param id Video id
     */
    encodePlayer(type: string, id: string): Promise<string>

    /**
     * Decode string returned by `encodePlayer`
     *
     * @param path URL path
     */
    decodePlayer(path: string): Promise<{ type: string, id: string }>

    /**
     * Encode thumbnail parameters to an URL-safe string
     *
     * @param type Video type
     * @param id Video is
     * @param width Thubmnail width
     * @param height Thubmnail height
     * @param removeBorder Whether to remove black border from the source image
     */
    encodeThumbnail(type: string, id: string, width: number, height: number, removeBorder: boolean): Promise<string>

    /**
     * Decode string returned by `encodeThumbnail`
     *
     * @param path URL path
     */
    decodeThumbnail(path: string): Promise<{ type: string, id: string, width: number, height: number, removeBorder: boolean }>
}

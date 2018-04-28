import { Adapter } from './base'
import { HTML5 } from './html5'
import { SoundCloud } from './soundcloud'
import { Twitch } from './twitch'
import { Vimeo } from './vimeo'
import { YouTube } from './youtube'

export const DefaultAdapters: Array<typeof Adapter> = [
    <any>YouTube,
    <any>Vimeo,
    <any>Twitch,
    <any>SoundCloud,
    <any>HTML5
]

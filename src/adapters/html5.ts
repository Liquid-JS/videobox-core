import * as Ffmpeg from 'fluent-ffmpeg'
import * as JSFtp from 'jsftp'
import * as path from 'path'
import * as url from 'url'
import { Videobox } from '../core'
import { checkExtensions } from '../helpers'
import { OptionsGetter } from '../helpers/optionsGetter'
import { Adapter, AdapterOptions } from './base'

const adapterType = 'html5'

const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogv']
const AUDIO_EXTENSIONS = ['mp3', 'webm', 'oga']
const THUMBNAIL_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif']

const optionsSpecs = {
    ftpUser: { type: 'string', default: '' },
    ftpPassword: { type: 'string', default: '' },
    ftpPort: { type: 'int', default: 21 }
}

export interface HTML5Options extends AdapterOptions {
    html5?: {
        ftpUser?: string
        ftpPassword?: string
        ftpPort?: string
        ftpRoot?: string
    }
}

export class HTML5 extends Adapter<HTML5Options> {

    videoUrl: url.URL
    ftpUrl: url.URL
    extension: string

    static load(videobox: Videobox, type: string, id: string) {
        if (type == adapterType)
            return new HTML5(videobox, id)

        return false
    }

    static parse(videobox: Videobox, videoUrl: url.UrlWithParsedQuery, title = '', start = 0, end = 0) {
        if (!videoUrl.pathname)
            return false

        const extension = path.extname(videoUrl.pathname).substr(1).toLowerCase()

        // URL ends with `VIDEO_EXTENSIONS`
        // e.g. http://vjs.zencdn.net/v/oceans.mp4
        if (
            videoUrl.hostname
            && videoUrl.pathname
            && VIDEO_EXTENSIONS.indexOf(extension) >= 0
        )
            return new HTML5(videobox, videoUrl.href, title, start, end, adapterType)

        // URL ends with `AUDIO_EXTENSIONS`
        // e.g. http://vjs.zencdn.net/v/oceans.mp3
        if (
            videoUrl.hostname
            && videoUrl.pathname
            && AUDIO_EXTENSIONS.indexOf(extension) >= 0
        )
            return new HTML5(videobox, videoUrl.href, title, start, end, adapterType)

        return false
    }

    constructor(videobox: Videobox, id: string, title = '', start = 0, end = 0, type = 'none') {
        const options: HTML5Options = videobox.options || {}
        options.html5 = options.html5 || {}
        OptionsGetter.parseOptions(optionsSpecs, options.html5)

        const ids = id.split('|')
            .map(p => p.trim())
            .filter(p => !!p)
            .map(p => new url.URL(p))
            .map(p => {
                p.search = ''
                p.hash = ''
                return p
            })

        const videoUrl = ids[0]
        let ftpUrl: url.URL

        if (ids.length > 1)
            ftpUrl = ids[1]

        if (!ftpUrl) {
            ftpUrl = new url.URL(videoUrl.href)
            ftpUrl.username = ftpUrl.username || options.html5.ftpUser || ''
            ftpUrl.password = ftpUrl.password || options.html5.ftpPassword || ''
            ftpUrl.port = (ftpUrl.port || options.html5.ftpPort || 21) + ''
            ftpUrl.protocol = 'ftp'
        }

        id = ftpUrl && ftpUrl.href != videoUrl.href ? `${videoUrl.href}|${ftpUrl.href}` : videoUrl.href
        super(videobox, id, title, start, end, type)

        this.visibleId = videoUrl.href
        this.videoUrl = videoUrl
        this.ftpUrl = ftpUrl

        this.extension = path.extname(this.videoUrl.pathname).substr(1).toLowerCase()
    }

    private get ftpClient() {
        if (this.ftpUrl.username && this.ftpUrl.password)
            return new JSFtp({
                host: this.ftpUrl.hostname,
                port: this.ftpUrl.port,
                user: this.ftpUrl.username,
                pass: this.ftpUrl.password
            })

        return null
    }

    async getThumbnailBaseUrl() {
        let thubmnailUrl = new url.URL(this.videoUrl.toString())
        thubmnailUrl.pathname = ''

        let promise: Promise<any> = Promise.resolve()
        if (this.ftpClient)
            promise = new Promise((resolve, reject) => {
                const dir = path.dirname(this.videoUrl.pathname)
                let basename = path.basename(this.videoUrl.pathname)
                basename = basename.substr(0, basename.length - path.extname(basename).length)
                this.ftpClient.ls(dir, (err, res) => {
                    if (err)
                        return reject(err)

                    const foundFiles = res.map(file => file.name)

                    // 1. check for existing thumbnails
                    const files = foundFiles.filter(file =>
                        file.startsWith(basename)
                        && THUMBNAIL_EXTENSIONS.indexOf(path.extname(file).substr(1).toLowerCase()) >= 0
                    )
                    if (files.length > 0)
                        return resolve(thubmnailUrl.pathname = path.join(dir, files[0]))

                    // 2. try generating thumbnail from the source video
                    const source = foundFiles.filter(file => file == path.basename(this.videoUrl.pathname))
                    if (source.length > 0) {
                        const sourceUrl = new url.URL(this.videoUrl.href)
                        sourceUrl.protocol = 'ftp:'
                        sourceUrl.search = ''
                        sourceUrl.hash = ''

                        const targetUrl = new url.URL(sourceUrl.href)
                        targetUrl.pathname = path.join(dir, basename + '.jpg')

                        Ffmpeg(sourceUrl.href)
                            .output(targetUrl.href)
                            .format('mjpeg')
                            .seek('0:01')
                            .frames(1)
                            .on('error', (error) => reject(error))
                            .on('end', () => resolve(thubmnailUrl.pathname = targetUrl.pathname))
                            .run()
                    }

                    reject(new Error('No source file for ' + this.videoUrl.href + ' found using FTP'))
                })
            })
                .catch(err => console.log(err) || '')
        else
            // 3. check for existing thumbnil files through HTTP
            promise = checkExtensions(this.videoUrl, THUMBNAIL_EXTENSIONS)
                .then(matches => {
                    if (matches.length > 0)
                        return thubmnailUrl = new url.URL(matches[0])
                    else
                        throw new Error('No thumbnail can be found for ' + this.videoUrl.href)
                })

        return promise.then(() => thubmnailUrl.href)
    }

    async convert() {
        const convertOptions = {
            'mp4': [
                '-acodec aac',
                '-vcodec h264',
                '-strict -2',
                '-movflags faststart'
            ],
            'webm': [
                '-acodec libvorbis',
                '-vcodec libvpx-vp9',
                '-b:v 0',
                '-crf 30'
            ],
            'ogv': [
                '-q:v 6',
                '-q:a 5'
            ]
        }
        return new Promise((resolve, reject) => {
            if (!this.ftpClient)
                return reject(new Error('FTP access is needed to convert the video'))

            const dir = path.dirname(this.videoUrl.pathname)
            let basename = path.basename(this.videoUrl.pathname)
            basename = basename.substr(0, basename.length - path.extname(basename).length)
            this.ftpClient.ls(dir, (err, res) => {
                if (err)
                    return reject(err)

                const foundFiles = res.map(file => file.name)

                // Get existing source files
                const files = foundFiles.filter(file =>
                    file.startsWith(basename)
                    && VIDEO_EXTENSIONS.indexOf(path.extname(file).substr(1).toLowerCase()) >= 0
                )

                if (files.length < 1)
                    return reject(new Error('No file found matching ' + this.videoUrl.pathname))

                let source = files[0]
                if (files.indexOf(path.basename(this.videoUrl.pathname)) >= 0)
                    source = path.basename(this.videoUrl.pathname)

                source = path.join(dir, source)

                const existing = files.map(file => path.extname(file).substr(1).toLowerCase())
                const missing = VIDEO_EXTENSIONS.filter(ext => existing.indexOf(ext) < 0)
                if (missing.length < 1)
                    return resolve()

                const sourceUrl = new url.URL(this.videoUrl.href)
                sourceUrl.protocol = 'ftp:'
                sourceUrl.search = ''
                sourceUrl.hash = ''
                sourceUrl.pathname = source

                let command = Ffmpeg(sourceUrl.href)

                missing.forEach(ext => {
                    const targetUrl = new url.URL(sourceUrl.href)
                    targetUrl.pathname = path.join(dir, basename + '.' + ext)
                    command = command.output(targetUrl.href)
                        .format(ext == 'ogv' ? 'ogg' : ext)
                        .outputOptions(convertOptions[ext] || [])
                        .outputOptions('-movflags faststart')
                })

                command
                    .on('error', (error) => reject(error))
                    .on('end', () => resolve())
                    .run()
            })
        })
    }

    async getSourceTracks() {
        // this.convert().catch(err => console.log("Error wihle converting video " + this.videoUrl.href, err))
        return checkExtensions(this.videoUrl, VIDEO_EXTENSIONS, true)
    }

    async getOriginalTrack() {
        return this.videoUrl.href
    }

    async getPlayerUrl() {
        let src = await this.videobox.embedUrl(
            this.adapterType,
            this.id
        )

        let opt = ''
        opt += '&autoplay=' + (this.options.autoplay ? '1' : '0')
        if (this.start > 0)
            opt += '&start=' + this.start
        if (this.end > 0)
            opt += '&end=' + this.end
        if (this.options.color)
            opt += '&color=' + this.options.color

        if (opt)
            src += '?' + opt.substr(1)

        return src
    }
}

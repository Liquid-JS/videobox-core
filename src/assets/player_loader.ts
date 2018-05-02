import * as autoprefixer from 'autoprefixer'
import * as fs from 'fs'
import * as nodeSass from 'node-sass'
import * as path from 'path'
import * as postcss from 'postcss'
import * as csso from 'postcss-csso'
import { rollup } from 'rollup'
import * as closure from 'rollup-plugin-closure-compiler'
import * as commonjs from 'rollup-plugin-commonjs'
import * as nodeResolve from 'rollup-plugin-node-resolve'
import * as typescript from 'rollup-plugin-typescript'
import * as uglify from 'rollup-plugin-uglify'
import * as tsc from 'typescript'

export async function getPlayerJS() {
    const [ts, js] = await Promise.all([
        new Promise((resolve, _reject) => {
            fs.exists(path.normalize(path.join(__dirname, 'player.ts')), exists => resolve(exists))
        }),
        new Promise((resolve, _reject) => {
            fs.exists(path.normalize(path.join(__dirname, 'player.js')), exists => resolve(exists))
        })
    ])

    if (!ts && !js)
        return ''

    const playerPath = path.normalize(path.join(__dirname, ts ? 'player.ts' : 'player.js'))

    const bundle = await rollup({
        input: playerPath,
        plugins: [
            closure({
                language_out: 'ECMASCRIPT5'
            }),
            uglify(),
            nodeResolve({
                jsnext: true,
                main: true
            }),
            commonjs({
                include: ['node_modules/**', 'dist/**'],
                extensions: ['.js', '.json', '.ts']
            }),
            typescript({
                typescript: tsc
            })
        ]
    })

    // @ts-ignore
    const { code, map } = await bundle.generate({
        format: 'iife',
        name: 'player'
    })

    return code
}

export async function getPlayerCSS(color: string) {
    const scss = `
// ==========================================================================
// Plyr styles
// https://github.com/sampotts/plyr
// TODO: Review use of BEM classnames
// ==========================================================================
@charset 'UTF-8';

@import 'settings/breakpoints';

$plyr-color-main: #${color} !default;
$plyr-color-gunmetal: #2f343d !default;
$plyr-color-fiord: #4f5b5f !default;
$plyr-color-lynch: #6b7d85 !default;
$plyr-color-heather: #b7c5cd !default;

@import 'settings/cosmetics';
@import 'settings/type';

@import 'settings/badges';
@import 'settings/captions';
@import 'settings/controls';
@import 'settings/helpers';
@import 'settings/menus';
@import 'settings/progress';
@import 'settings/sliders';
@import 'settings/tooltips';

@import 'lib/animation';
@import 'lib/functions';
@import 'lib/mixins';

@import 'base';

@import 'components/badges';
@import 'components/captions';
@import 'components/control';
@import 'components/controls';
@import 'components/embed';
@import 'components/menus';
@import 'components/progress';
@import 'components/sliders';
@import 'components/times';
@import 'components/tooltips';
@import 'components/video';
@import 'components/volume';

@import 'states/error';
@import 'states/fullscreen';

@import 'plugins/ads';

@import 'utils/animation';
@import 'utils/hidden';
`

    const result = await new Promise<nodeSass.Result>((resolve, reject) => nodeSass.render({
        data: scss,
        includePaths: [
            path.normalize(path.join(process.cwd(), 'node_modules', 'plyr', 'src', 'sass'))
        ]
    }, (err, res) => {
        if (err)
            return reject(err)

        resolve(res)
    }))

    const style = await postcss([
        csso(),
        autoprefixer,
        csso()
    ])
        .process(result.css.toString('utf8'), {
            from: process.cwd()
        })

    return style.css
}

export async function getPlayerSVG() {
    return new Promise((resolve, reject) => {
        const svgPath = path.normalize(path.join(process.cwd(), 'node_modules', 'plyr', 'dist', 'plyr.svg'))
        fs.readFile(svgPath, 'utf8', (err, data) => {
            if (err)
                return reject(err)

            resolve(data)
        })
    })
}

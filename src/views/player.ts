import { html, render } from 'ssr-lit-html'

export function playerTemplate(sources: { url: string, mime: string }[], videoSource: string, poster: string, color: string) {
    const tpl = html`
    <!DOCTYPE html>
    <html>

    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta charset="utf-8">
        <base href="/">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/assets/player-${color}.css">
        <style>
            html,
            body {
                position: fixed;
                padding: 0;
                margin: 0;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
            }

            .plyr {
                width: 100%;
                height: 100%;
            }

            video,
            audio,
            .plyr__video-wrapper {
                width: 100% !important;
                height: 100% !important;
                background: #000 !important;
            }
        </style>
    </head>

    <body>
        <video id="video-element" poster="${poster}">
            ${sources.map(source => html`
            <source src="${source.url}" type="${source.mime}"></source>
            `)}

            <div>
                <a href="${videoSource}">
                    <img src="${poster}" alt="download video" />
                </a>
            </div>
        </video>
        <script type="text/javascript" src="/assets/player.js"></script>
    </body>

    </html>
    `
    return render(tpl)
}

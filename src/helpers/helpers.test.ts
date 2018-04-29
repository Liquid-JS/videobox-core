import { expect, assert } from 'chai'
import { suite, test } from 'mocha-typescript'
import * as request from 'request'
import * as sinon from 'sinon';
import { splitTime, timeToSeconds, checkExtensions, OptionsGetter } from '.'
import 'chai-arrays'

const baseUrl = 'http://www.test.com/test.ext'
const extensions = ['err', 'ext1', 'ext2', 'no-ext']

sinon.stub(request, 'head').callsFake((url, cb) => {
    const path: string = url.toString()
    if (path.endsWith('.err'))
        return cb(new Error('Test err'), null, null)

    if (path.endsWith('.ext'))
        return cb(null, {
            statusCode: 200,
            headers: { 'content-type': 'text/test' }
        }, null)

    if (path.endsWith('.ext1'))
        return cb(null, {
            statusCode: 200,
            headers: {}
        }, null)

    if (path.endsWith('.ext2'))
        return cb(null, {
            statusCode: 200
        }, null)

    return cb(null, {
        statusCode: 404
    }, null)
})

const consoleStub = sinon.stub(console, 'error')

const optionsSpecs = {
    thumbnailWidth: { type: 'int', default: 480 },
    thumbnailHeight: { type: 'int', default: 360 },
    removeBorder: { type: 'bool', default: true },
    autoplay: { type: 'bool', default: true },
    color: { type: 'rgb', default: '50bf82' },
    test: { type: 'string', default: 'test', enum: ['test', 'name'] }
}

@suite
export class Helpers {

    @test('should convert time in seconds to string')
    splitTime() {
        expect(splitTime()).to.equal('')
        expect(splitTime(0)).to.equal('')
        expect(splitTime(-10)).to.equal('')
        expect(splitTime(10)).to.equal('10s')
        expect(splitTime(10)).to.equal('10s')
        expect(splitTime(5 * 60 + 10)).to.equal('5m10s')
        expect(splitTime(3 * 3600 + 5 * 60 + 10)).to.equal('3h5m10s')
    }

    @test('should convert clock format to seconds')
    timeToSeconds() {
        expect(timeToSeconds('')).to.equal(0)
        expect(timeToSeconds('0')).to.equal(0)
        expect(timeToSeconds('1:10')).to.equal(1 * 60 + 10)
        expect(timeToSeconds('01:10')).to.equal(1 * 60 + 10)
        expect(timeToSeconds('01:')).to.equal(1 * 60)
        expect(timeToSeconds('2:01:')).to.equal(2 * 3600 + 1 * 60)
        expect(timeToSeconds('2:01:10')).to.equal(2 * 3600 + 1 * 60 + 10)
    }

    @test('should check extensions')
    async checkExtensions() {
        const rs = await checkExtensions(baseUrl, extensions)

        expect(consoleStub.calledOnce).to.be.true
        assert.sameMembers(rs, [
            'http://www.test.com/test.ext1',
            'http://www.test.com/test.ext2',
            'http://www.test.com/test.ext'
        ])

        const rsMime = await checkExtensions(baseUrl, extensions, true)

        expect(consoleStub.calledTwice).to.be.true
        assert.sameDeepMembers(rsMime, [
            {
                mime: "",
                url: "http://www.test.com/test.ext1"
            },
            {
                mime: "",
                url: "http://www.test.com/test.ext2"
            },
            {
                mime: "text/test",
                url: "http://www.test.com/test.ext"
            }
        ])
    }

    @test('should parse int')
    optionsInt() {
        expect(OptionsGetter.int({ test: 0 }, 'test')).to.equal(0)
        expect(OptionsGetter.int({ test: '0' }, 'test')).to.equal(0)
        expect(OptionsGetter.int({ test: '' }, 'test', 0)).to.equal(0)
        expect(OptionsGetter.int({ test: '' }, 'test', 1)).to.equal(1)
        expect(OptionsGetter.int({ test: '1' }, 'test')).to.equal(1)
        expect(OptionsGetter.int({ test: '0' }, 'test', 1)).to.equal(0)
        expect(OptionsGetter.int({ test: '-1' }, 'test')).to.equal(-1)
        expect(OptionsGetter.int({}, 'test')).to.equal(0)
        expect(OptionsGetter.int({}, 'test', 1)).to.equal(1)
    }

    @test('should parse boolean')
    optionsBoolean() {
        expect(OptionsGetter.bool({ test: 'true' }, 'test', false)).to.be.true
        expect(OptionsGetter.bool({ test: 'false' }, 'test', false)).to.be.false
        expect(OptionsGetter.bool({}, 'test', true)).to.be.true
        expect(OptionsGetter.bool({}, 'test', false)).to.be.false
        expect(OptionsGetter.bool({ test: '1' }, 'test', false)).to.be.true
        expect(OptionsGetter.bool({ test: '0' }, 'test', false)).to.be.false
        expect(OptionsGetter.bool({}, 'test')).to.be.false
        expect(OptionsGetter.bool({ test: false }, 'test', true)).to.be.false
    }

    @test('should parse string')
    optionsString() {
        expect(OptionsGetter.string({ test: 'true' }, 'test', '')).to.equal('true')
        expect(OptionsGetter.string({ test: 'true' }, 'test', '', ['test'])).to.equal('test')
        expect(OptionsGetter.string({ test: 'true' }, 'test', 'name', ['test', 'name'])).to.equal('name')
        expect(OptionsGetter.string({ test: 'name' }, 'test', '', ['test', 'name'])).to.equal('name')
        expect(OptionsGetter.string({}, 'test', '')).to.equal('')
    }

    @test('should parse rgb hex')
    optionsRGB() {
        expect(OptionsGetter.rgb({ test: '1234bd' }, 'test')).to.equal('1234BD')
        expect(OptionsGetter.rgb({ test: '12ght0' }, 'test')).to.equal('000000')
        expect(OptionsGetter.rgb({}, 'test', '1234bd')).to.equal('1234BD')
        expect(OptionsGetter.rgb({}, 'test', '12ght0')).to.equal('000000')
        expect(OptionsGetter.rgb({}, 'test', '1234bd346')).to.equal('000000')
        expect(OptionsGetter.rgb({}, 'test', '12ght0346')).to.equal('000000')
        expect(OptionsGetter.rgb({ test: '12ght0dsfg' }, 'test')).to.equal('000000')
    }

    @test('should parse options')
    options() {
        expect(OptionsGetter.parseOptions(optionsSpecs, {})).to.deep.equal({
            autoplay: true,
            color: '50BF82',
            removeBorder: true,
            test: 'test',
            thumbnailHeight: 360,
            thumbnailWidth: 480
        })
    }
}

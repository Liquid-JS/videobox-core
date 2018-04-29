import { expect } from 'chai'
import { suite, test } from 'mocha-typescript'
import { BasicCache } from '.'
import { wait } from '../helpers';

const testKey = 'testKey'
const testVal = 'testVal'

const missingKey = 'missing'

@suite
export class Cache {

    @test('should store key')
    async store() {
        const cache = new BasicCache()
        await cache.set(testKey, testVal)
        expect(await cache.get(testKey)).to.equal(testVal)
    }

    @test('should store a value across instances')
    async stable() {
        const cache = new BasicCache()
        await cache.set(testKey, testVal)

        const cache2 = new BasicCache()
        expect(await cache2.get(testKey)).to.equal(testVal)
    }

    @test('should return null for missing key')
    async missing() {
        const cache = new BasicCache()
        expect(await cache.get(missingKey)).to.equal(null)
    }

    @test('should return null for expired key')
    async expired() {
        const cache = new BasicCache()
        await cache.set(testKey, testVal, 1)
        expect(await cache.get(testKey)).to.equal(testVal)

        await wait(1100)
        expect(await cache.get(testKey)).to.equal(null)
    }
}

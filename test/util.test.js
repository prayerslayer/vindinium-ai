const expect = require('chai').expect
const {walk} = require('../src/util')

describe('util', () => {
  describe('walk', () => {
    it('north works', () => {
      const dir = walk({
        x: 0,
        y: 0
      }, [{
        x: 0,
        y: -1
      }])
      expect(dir).to.equal('n')
    })
    it('south works', () => {
      const dir = walk({
        x: 0,
        y: 0
      }, [{
        x: 0,
        y: 1
      }])
      expect(dir).to.equal('s')
    })
    it('west works', () => {
      const dir = walk({
        x: 0,
        y: 0
      }, [{
        x: -1,
        y: 0
      }])
      expect(dir).to.equal('w')
    })
    it('east works', () => {
      const dir = walk({
        x: 0,
        y: 0
      }, [{
        x: 1,
        y: 0
      }])
      expect(dir).to.equal('e')
    })
    it('stays when position is equal', () => {
      const dir = walk({
        x: 0,
        y: 0
      }, [{
        x: 0,
        y: 0
      }])
      expect(dir).to.equal('Stay')
    })
    it('stays when path empty', () => {
      const dir = walk({
        x: 0,
        y: 0
      }, [])
      expect(dir).to.equal('Stay')
    })
  })
})

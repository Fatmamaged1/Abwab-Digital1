import mocha from 'mocha'
import chai from 'chai'
import expect from 'expect'

import { flattenDeep } from '../src/flattenDeep'

describe( 'flattenDeep', () => {
  it('flattens a nested array to a single level', () => {
      //_.flatten([1, [2, [3, [4]], 5]])
      // => [1, 2, [3, [4]], 5] 
      // [2, [3, [4]]
      // [3, [4]]
      // [4]
      let flattenResult = flattenDeep([1, [2, [3, [4]], 5]])
      expect(flattenResult).toEqual([1, 2, 3, 4, 5])
  })
  it('returns an empty array when input is undefined', () => {
    expect(flattenDeep(undefined)).toEqual([])
  })
  it ('returns an empty array when the input is null', () => {
    expect(flattenDeep(null)).toEqual([])
  })
  it ('returns a string split inside of an array when the input is a string', () => {
    expect(flattenDeep('abc')).toEqual([ 'a', 'b', 'c'])
  })
  it ('returns an empty array when input is an object', () => {
    expect(flattenDeep({})).toEqual([])
  })
})
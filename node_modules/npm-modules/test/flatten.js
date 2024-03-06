import mocha from 'mocha'
import chai from 'chai'
import expect from 'expect'

import { flatten } from '../src/flatten'

describe( 'flatten', () => {

  it('flattens an array a single layer deep', () => {
      //_.flatten([1, [2, [3, [4]], 5]])
      // => [1, 2, [3, [4]], 5] 
      let flattenResult = flatten([1, [2, [3, [4]], 5]])
      expect(flattenResult).toEqual([1, 2, [3, [4]], 5])
  })
  it('returns an empty array when input is undefined', () => {
    expect(flatten(undefined)).toEqual([])
  })
  it ('returns an empty array when the input is null', () => {
    expect(flatten(null)).toEqual([])
  })
  it ('returns a string split inside of an array when the input is a string', () => {
    expect(flatten('abc')).toEqual([ 'a', 'b', 'c'])
  })
  it ('returns an empty array when input is an object', () => {
    expect(flatten({})).toEqual([])
  })
})
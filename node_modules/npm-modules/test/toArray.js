import mocha from 'mocha'
import chai from 'chai'
import expect from 'expect'

import { toArray } from '../src/toArray'

describe( 'toArray', () => {

  it('returns an array with the values in an object', () => {
    expect(toArray({first:'George', last: 'Michel'})).toEqual(['George', 'Michel'])
  })

  it('returns the same array when the input is an array', () => {
    expect(toArray([1,2,3,4])).toEqual([1,2,3,4])
  })

  it('returns an empty array when input is undefined', () => {
    expect(toArray(undefined)).toEqual([])
  })
 it ('returns an empty array when the input is null', () => {
  expect(toArray(null)).toEqual([])
 })
 it ('returns a string split inside of an array when the input is a string', () => {
    expect(toArray('abc')).toEqual([ 'a', 'b', 'c'])
 })
})
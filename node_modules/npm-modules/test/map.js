import mocha from 'mocha'
import chai from 'chai'
import expect from 'expect'

import { map } from '../src/map'

describe( 'map', () => {

  it('performs a function on each element in array, returning a new array', () => {
    const addTwo = (item) => {
      return item + 2;
    }
    expect(map([1,2,3], addTwo)).toEqual([3,4,5])
  })

  it('takes an optional index as a second argument', () => {
    const addTwo = (item, index) => {
      return item + index;
    }
    expect(map([0,0,0,0], addTwo)).toEqual([0,1,2,3]) 
  })
  it('treats a string as an array, returns an array of mapped items', () => {
    const addOp = (item) => {
      return item+'op'
    }
    expect( map('hi', addOp)).toEqual(['hop','iop'])
  })
  it ('iterates through the keys in an object and returns an array of mapped items', () => {
    const addWorld = (item) => {
      return item+' world'
    }
    expect( map({0:"hello",1:"hi"},addWorld) ).toEqual(['hello world','hi world'])

  })
  it('returns an empty array when input is undefined', () => {
    expect(map(undefined, () => {})).toEqual([])
  })
  it ('returns an empty array when the input is null', () => {
    expect(map(null, () => {})).toEqual([])
  }) 
})



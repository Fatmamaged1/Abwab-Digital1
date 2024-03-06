import mocha from 'mocha'
import chai from 'chai'
import expect from 'expect'

import { min } from '../src/min'

describe( 'min', () => {
  it( 'gets the minimum value in an array of integers', () => {
    expect( min([3,10,6,7] ) ).toEqual(3)
  })
  it ('returns undefined if input is a boolean', () => {
    expect( min(true) ).toEqual(undefined)
  })

  it ('returns undefined if input is a string', () => {
    expect( min('Aileen') ).toEqual(undefined)

  }) 

  it ('returns undefined if input is null', () => {
    expect( min(null) ).toEqual(undefined)

  })

  it ('returns undefined if input is undefined', () => {
    expect( min(undefined) ).toEqual(undefined)

  })  

  it ('gets the minimum value in an array of mixed integers and integers stored as strings', () => {
    expect( min([1, 2, "3"]) ).toEqual(1) 

  })
  it ('returns the minimum value as the integer inside of the string', () => {
    expect( min([-1, "a", "b", 4]) ).toEqual(-1)
  })
})
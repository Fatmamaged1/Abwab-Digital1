import mocha from 'mocha'
import chai from 'chai'
import expect from 'expect'

import { max } from '../src/max'


describe( 'max', () => {
  it( 'gets the maximum value in an array of integers', () => {
    expect( max([3,10,6,7] ) ).toEqual(10)
  })
  it ('returns undefined if input is a boolean', () => {
  	expect( max(true) ).toEqual(undefined)
  })

  it ('returns undefined if input is a string', () => {
  	expect( max('Aileen') ).toEqual(undefined)

  }) 

  it ('returns undefined if input is null', () => {
  	expect( max(null) ).toEqual(undefined)

  })

  it ('returns undefined if input is undefined', () => {
  	expect( max(undefined) ).toEqual(undefined)

  })  

  it ('gets the maximum value in an array of mixed integers and integers stored as strings', () => {
  	expect( max([1, 2, "3"]) ).toEqual("3") 

  })
  it ('returns the maximum value as the integer inside of the string', () => {
  	expect( max([-1, "a", "b", 4]) ).toEqual(4)
  })
})
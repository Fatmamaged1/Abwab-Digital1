import mocha from 'mocha'
import chai from 'chai'
import expect from 'expect'

import { isObject } from '../src/isObject'

describe ('isObject', () => {
	it ('returns true if input is an Object',  () => {
	  expect(isObject({Name:'Lizz'})).toEqual(true)
	})

  it ('returns false if input is a Number', () => {
    expect( isObject(1) ).toEqual(false)
  })  

  it ('returns false if input is a string', () => {
    expect( isObject('Hello') ).toEqual(false)
  })
  it ( 'returns false if input is null', () => {
    expect( isObject( null ) ).toEqual(false)
  })
  it ( 'returns false if input is undefined', () => {
    expect( isObject( undefined ) ).toEqual(false)
  })
  it ( 'returns true if input is an array', () => {
    expect ( isObject( [1,2] ) ).toEqual(true)
  })
})




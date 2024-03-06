import mocha from 'mocha'
import chai from 'chai'
import expect from 'expect'

import { isFunction } from '../src/isFunction'


describe( 'isFunction', () => {
  it ( 'returns true if input is a Function', () => {
    expect( isFunction( (arg) => arg ) ).toEqual(true)
  })

  it ( 'returns false if input is a string', () => {
    expect( isFunction( 'Laka') ).toEqual(false)
  })

  it ( 'returns false if input is null', () => {
    expect( isFunction( null ) ).toEqual(false)
  })

  it ( 'returns false if input is undefined', () => {
    expect( isFunction( undefined ) ).toEqual(false)
  })

  it ( 'returns false if input is an object', () => {
    expect( isFunction( {name: 'Shaka'}) ).toEqual(false)
  })

})
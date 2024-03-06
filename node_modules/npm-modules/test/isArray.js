import mocha from 'mocha'
import chai from 'chai'
import expect from 'expect'

import { isArray } from '../src/isArray'

describe( 'isArray', () => {

  it( 'returns true if input is an Array', () => {
    expect( isArray( [1,2,3,4] ) ).toEqual(true)
  })

  it( 'returns false if input is a string', () => {
    expect( isArray( 'Shaka') ).toEqual(false)
  })

  it( 'returns false if input is null', () => {
    expect( isArray( null ) ).toEqual(false)
  })

  it( 'returns false if input is undefined', () => {
    expect( isArray( undefined ) ).toEqual(false)
  })

  it( 'returns false if input is an object', () => {
    expect( isArray( {name: 'Shaka'}) ).toEqual(false)
  })
})
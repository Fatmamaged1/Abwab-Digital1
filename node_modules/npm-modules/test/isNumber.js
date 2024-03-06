import mocha from 'mocha'
import chai from 'chai'
import expect from 'expect'

import { isNumber } from '../src/isNumber'


describe( 'isNumber', () => {
  it ( 'returns true if input is a number', () => {
    expect( isNumber(1)  ).toEqual(true)
  })

  it ( 'returns false if input is a string', () => {
    expect( isNumber( 'Laka') ).toEqual(false)
  })

  it ( 'returns false if input is null', () => {
    expect( isNumber( null ) ).toEqual(false)
  })

  it ( 'returns false if input is undefined', () => {
    expect( isNumber( undefined ) ).toEqual(false)
  })

  it ( 'returns false if input is an object', () => {
    expect( isNumber( {name: 'Shaka'}) ).toEqual(false)

  })
}) 
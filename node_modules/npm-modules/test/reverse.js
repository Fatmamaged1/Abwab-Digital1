import mocha from 'mocha'
import chai from 'chai'
import expect from 'expect'

import { reverse } from '../src/reverse'

describe( 'reverse', () => {


  it( 'returns reverse of array', () => {
    expect( reverse( [1,2,3,4] ) ).toEqual([4,3,2,1])
  })

  it( 'returns false if input is undefined', () => {
    expect ( reverse( undefined ) ).toEqual(false)
  })

  it( 'returns false if input is a string', () => {
    expect ( reverse( 'String!' ) ).toEqual(false)
  })
  
  it( 'returns false if input is an object', () => {
    expect ( reverse( {} ) ).toEqual(false)
  })


})
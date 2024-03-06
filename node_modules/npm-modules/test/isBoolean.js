import mocha from 'mocha'
import chai from 'chai'
import expect from 'expect'

import { isBoolean } from '../src/isBoolean'


describe( 'isBoolean', () => {

	it ( 'returns true if input is a Boolean', () => {
		expect( isBoolean( true ) ).toEqual(true)
	})

	it ( 'returns false if input is a string', () => {
		expect( isBoolean( 'Laka') ).toEqual(false)
	})

	it ( 'returns false if input is null', () => {
		expect( isBoolean( null ) ).toEqual(false)
	})

	it ( 'returns false if input is undefined', () => {
		expect( isBoolean( undefined ) ).toEqual(false)
	})

	it ( 'returns false if input is an object', () => {
		expect( isBoolean( {name: 'Shaka'}) ).toEqual(false)
	})

})
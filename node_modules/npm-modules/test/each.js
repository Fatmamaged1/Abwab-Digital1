import mocha from 'mocha'
import chai from 'chai'
import expect from 'expect'

import { each } from '../src/each'

describe( 'each', () => {

  it ('returns the original argument', () => {
    const doNothing = (item) => { return item }
    expect( each([0,1,2,3],doNothing) ).toEqual([0,1,2,3])
  })
  it ('iterates through an array and performs an action for each item', () => {
    let accumulator = 0
    const addNum = () => { accumulator += 1 }
    each([0,0,0,0], addNum)
    expect(accumulator).toEqual(4)
  })
  it ('iterates through an object and performs an action for each key', () => {
    let accumulator = 0
    const addNum = () => { accumulator += 1 }
    each({blah: 'woot',foo:'bar',bloop:'whatever'}, addNum)
    expect(accumulator).toEqual(3)
  })
  it ('iterates through a string and performs an action for each character', () => {
    let accumulator = ''
    const addNum = (item) => { accumulator += item  }
    each('hello', addNum)
    expect(accumulator).toEqual('hello')
  })

  it ('uses the array item as the first argument, index as the second argument', () => {
    let accumulator = ''
    const addItemIndex = (item, index) => { accumulator += item + index  }
    each(['a','b','c'], addItemIndex)
    expect(accumulator).toEqual('a0b1c2')
  })

})
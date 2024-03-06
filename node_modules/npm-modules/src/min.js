const min = input => {
  if (input instanceof Array) {
    let num 

    for (let i = 0; i < input.length; i++) {  
      if (!num || num > input[i]) {
        num = input[i]
      }
    }
    return num
  }
}

export { min }
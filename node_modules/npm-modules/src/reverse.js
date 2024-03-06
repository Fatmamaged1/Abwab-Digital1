const reverse = input => {
  if (input instanceof Array) {
    let newInput = []
    for(let i=0; i < input.length; i++) {
      newInput.unshift(input[i]) 
    }  
    return newInput
  } else {
    return false
  } 
}

export { reverse }
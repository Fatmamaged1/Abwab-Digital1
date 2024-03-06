const toArray = (input => {
  let newInput = []
  if (input instanceof Array) {
    return input
  } else if (typeof input  === "object") {
    for (let key in input) {
      if (input.hasOwnProperty(key)) {
        newInput.push(input[key]) 
      } 
    } 
   
  } else if (typeof input === "string") {
    for (let i=0; i < input.length; i++){
      newInput.push(input[i])
    } 
  }
  return newInput 
  
})

export { toArray }

const flatten = (collection) => {

  let output = []
  if (collection instanceof Array || typeof collection === 'string') {
    for (let i=0;i < collection.length; i++) { 
      if (collection[i] instanceof Array) {
        let subArray = collection[i]
        for (let j=0;j < subArray.length; j++) {
          output.push(subArray[j])
        }
      } else {
        output.push(collection[i])
      }

    }
  }
  return output
}

export { flatten } 
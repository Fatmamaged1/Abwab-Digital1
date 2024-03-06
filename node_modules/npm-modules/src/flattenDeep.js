export const flattenDeep = (collection) => {
  if(typeof collection === 'string') {
    return collection.split('')
  }
  let result = []
  if (Array.isArray(collection)) {
    for (let i=0;i < collection.length; i++) { 
      if (Array.isArray(collection[i])) {
        const flattened = flattenDeep(collection[i])
        result = result.concat(flattened)
      } else {
        result.push(collection[i])
      }

    }
  }
  return result
}

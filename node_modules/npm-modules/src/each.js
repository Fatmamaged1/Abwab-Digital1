const each = (collection, callback) => {
  if (collection instanceof Array || typeof collection === 'string' ) {
    for (let i=0;i < collection.length; i++) {
      callback(collection[i],i)
    }
  } else if (collection && typeof collection === "object") {
    let keys = Object.keys(collection)
    for (let i=0; i < keys.length; i++) {
      callback(collection[keys[i]],keys[i]) 
    }
  }
  return collection
}

export { each }
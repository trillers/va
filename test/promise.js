var promise = Promise.resolve(1);

promise.then(function(result){
    return '123'
})

promise.then(function(result){
    console.log(result)
})
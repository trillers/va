var Promise = require('bluebird')
function test(){
    return new Promise(function(){

    })
}
console.log(test() instanceof Promise)
var Promise = require('bluebird')
function A(){

}
var pro = A.prototype;
pro.stop = Promise.promisify(function(callback){
    setTimeout(function(){
        callback();
    })
});

var a = new A();
a.stop().then(function(){
    console.log('ok')
});
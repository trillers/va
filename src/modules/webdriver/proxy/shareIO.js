var Queue = require('l-mq');
var queue = new Queue(1);
/**
 * allow operation that is IO to serial execute
 * @param options {shareIO: boolean}
 * @param source the obj wanna proxy
 */
module.exports = function buildProxy(webdriver, source, options){
    for(var subClazz in source){
        source[subClazz].forEach(function loopSource(method){
            var proto = webdriver[subClazz]['prototype'];
            var methodOrigin = proto[method];
            proto[method] = function(){
                var self = this;
                var args = [].slice.call(arguments, 0);
                var driver = null;
                (self instanceof webdriver.WebDriver) && (driver = self) || (driver = self.getDriver());
                return driver.controlFlow().execute(function(){
                    return new webdriver.promise.Promise(function operationEnqueue(resolve, reject){
                        queue.enqueue(
                            function task(cb){
                                var promise = methodOrigin.apply(self, args);
                                promise.then(function(result){
                                    resolve(result);
                                    cb();
                                })
                                .thenCatch(function(e){
                                    reject(e);
                                })
                            }
                        )
                    });
                });
            }
        })
    }
};
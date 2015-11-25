module.exports = function(driver, locator, timeout, options) {
    //example: {method:'getText', args:'xx', expect:'xx'}
    var result = false;
    return driver.wait(function(){
        return driver.isElementPresent(locator)
            .then(function(item){
                if(!result && item && !options){
                    return result = true;
                }
                if(!result && item && options){
                    return driver.findElement(locator)
                        .then(function(item){
                            if(options.method in item){
                                return item[options.method].call(item, options.args)
                                    .then(function(value){
                                        if(options.expect == value){
                                            return result = true;
                                        }
                                    })
                            }else{
                                throw new Error('has no such method');
                            }
                        })
                }
            })
            .thenCatch(function(e){
                console.error(e)
            })
        return result;
    }, timeout);
};

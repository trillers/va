var webdriver = require('selenium-webdriver');
//var Error = require('selenium-webdriver/error')
var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .setControlFlow(new webdriver.promise.ControlFlow())
    .build();
var Macros = require('../src/app/macros');
var macros = new Macros();

function get(callback){
    macros.scheduleMacros(getTest, null, callback)
}
function getTest(callback){
    driver.call(function(){
        driver.get('http://www.baidu.com');
        driver.call(function(){
            console.log("test begin")
        });
        driver.findElement({css: '#kw'}).sendKeys('ok');
        driver.getTitle().then(function(title){
            return webdriver.promise.rejected(new webdriver.error.Error(801, 'xx'));
        });
        macros.scheduleCommand(testError, driver, function(){
            return driver.call(function(){
                console.log('undo1 is invoked')
            })
        }, '123');
        driver.get('http://www.baidu.com')
        driver.call(callback);
    })
    .thenCatch(function(e){
        callback(e)
    })

}
get(function(e){
    console.log(e)
    console.log('xxx')
});
function testError(){
    return webdriver.promise.rejected(new webdriver.error.Error(800, 'xx'))
}

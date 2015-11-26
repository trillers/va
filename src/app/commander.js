var webdriver= require('selenium-webdriver');
var chromeDriver= require('selenium-webdriver/chrome');
var options = new chromeDriver.Options();
options.addArguments('--lang=en_US');
options.setUserPreferences({'intl.accept_languages': 'zh_CN'});
options.addArguments('--disable-user-media-security=true');
var driver = new webdriver.Builder()
    .withCapabilities(options.toCapabilities())
    .setControlFlow(new webdriver.promise.ControlFlow())
    .build();
driver.get('http://www.baidu.com');
driver.findElement({css: '#ee'}).thenCatch(function(){
    
});
driver.sleep(30000000);
driver.quit();


function mixin(target, source){
    for(var prop in source){
        target[prop] = source[prop]
    }
}
var webdriver = require('selenium-webdriver');
var self = {}
var getBroker = require('../../src/modules/wechat-broker');
self.driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
    .build();

setTimeout(function(){
    process.nextTick(function(){
        self.driver.get('http://www.baidu.com');
        self.driver.sleep(1000);
        self.driver.quit();
        self.driver = new webdriver.Builder()
            .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
            .build();
        self.driver.get('http://www.baidu.com');
    })
}, 3000);
console.log("ok");

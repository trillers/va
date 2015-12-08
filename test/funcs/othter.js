//var webdriver = require('selenium-webdriver');
//var self = {}
//self.driver = new webdriver.Builder()
//    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
//    .build();
//
//self.driver.get('http://www.baidu.com');
//self.driver.sleep(1000);
//self.driver.quit();
//self.driver = new webdriver.Builder()
//    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
//    .build();
//self.driver.get('http://www.baidu.com');
exports.test1 = function test1(){
    console.log("~~~");
}
function test2(){
    test1();
}
exports.test2 =test2
    test2()
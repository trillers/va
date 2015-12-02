var webdriver = require('selenium-webdriver');
var Error = require('selenium-webdriver/error')
var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .setControlFlow(new webdriver.promise.ControlFlow())
    .build();

console.log(Error)


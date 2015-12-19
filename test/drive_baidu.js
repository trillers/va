var webdriver = require('selenium-webdriver');
var driver = new webdriver.Builder()
    .withCapabilities(options.toCapabilities())
    .setControlFlow(new webdriver.promise.ControlFlow())
    .build();

driver.call(function(){console.info('start to request baidu')});
driver.get('https://www.baidu.com');
driver.getTitle.then(function(title){ console.info('test successful, title is ' + title)});
driver.quit();
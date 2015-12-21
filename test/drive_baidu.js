var webdriver = require('selenium-webdriver');
var chromeDriver = require('selenium-webdriver/chrome');
var chromeCapabilities = webdriver.Capabilities.chrome();
var options = chromeDriver.Options.fromCapabilities(chromeCapabilities);
options.addArguments('--lang=en_US');
options.addArguments('--disable-user-media-security=true');
options.addArguments('--disable-extensions=true');
options.setUserPreferences({'intl.accept_languages': 'zh_CN'});
var driver =  new webdriver.Builder()
    .withCapabilities(options.toCapabilities())
    .setControlFlow(new webdriver.promise.ControlFlow())
    .build();

driver.call(function(){console.info('start to request baidu')});
driver.get('https://www.baidu.com');
driver.getTitle().then(function(title){ console.info('test successful, title is ' + title)});
driver.quit();
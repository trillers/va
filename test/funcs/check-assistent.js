var webdriver = require('selenium-webdriver');
var macrosFactory = require('../../src/app/macros');
var editorLocator = webdriver.By.css('#editArea');
var sendLocator = webdriver.By.css('.dialog_ft .btn_primary');
var loadingLocator = webdriver.By.css('.ngdialog-content .dialog_bd .loading');
var imgLocator = webdriver.By.css('.ngdialog-content .dialog_bd img:nth-child(2)');
var request = require('request');
var j = request.jar();
var util = require('../../src/modules/util/myutil');
var readProfileHelper = require('../../src/modules/wechat-agent/funcs/read-profile');
var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
    .build();
var target = '酒剑仙';
var hostHeaderImgLocator = webdriver.By.css('div.main .panel .header .avatar img');
var macros = macrosFactory();
var Iconv = require('iconv').Iconv;
var jschardet = require('jschardet');
var spiderContactListInfo = require('../../src/modules/wechat-agent/funcs/contact-list').bind({driver: driver});

driver.get('http://wx.qq.com');
driver.wait(webdriver.until.elementLocated(webdriver.By.css('.nickname span')));
driver.sleep(2000);
driver.wait(function(){
    return driver.findElement({css: '.nickname span'})
        .then(function(span){
            return span.getText()
        })
        .then(function(txt){
            if(txt != ""){
                return true;
            }
            return false;
        })
        .thenCatch(function(){

        })
});
driver.sleep(10000);
driver.manage().getCookies().then(function(cookies){
    cookies.forEach(function(cookie){
        var requestCookie = request.cookie(cookie.name + '=' + cookie.value);
        j.setCookie(requestCookie, 'http://wx.qq.com');
    });
});
driver.findElement({css: '.top'}).click();
//driver.findElement({css: '#editArea'}).sendKeys('A0000海清✅钢铁团队创始人');
driver.call(spiderContactListInfo, {driver:driver}, function(err, list){
    console.log(list);
    console.warn(list.length)
});


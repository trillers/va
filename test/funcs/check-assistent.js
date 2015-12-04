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

function checkHost(data, callback){
    before();
    middle(data).then(function(data){
        console.log(data)
    });
    macros.scheduleCommand(after, driver, function(){
        var nav = new webdriver.WebDriver.Navigation(driver);
        nav.refresh();
    })
        .then(function(){
            callback(null)
        })
        .thenCatch(function(e){
            callback(e)
        })
}

macros.scheduleMacros(checkHost, null, {
    place: 'xxx',
    nickname: '小小星星妹',
    headimgid: 'xxx',
    sex: 1
}, function(err, data){
    console.log(err);
    console.log("ok");
    if(e.message === 'no such session'){
        console.log("boom!!!!!!!!");
    }
});

function middle(profile){
    var obj = {};
    var profileData = {};
    driver.findElement(hostHeaderImgLocator).click();
    driver.sleep(500);
    driver.call(function(){
        obj.driver = driver;
    });
    driver.call(readProfileHelper.readPlace, obj, profileData);
    driver.call(readProfileHelper.readSex, obj, profileData);
    driver.call(readProfileHelper.readNickname, obj, profileData);
    driver.call(readProfileHelper.readRemark, obj, profileData);
    driver.call(readProfileHelper.readHeadImgAsync, obj, profileData);
    return driver.call(function(){
        console.log("profile**************");
        util.objExclude(profileData, 'botid');
        console.log(profileData);
        var rate = util.objMatchRate(profile, profileData);
        console.log("match rate***********");
        console.log(rate);
        return rate >= 75
    })
}

function before(){
    driver.get('http://wx.qq.com');
    driver.wait(webdriver.until.elementLocated(webdriver.By.css('.nickname span')));
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
    });
    driver.sleep(5000);
    driver.manage().getCookies().then(function(cookies){
        cookies.forEach(function(cookie){
            var requestCookie = request.cookie(cookie.name + '=' + cookie.value);
            j.setCookie(requestCookie, 'http://wx.qq.com');
        });
    });
}

function after(){
    driver.sleep(3000);
    var searchInput = driver.findElement(webdriver.By.className('frm_search'));
    searchInput.sendKeys(target);
    driver.sleep(1000);
    driver.findElements({'css': 'div.contact_item.on'}).then(function(items){
        console.log(items);
        //return webdriver.promise.rejected(new webdriver.error.Error(400, 'no element'));
        return items[0].click()
    });
    var editEl = driver.findElement(webdriver.By.css('#editArea'));
    return driver.call(function(){
        console.log("ready to send");
    });
}
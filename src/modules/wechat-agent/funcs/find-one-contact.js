var webdriver = require('selenium-webdriver');
var MYERROR = require('../settings/myerror');
//external services
var reset = require('./reset-pointer');
//locators
var searchLocator = webdriver.By.className('frm_search');

module.exports = function(){
    var self = this;
    var driver = self.driver;
    var target = self.sendTo;
    var searchItem = driver.findElement(searchLocator);
    searchItem.sendKeys(target);
    driver.call(function(){
        console.log('[flow]: search keys '+ target);
        return self.driver.sleep(1000);
    });
    var collection = driver.findElements(webdriver.By.css('div.contact_item.on'));
    return webdriver.promise.map(collection, function(item, index, arr){
        if(arr.length <= 0){
            //no search contact to send
            return webdriver.promise.rejected(new webdriver.error.Error(MYERROR.NO_SUCH_CONTACT.code, MYERROR.NO_SUCH_CONTACT.msg))
        }
        var nickNameEl = item.findElement({'css': 'h4.nickname'});
        var nickNameTxt = nickNameEl.getText();
        driver.call(function(){
            if(nickNameTxt === target){
                nickNameEl.click();
            }
            else if(index === arr.length-1){
                console.warn('[flow]: user does not exist')
                searchItem.clear();
                driver.findElement(webdriver.By.css('.header')).click();
                driver.call(reset)
                    .thenCatch(function(err){
                        console.warn('[flow]: Failed to clear search input');
                        return webdriver.promise.rejected(new webdriver.error.Error(MYERROR.NO_RESULT.code, MYERROR.NO_RESULT.msg))
                    })
            }else{
                //unknow error
                console.error('[flow]: process stop error: unknown error');
                return webdriver.promise.rejected(new webdriver.error.Error(MYERROR.UNKNOWN_ERROR.code, MYERROR.UNKNOWN_ERROR.msg))
            }
        })
    })
    .thenCatch(function(e){
        if(e.code != MYERROR.NO_RESULT.code){
            return console.error(e);
        }
        return webdriver.promise.rejected(new webdriver.error.Error(e))
    })
};
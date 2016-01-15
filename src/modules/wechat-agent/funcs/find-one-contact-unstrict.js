var webdriver = require('selenium-webdriver');
var MYERROR = require('../settings/myerror');
var extractNickname = require('../../util/extractNickname');
var searchLocator = webdriver.By.className('frm_search');

module.exports = function(sendTo){
    var self = this;
    var driver = self.driver;
    var target = self.sendTo || sendTo;
    var searchItem = driver.findElement(searchLocator);
    var collection = null;
    searchItem.sendKeys(target);
    driver.call(function(){
        console.log('[flow]: search keys '+ target);
        return self.driver.sleep(1000);
    });
    driver.findElements(webdriver.By.css('div.contact_item.on')).then(function(coll){
        if(coll && coll.length>0){
            collection = coll;
        }else{
            return webdriver.promise.rejected(new webdriver.error.Error(MYERROR.NO_SUCH_CONTACT.code, MYERROR.NO_SUCH_CONTACT.msg))
        }
    });
    driver.call(function(){
        return webdriver.promise.map(collection, function(item, index, arr){
                if(arr.length <= 0){
                    //no search contact to send
                    return webdriver.promise.rejected(new webdriver.error.Error(MYERROR.NO_SUCH_CONTACT.code, MYERROR.NO_SUCH_CONTACT.msg))
                }
                var refinedNickname = null;
                var nicknameEl = item.findElement({'css': 'h4.nickname'});
                nicknameEl.getInnerHtml()
                    .then(function(nickname){
                        refinedNickname = extractNickname(nickname);
                    });
                driver.call(function(){
                    if(refinedNickname === target){
                        return nicknameEl.click();
                    }
                    else if(index === arr.length-1){
                        console.warn('[flow]: user does not exist')
                        searchItem.clear();
                        driver.findElement(webdriver.By.css('.header')).click();
                        driver.call(function(){
                            return webdriver.promise.rejected(new webdriver.error.Error(MYERROR.NO_RESULT.code, MYERROR.NO_RESULT.msg))
                        });
                    }
                })
            })
            .thenCatch(function(e){
                console.warn('Failed to find the contact');
                return webdriver.promise.rejected(new webdriver.error.Error(e))
            })
    })

};
var webdriver = require('selenium-webdriver');
var settings = require('../../../app/settings');
var receiveRestLocator = webdriver.By.css('div.chat_list div.top');
var searchLocator = webdriver.By.className('frm_search');
var nameLocator = webdriver.By.css('div.main .panel .header .info');

module.exports = function(callback){
    var driver = !!(this instanceof webdriver.WebDriver) === true ? this : this.driver;
    var searchItem = driver.findElement(searchLocator);
    searchItem.clear();
    driver.findElement(nameLocator).click();
    callback && driver.call(callback, null, null);
    //var titleEL = driver.findElement(webdriver.By.className('title_name'));
    //return titleEL.getText()
    //    .then(function(title){
    //        if(title != settings.RESET_TITLE){
    //            var resetEl = driver.findElement(receiveRestLocator);
    //            resetEl.click();
    //            if(callback){
    //                driver.call(callback, null, null);
    //            }
    //        }
    //    })
    //    .thenCatch(function(err){
    //        console.error("[system]: Failed to reset in list [code]-------");
    //        console.error(err);
    //        if (callback) callback(err)
    //        //TODO -- serious error
    //    })
};
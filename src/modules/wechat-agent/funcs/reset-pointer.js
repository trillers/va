var webdriver = require('selenium-webdriver');
var settings = require('../../../app/settings');
var receiveRestLocator = webdriver.By.css('div.chat_list div.top');
var searchLocator = webdriver.By.className('frm_search');

module.exports = function(callback){
    var self = this;
    var searchItem = self.driver.findElement(searchLocator);
    searchItem.clear();
    var titleEL = self.driver.findElement(webdriver.By.className('title_name'));
    return titleEL.getText()
        .then(function(title){
            if(title != settings.RESET_TITLE){
                var resetEl = self.driver.findElement(receiveRestLocator);
                resetEl.click();
                if (callback) callback(null)
            }
        })
        .thenCatch(function(err){
            console.error("[system]: Failed to reset in list [code]-------");
            console.error(err);
            if (callback) callback(err)
            //TODO -- serious error
        })
};
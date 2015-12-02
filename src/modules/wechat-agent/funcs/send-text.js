var webdriver = require('selenium-webdriver');
var findOneContact = require('./funcs/find-one-contact');
var reset = require('./funcs/reset-pointer');

module.exports = function sendText(json, callback){
    var self = this;
    console.info("[transaction]: Begin to send message to the contact which bid is " + json.sendTo);
    self.sendTo = json.sendTo;
    var content = json.content;
    self.driver.call(findOneContact, self)
        .then(function(){
            console.info("[flow]: send text, Succeed to find the contact");
            var editEl = self.driver.findElement(webdriver.By.css('#editArea'));
            editEl.sendKeys(content)
                .thenCatch(function(e){
                    console.error('[flow]: send text, Failed to send key -> #editArea');
                    return webdriver.promise.rejected(e);
                });
            var sendInput = self.driver.findElement(webdriver.By.css('.btn_send'));
            sendInput.click()
                .then(function(){
                    console.info("[flow]: send text, send message successful");
                })
                .thenCatch(function(e){
                    console.error('[flow]: send text, Failed to click input -> .btn_send');
                    return webdriver.promise.rejected(e);
                });
            self.driver.call(reset, self);
            self.driver.call(callback, null, null);
        })
        .thenCatch(function (err) {
            console.warn("[flow]: send text, Failed to send text to the contact");
            console.warn(err);
            self.driver.call(reset, self);
            self.driver.call(callback, null, err);
        });
}

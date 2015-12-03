var webdriver = require('selenium-webdriver');
var findOneContact = require('./find-one-contact');
var reset = require('./reset-pointer');
var editorLocator = webdriver.By.css('#editArea');

module.exports = function sendImage(json, callback){
    var self = this;
    console.info("[transaction]: Begin to send image to the contact which bid is " + json.sendTo + " url is " + json.content);
    self.sendTo = json.sendTo;
    var content = json.content;
    self.driver.call(findOneContact, self)
        .then(function(){
            console.info("[flow]: send image, Succeed to find the contact");
            console.info('[flow]: send image, Start to send image to contact url is ' + content);
            var editEl = self.driver.findElement(editorLocator);
            editEl.click()
                .thenCatch(function(e){
                    console.error('[flow]: send image, Failed to click edit element -> #editArea');
                    return webdriver.promise.rejected(e);
                });
            var fileEl = self.driver.findElement(webdriver.By.name('file'));
            fileEl.sendKeys(content)
                .thenCatch(function(e){
                    console.error('[flow]: send image, Failed to set the file path to the input file');
                    return webdriver.promise.rejected(e);
                });
            self.driver.call(reset, self);
            self.driver.call(callback, null, null);
        })
        .thenCatch(function (err) {
            console.warn("[flow]: send image, Failed to find the contact");
            console.warn(err);
            self.driver.call(reset, self);
            self.driver.call(callback, null, err);
        });
};

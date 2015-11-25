var Queue = require('l-mq');
var queue = new Queue(1);
var webdriver = require('selenium-webdriver');
/**
 * add new method send image for webdriver element
 * @param options {shareIO: boolean}
 * @param source the obj wanna proxy
 */
if(typeof this.sendImage != 'function'){
    webdriver.WebElement.prototype.sendImage = function() {
        var self = this;
        queue.enqueue(function(cb){
            //check clipboard data
            if(checkClipboard()){
                self.sendKeys(webdriver.Key.chord(webdriver.Key.CONTROL, 'v'));
                cb(null);
            }else{
                cb(new Error('nothing in clipboard'));
            }
        });
    }
}else{
    console.warn('[system]: Failed to decorate webdriver, the method [sendImage] already exist')
}

function checkClipboard(){
    return true;
    //TODO
}
module.exports = null;

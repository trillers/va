var readProfileHelper = require('./read-profile');
var webdriver = require('selenium-webdriver');
var hostHeaderImgLocator = webdriver.By.css('div.main .panel .header .avatar img');
var resetLocator = webdriver.By.css('div.main .panel .header .info');

module.exports = function(){
    var profileData = {};
    var driver = this.driver;
    var me = this;
    driver.findElement(hostHeaderImgLocator).click();
    driver.sleep(500);
    driver.call(readProfileHelper.readPlace, me, profileData);
    driver.call(readProfileHelper.readSex, me, profileData);
    driver.call(readProfileHelper.readNickname, me, profileData);
    driver.call(readProfileHelper.readRemark, me, profileData);
    driver.call(readProfileHelper.readHeadImgAsync, me, profileData)
    return driver.findElement(resetLocator).click()
        .then(function(){ return profileData;})
};
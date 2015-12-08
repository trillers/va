var expectRate = 75;
var readProfileHelper = require('./read-profile');
var webdriver = require('selenium-webdriver');
var hostHeaderImgLocator = webdriver.By.css('div.main .panel .header .avatar img');

module.exports = function(self, profile){
    var profileData = {};
    var driver = this.driver;
    driver.findElement(hostHeaderImgLocator).click();
    driver.sleep(500);
    driver.call(readProfileHelper.readPlace, driver, profileData);
    driver.call(readProfileHelper.readSex, driver, profileData);
    driver.call(readProfileHelper.readNickname, driver, profileData);
    driver.call(readProfileHelper.readRemark, driver, profileData);
    driver.call(readProfileHelper.readHeadImgAsync, driver, profileData);
    return driver.call(function(){
        console.log("profile**************");
        util.objExclude(profileData, 'botid');
        console.log(profileData);
        var actualRate = util.objMatchRate(profile, profileData);
        return actualRate >= expectRate
    })
};
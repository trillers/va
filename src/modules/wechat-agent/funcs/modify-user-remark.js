var codeService = require('../../util/codeService');

module.exports = function _modifyRemarkAsync(self, codeTmp){
    var item, code, nickName;
    if(!codeTmp){
        code = codeService.fetch();
    }
    return self.driver.findElement({'css' :'#mmpop_profile >div.profile_mini >div.profile_mini_bd'})
        .then(function(itemtmp){
            item = itemtmp;
            return item.findElement({'css': 'div.nickname_area h4'})
                .then(function(h4El){
                    return h4El.getText()
                })
                .then(function(txt){
                    console.log("-----------------------");
                    console.log(txt);
                    return nickName = txt;
                })
        })
        .then(function(){
            return item.findElement({'css': 'div.meta_area p[contenteditable]'})
        })
        .then(function(itemp){
            return self.driver.sleep(200)
                .then(function(){
                    return itemp.click()
                        .then(function(){
                            return self.driver.executeScript('window.document.querySelector("div.meta_area p[contenteditable]").innerText = "";')
                        })
                        .then(function(){
                            return itemp.sendKeys(code)
                        })
                        .then(function(){
                            return self.driver.sleep(500)
                        })
                        .then(function(){
                            return self.driver.executeScript('window.document.querySelector("div.meta_area p[contenteditable]").blur();')
                        })
                        .then(function(){
                            return self.driver.findElement({css: '#mmpop_profile .avatar .img'})
                                .then(function(img){
                                    return img.click();
                                })
                        })
                        .then(function(){
                            console.log("modify remark ok");
                            return self.driver.sleep(1000)
                        })
                })
        })
        .then(function(){
            return self.driver.findElement({css: '#mmpop_profile >div.profile_mini >div.profile_mini_bd a'})
                .then(function(plusBtn){
                    console.log("prepare to click plus btn");
                    return plusBtn.click();
                })
                .then(function(){
                    console.log("btn clicked");
                    return {
                        code: code,
                        nickName: nickName
                    };
                })
                .thenCatch(function(e){
                    console.log('err occur---------');
                    console.error(e);
                });
        })
        .thenCatch(function(err){
            console.log("Failed to modify remark [code]---------")
            console.log(err)
        })
}
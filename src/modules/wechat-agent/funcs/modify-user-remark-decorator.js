var modifyRemark = require('./modify-user-remark');
var codeService = require('../../util/codeService');
var webdriver = require('selenium-webdriver');

module.exports = function(self, codeTmp, parentItem){
    var item, code, nickName;
    if(!codeTmp){
        code = codeService.fetch();
    }
    //get user,s nickname and area
    return self.driver.findElement({'css' :'#mmpop_profile >div.profile_mini >div.profile_mini_bd'})
        .then(function(itemtmp){
            item = itemtmp;
            return item.findElement({'css': 'div.nickname_area h4'})
                .then(function(h4El){
                    return h4El.getText()
                })
                .then(function(txt){
                    console.log("[flow]:contact user,s nickname is " + txt);
                    return nickName = txt;
                })
        })
        .then(function(){
            //click the plus btn
            return self.driver.sleep(1000)
                .then(function(){
                    return self.driver.findElement({css: 'a.opt.ng-scope'})
                })
                .then(function(plusBtn){
                    console.log("[flow]:prepare to click plus btn");
                    return plusBtn.click()
                        .thenCatch(function(e){
                            console.error('Failed to click the plus btn')
                            console.error(e)
                        })
                })
                .thenCatch(function(e){
                    console.log('err occur---------');
                    console.error(e);
                });
        })
        .then(function(){
            //click back to the user
            return self.driver.sleep(1000)
                .then(function(){
                    console.log("[flow]:plus btn is clicked");
                    return parentItem.click()
                        .thenCatch(function(e){
                            console.error('Failed to click the parent btn')
                            console.error(e)
                        })
                })
        })
        .then(function(){
            console.log("[flow]:parent btn is clicked");
            //add remark
            return self.driver.findElement({'css': 'div.meta_area p[contenteditable]'})
        })
        .then(function(itemp){
            return self.driver.sleep(200)
                .then(function(){
                    return itemp.click()
                        .then(function(){
                            return self.driver.findElement({css: 'div.meta_area p[contenteditable]'})
                        })
                        .then(function(remarkEl){
                            return remarkEl.getText()
                        })
                        .then(function(remark){
                            if(remark === '点击修改备注' || 'Click to edit alias'){
                                code = nickName;
                            } else {
                                code = remark;
                            }
                            return self.driver.findElement({css: '#mmpop_profile .avatar .img'})
                                .then(function(img){
                                    return img.click();
                                })
                        })
                        .then(function(){
                            console.log("[flow]:modify remark ok");
                            return self.driver.sleep(1000)
                        })
                        .then(function(){
                            console.log("btn clicked");
                            return {
                                code: code,
                                nickName: nickName
                            };
                        })
                })
        })
        .thenCatch(function(err){
            console.log("Failed to modify remark [code]---------")
            console.log(err)
        })


};
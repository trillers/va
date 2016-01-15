var extractNickname = module.exports = function(nickname){
    if(!nickname || typeof nickname === 'string' && nickname.trim() === ''){
        return null;
    }
    var fragments = nickname.split(/<img.*?<\/img>|<img.*?>|<img.*?\/>/);
    if(!fragments.length){
        return null;
    }
    var result = fragments.reduce(function(curr, next){
        return next.length>curr.length ? next:curr
    });
    if(result.length<2){
        return null;
    }
    return result;
};

/**
 * Test
 */
var assert = require('chai').assert;
if(require.main == module){
    var testStr1 = 'ᖭི༏ᖫྀ芭缇丽人<img class="emoji emoji2122" text="_web" src="/zh_CN/htmledition/v2/images/spacer.gif">vvv<img class="emoji emoji1f459" text="_web" src="/zh_CN/htmledition/v2/images/spacer.gif"><img class="emoji emoji1f459" text="_web" src="/zh_CN/htmledition/v2/images/spacer.gif">';
    assert.ok(extractNickname(testStr1).length);
}

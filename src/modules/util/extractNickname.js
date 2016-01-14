var extractNickname = module.export = function(nickname){
    if(!nickname || typeof nickname === 'string' && nickname.trim() === ''){
        return null;
    }
    var fragments = nickname.split(/<img.*?<\/img>/);
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
    var testStr1 = 'A0000海清✅钢铁团队创始人'+
        '<img class="emoji emoji1f4aa" text="_web" src="xx"></img>'+
        'xxxx';
    var testStr2 = 'x'+
        '<img class="emoji emoji1f4aa" text="_web" src="xx"></img>'+
        'y';
    var refinedNickname1 = extractNickname(testStr1);
    var refinedNickname2 = extractNickname(testStr2);
    console.log(refinedNickname1);
    console.log(refinedNickname2);
    assert.ok(refinedNickname1.length === 15);
    assert.notOk(refinedNickname2);
}
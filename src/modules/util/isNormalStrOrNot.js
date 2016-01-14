module.exports = function(str){
    var reg = /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g;
    return reg.test(str) && normalStrTest(str);
};
function normalStrTest(str){
    var result = false;
    for(var i=0, len=str.length; i<len; i++){
        if(parseInt(str.charCodeAt(i).toString(16), 16) >= 0xD800){
            result = true
        }
    }
    return result;
}
module.exports = function(str){
    var reg = /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g;
    return reg.test(str);
};
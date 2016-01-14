//var test = '\uFFFD';
var bytelike= unescape(encodeURIComponent('😈你好'));
var reg = /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g;
var characters= decodeURIComponent(escape(bytelike));
function cleanString(input) {
    var output = "";
    console.log(input.length)
    for (var i=0; i<input.length; i++) {
        console.log(input.charCodeAt(i));
        if (input.charCodeAt(i) <= 127) {
            output += input.charAt(i);
        }
    }
    return output;
}
function clearString2(str){
    var output = '';
    while (++index < length) {
        // ...
        if (charCode >= 0xD800 && charCode <= 0xDBFF) {
            output.push(character + string.charAt(++index));
        } else {
            output.push(character);
        }
    }
}
//clearString2(characters);
function test(str){
    var result = false;
    for(var i=0, len=str.length; i<len; i++){
        console.warn(str.charCodeAt(i))
        if(parseInt(str.charCodeAt(i).toString(16), 16) >= 0xD800){
            result = true
        }
    }
    return result;
}
var ss = 'A0000海清✅钢铁团队创始人'+
    '<img class="emoji emoji1f4aa" text="_web" src="/zh_CN/htmledition/v2/images/spacer.gif"></img>'+
        'xxxx';
var arr = ss.split(/<img.*<\/img>/);
console.log(test(arr[0]));
console.log(test(arr[1]));
console.log(test('😈你好'));
console.log("~~~~~~")
var test = ()=>{
    console.log('1111');
    console.log('😈你好');
    console.log('💯')
};
test();
//var result = test('Aa. 斐阿杀酷酷哒🙈');
//console.log(result)

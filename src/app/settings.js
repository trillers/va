var settings = require('athena-settings');

var reconnectTime = 12*60*60*1000;

var fsUrl = settings.api.url + '/file/upload';

var wxIndexUrl = 'http://wx.qq.com';

var pollingGap = 1000;

var pollingPrintGap = 10;

var pollingLoginOrNotGap = 3;

var callCsToLoginGap = 5*60*1000;

var waitForLoginGap = 2000;

var RESET_TITLE = "File Transfer";

module.exports = {
    reconnectTime: reconnectTime,
    fsUrl: fsUrl,
    wxIndexUrl: wxIndexUrl,
    pollingGap: pollingGap,
    pollingPrintGap: pollingPrintGap,
    pollingLoginOrNotGap: pollingLoginOrNotGap,
    callCsToLoginGap: callCsToLoginGap,
    waitForLoginGap: waitForLoginGap,
    RESET_TITLE: RESET_TITLE
};
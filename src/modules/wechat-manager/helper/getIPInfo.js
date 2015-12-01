var os = require('os');
var IPv4 = null;

module.exports = function(){
    if(!IPv4){
        return IPv4;
    }
    switch (process.platform){
        case 'darwin':
            getMacIP();
            break;
        case 'linux':
            getUbuntuIP();
            break;
    }
    return IPv4;
};


function getUbuntuIP(){
    for(var i=0;i<os.networkInterfaces().eth0.length;i++){
        if(os.networkInterfaces().eth0[i].family=='IPv4'){
            IPv4=os.networkInterfaces().eth0[i].address;
        }
    }
}
function getMacIP(){
    for(var i=0;i<os.networkInterfaces().en0.length;i++){
        if(os.networkInterfaces().en0[i].family=='IPv4'){
            IPv4=os.networkInterfaces().en0[i].address;
        }
    }
}
var net = require('net');
var agentFactory = require('./wechat-agent');
var server = net.createServer(function(socket) {});
var agent = {};
var settings = require('./wechat-agent-settings');
var getBroker = require('../wechat-broker');
var MYERROR = require('./settings/myerror');
var CONST = require('vc').enum;
var STATUS = require('./settings/constant').STATUS;
var co = require('co');
var protectorBuilder = require('./wechat-agent-protector');
var _ =require('../util/myutil');

//connections never end
server.listen(8000);

//def ipc channel
var ipcChannel = {};

ipcChannel['start'] = startHandler;
ipcChannel['stop'] = stopHandler;
ipcChannel['snapshot'] = snapshotHandler;

process.on('message', function(cmd) {
    co(function*(){
        yield ipcChannel[cmd.method].apply(null, [cmd.args]);
    })
});
//process protector
process.on('uncaughtException', noop);
function noop(e){console.error(e)}

//def how to handle event from ipc
function* startHandler(args){
    try {
        agent = agentFactory(args.workerJson);
        process.removeListener('uncaughtException', noop);
        process.on('uncaughtException', protectorBuilder(agent));
        var actionsMap = {
            //one way
            'send-txt': {
                name: 'sendText',
                type: 'ow'
            },
            'send-img': {
                name: 'sendImage',
                type: 'ow'
            },
            'polling-list': {
                name: 'walkChatList',
                type: 'ow'
            },
            'sync-contacts': {
                name: 'contactList',
                type: 'ow'
            },
            //request/reply
            'profile-request': {
                name: 'readProfile',
                type: 'rr'
            },
            'sync-groups': {
                name: 'groupList',
                type: 'rr'
            },
            'cookies-request': {
                name: 'getCookies',
                type: 'rr'
            }
        };

        var broker = yield getBroker();

        setInterval(function () {
            broker.agent.heartbeat({
                CreateTime: (new Date()).getTime(),
                AgentStatus: agent.status,
                PId: agent.pid,
                AgentId: agent.id,
                NodeId: agent.managerId
            });
        }, settings.heartbeatGap);

        agent.onNeedLogin(function (err, data) {
            if (!err) {
                var msg = {
                    CreateTime: (new Date()).getTime(),
                    Action: 'need-login',
                    AgentId: data.botid,
                    MediaUrl: data.mediaUrl
                };
                console.log(msg);
                broker.agent.actionIn(msg);
            }
        });

        agent.onRemarkContact(function (err, data) {
            if (!err) {
                var msg = {
                    CreateTime: (new Date()).getTime(),
                    Action: 'remark-contact',
                    AgentId: agent.id,
                    Data: data
                };
                console.info("send vk a first contact event********");
                console.info(msg);
                broker.agent.actionIn(msg);
            }
        });

        agent.onFirstProfile(function (err, data) {
            if (!err) {
                var msg = {
                    CreateTime: (new Date()).getTime(),
                    Action: 'first-profile',
                    AgentId: agent.id,
                    Data: data
                };
                console.info("send vk a first profile event********");
                console.info(msg);
                broker.agent.actionIn(msg);
            }
        });

        agent.onLogin(function (err, data) {
            if (!err) {
                var msg = {
                    CreateTime: (new Date()).getTime(),
                    Action: 'login',
                    AgentId: data.botid
                };
                console.log(msg);
                broker.agent.actionIn(msg);
            }
        });

        agent.onReceive(function (err, msgArr) {
            if (!err) {
                console.error(err);
                return;
            }
            msgArr.forEach(function (msg) {
                broker.agent.actionIn(msg);
            })
        });

        agent.start(args.options, function (err) {
            if (err) {
                console.error("[system]: Failed to start agent id=" + args.workerJson.id);
                err && err.code && fatalErrFilter(err);
                console.error(err);
            }
            //TODO begin to polling
            console.log("[system]: agent is logged in, begin to polling id=" + args.workerJson.id);
            broker.agent.init(agent.id);

            broker.agent.onActionOut(function (err, data, msg) {
                if(_.arr.in([STATUS.ABORTED, STATUS.EXITED], agent.status)){
                    return console.warn('[system]: control flow is already destroyed');
                }
                var fn = agent[actionsMap[data.Action].name];
                var type = actionsMap[data.Action].type;
                var len = fn.length;
                if (len > 1) {
                    fn.call(agent, data, done)
                } else {
                    fn.call(agent, done)
                }
                function done(err, json) {
                    if (err) {
                        err && err.code && fatalErrFilter(err);
                    }
                    data.Data = json;
                    if (type === 'rr') {
                        broker.agent.actionIn(data);
                    }
                    broker.agent.finish(msg);
                    broker.agent.actionFeedback({
                        CreateTime: (new Date()).getTime(),
                        Action: data.Action,
                        AgentId: data.AgentId,
                        Took: (new Date()).getTime() - data.CreateTime,
                        Code: 200,
                        Decs: ''
                    });
                }
            }, agent.id);

            broker.agent.commandFeedback({
                CreateTime: (new Date()).getTime(),
                Command: CONST.NODE.COMMAND.START,
                AgentId: agent.id,
                Took: 0,
                Code: CONST.STATUS_CODE.SUCCESS,
                Desc: ''
            });
        });

    }catch (e){
        console.error(e)
    }
}

function* stopHandler(){
    try{
        console.log('agent ['+ agent.id +'] receive a stop command, prepare to exit');
        agent.stop()
            .then(function(){
                agent.transition(STATUS.EXITED);
                return new Promise(function(resolve, reject){
                    setTimeout(function(){
                        process.exit();
                        resolve();
                    }, 1000)
                })
            })
            .catch(function(){
                agent.transition(STATUS.EXITED);
                return new Promise(function(resolve, reject){
                    setTimeout(function(){
                        process.exit();
                        resolve();
                    }, 1000)
                })
            });
    }
    catch(e){
        console.log(e.message);
        e && e.code && fatalErrFilter(e);
    }
}

function* snapshotHandler(){
    var agent = yield agent.getSnapshotAsync();
    process.send({
        method: 'snapshot',
        args: {
            agent: agent,
            opts: agent.initialOptions
        }
    })
}

//Helpers
function fatalErrFilter(err) {
    Object.keys(MYERROR)
        .filter(function(currErr){
            return MYERROR[currErr].level == 3
        })
        .forEach(function(key){
            if(MYERROR[key].code == err.code){
                throw err;
            }
        });
}
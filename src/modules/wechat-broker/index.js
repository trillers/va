var brokerFactory = require('vc');
var settings = require('base-settings');
var amqp = require('amqplib');
var rbqUri = 'amqp://' + settings.rabbitmq.username + ':' + settings.rabbitmq.password + '@' + settings.rabbitmq.host + ':' + settings.rabbitmq.port + '/' + settings.rabbitmq.vhost;
var open = amqp.connect(rbqUri);
var tempSettings = require('../../app/settings');
var brokerCache = brokerFactory.create(open, {am: true, agent: true});

module.exports = function(app){
    return brokerCache.then(function(broker){
        app && app.emitter.emit('complete', {serviceName: tempSettings.services.RABBITMQ});
        return {
            agent: broker.getAgent(),
            agentManager: broker.getAgentManager()
        };
    })
};

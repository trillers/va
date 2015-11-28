var brokerFactory = require('vc');
var settings = require('base-settings');
var amqp = require('amqplib');
var rbqUri = 'amqp://' + settings.rabbitmq.username + ':' + settings.rabbitmq.password + '@' + settings.rabbitmq.host + ':' + settings.rabbitmq.port + '/' + settings.rabbitmq.vhost;
var open = amqp.connect(rbqUri);

var brokerAgent = {},
    brokerManager = {},
    brokerBot = {};

module.exports = function(app){
    brokerFactory.create(open).then(function(broker){
        brokerAgent = broker.getAgent();
        brokerManager = broker.getManager();
        brokerBot = broker.getBot();
        app.emit('complete', {serviceName: 'rabbitMQ'});
    });
    return {
        brokerAgent: brokerAgent,
        brokerManager: brokerManager,
        brokerBot: brokerBot
    };
};

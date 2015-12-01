module.exports = function(){
    var EventEmitter = require('events').EventEmitter;
    return {
        _services: {},
        _startupNum: 0,
        emitter: new EventEmitter(),
        start: function(fn){
            var self = this;
            self.emitter.on('allComplete', fn);
            self.emitter.on('complete',self._checkCompleteOrNot.bind(self));
        },
        _checkCompleteOrNot: function(data){
            var self = this;
            var totalNum = Object.keys(self._services).length;
            self._services[data.serviceName] = true;
            for(var name in self._services){
                self._services[name] && self._startupNum++
            }
            if(totalNum === self._startupNum){
                self.emitter.emit('allComplete');
            }
        },
        registerService: function(name){
            this._services[name] = false;
        }
    };
};

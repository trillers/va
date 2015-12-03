var webdriver = require('selenium-webdriver');
var macrosFactory = require('../../src/app/macros');
var assert = require('chai').assert;

describe('macros', function(){
    var driver = null;
    var macros = null;
    var mock = {
        node1: {
            exArg1: 'arg1',
            exArg2: 1,
            unArg1: {name: 'unArg1'},
            unArg2: 'unArg2'
        },
        node2: {
            exArg1: {name: 'exArg1'},
            exArg2: 1,
            unArg1: {name: 'unArg1'},
            unArg2: 'unArg2'
        }
    };
    it('error occur before checkpoint, nothing to do', function(done){
        driver = new webdriver.Builder()
            .withCapabilities(webdriver.Capabilities.chrome())
            .setControlFlow(new webdriver.promise.ControlFlow())
            .build();

        macros = macrosFactory();
        main(function(e){
            console.error(e.message);
            assert.ok(e);
            done();
        });

        function main(callback){
            macros.scheduleMacros(api, null, callback)
        }
        function api(callback){
            driver.call(function(){
                driver.get('http://www.baidu.com');
                driver.findElement({css: '#kw'}).sendKeys('ok');
                driver.findElement({css: '#xxx'}).sendKeys('not ok');
                macros.scheduleCommand(checkpoint1, driver, function(arg1, arg2){
                    assert.equal(arg1, mock.node1.unArg1);
                    assert.equal(arg2, mock.node2.unArg2);
                    driver.findElement({css: '#su'}).click();
                    driver.sleep(2000);
                    return driver.call(function(){ console.log('undo1 is invoked') })
                }, [mock.node1.exArg1, mock.node1.exArg2], [mock.node1.unArg1, mock.node1.unArg2]);
                driver.call(subMethod, driver);
                driver.findElement({css: '#su'}).click();
                driver.call(callback);
            })
                .thenCatch(function(e){
                    callback(e)
                })
        }
        function subMethod(){
            var driver = this;
            driver.findElement({css: '#kw'}).clear();
            macros.scheduleCommand(checkpoint2, driver, function(){
                driver.findElement({css: '#su'}).click();
                return driver.call(function(){ console.log('undo2 is invoked') })
            }, [mock.node2.exArg1]);
        }
        function checkpoint1(){
            console.log('fn1 is not ok');
            return webdriver.promise.rejected(new webdriver.error.Error(401, '123'))
        }
        function checkpoint2(arg){
            assert.equal(arg[0], mock.node2.exArg1);
            console.log('fn2 is not ok');
            return webdriver.promise.rejected(new webdriver.error.Error(402, '123'))
        }
    });

    it('checkpoint1 is failed, undo1 invoked', function(done){
        driver = new webdriver.Builder()
            .withCapabilities(webdriver.Capabilities.chrome())
            .setControlFlow(new webdriver.promise.ControlFlow())
            .build();

        macros = macrosFactory();
        main(function(e){
            console.error(e.message)
            assert.equal(e.code, 401);
            done();
        });

        function main(callback){
            macros.scheduleMacros(api, null, callback)
        }
        function api(callback){
            driver.call(function(){
                driver.get('http://www.baidu.com');
                driver.findElement({css: '#kw'}).sendKeys('ok');
                macros.scheduleCommand(checkpoint1, driver, function(arg1, arg2){
                    assert.equal(arg1, mock.node1.unArg1);
                    assert.equal(arg2, mock.node2.unArg2);
                    driver.findElement({css: '#su'}).click();
                    driver.sleep(2000);
                    return driver.call(function(){ console.log('undo1 is invoked') })
                }, [mock.node1.exArg1, mock.node1.exArg2], [mock.node1.unArg1, mock.node1.unArg2]);
                driver.call(subMethod, driver);
                driver.findElement({css: '#su'}).click();
                driver.call(callback);
            })
            .thenCatch(function(e){
                callback(e)
            })
        }
        function subMethod(){
            var driver = this;
            driver.findElement({css: '#kw'}).clear();
            macros.scheduleCommand(checkpoint2, driver, function(){
                driver.findElement({css: '#su'}).click();
                return driver.call(function(){ console.log('undo2 is invoked') })
            }, [mock.node2.exArg1]);
        }
        function checkpoint1(arg1, arg2){
            assert.equal(arg1, mock.node1.exArg1);
            assert.equal(arg2, mock.node1.exArg2);
            console.log('fn1 is not ok');
            return webdriver.promise.rejected(new webdriver.error.Error(401, 'controlflow failed at checkpoint1'))
        }
        function checkpoint2(arg){
            assert.equal(arg, mock.node2.exArg1);
            console.log('fn2 is not ok');
            return webdriver.promise.rejected(new webdriver.error.Error(402, 'controlflow failed at checkpoint2'))
        }
    });

    it('checkpoint2 is failed,  undo1 and undo2 invoked both', function(done){
        driver = new webdriver.Builder()
            .withCapabilities(webdriver.Capabilities.chrome())
            .setControlFlow(new webdriver.promise.ControlFlow())
            .build();

        macros = macrosFactory();
        main(function(e){
            console.error(e.message);
            assert.equal(e.code, 402);
            done();
        });

        function main(callback){
            macros.scheduleMacros(api, null, callback)
        }
        function api(callback){
            driver.call(function(){
                driver.get('http://www.baidu.com');
                driver.findElement({css: '#kw'}).sendKeys('ok');
                macros.scheduleCommand(checkpoint1, driver, function(arg1, arg2){
                    assert.equal(arg1, mock.node1.unArg1);
                    assert.equal(arg2, mock.node2.unArg2);
                    driver.findElement({css: '#su'}).click();
                    driver.sleep(2000);
                    return driver.call(function(){ console.log('undo1 is invoked') })
                }, [mock.node1.exArg1, mock.node1.exArg2], [mock.node1.unArg1, mock.node1.unArg2]);
                driver.call(subMethod, driver);
                driver.findElement({css: '#su'}).click();
                driver.call(callback);
            })
                .thenCatch(function(e){
                    callback(e)
                })
        }
        function subMethod(){
            var driver = this;
            driver.findElement({css: '#kw'}).clear();
            macros.scheduleCommand(checkpoint2, driver, function(){
                driver.findElement({css: '#su'}).click();
                return driver.call(function(){ console.log('undo2 is invoked') })
            }, [mock.node2.exArg1]);
        }
        function checkpoint1(){
            console.log('fn1 is ok');
        }
        function checkpoint2(arg){
            assert.equal(arg, mock.node2.exArg1);
            console.log('fn2 is not ok');
            return webdriver.promise.rejected(new webdriver.error.Error(402, 'controlflow failed at checkpoint2'))
        }
    });
});


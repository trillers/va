var test = [
    {
        name :' 111',
        sex: '1'
    },
    {
        name: 'dsaf'
    }
]
var arr = test.map(function(i){
    return i.name + 1
}).reduce(function(prev, next){
    console.log(prev)
});

console.log(arr)
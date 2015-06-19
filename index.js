var commander = require('commander');
var pkg = require('./package.json');
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var io = require('socket.io-client');

// Read the current application information
var filePath = path.resolve(process.cwd(), 'package.json');
var data = fs.readFileSync(filePath, 'utf8');
var appInfo = JSON.parse(data);

require('./src/deploy2');
// require('./src/new');

// version
commander.version(pkg.version);

// Setup all the commands
commander.parse(process.argv);


// listening on specific project build
var socket = io.connect('http://217.155.67.46:3001');
socket.on('connect', function(data){
  // console.log('\nSocket connected...\n');
});
socket.on('data', function(data){
  // TODO: the data buffer might be contains ansi color info?
  console.log(data.toString());
  // process.stdout.write(data);
});
socket.on('disconnect', function(){
  // console.log('closed')
});
socket.emit('listen', appInfo.name);
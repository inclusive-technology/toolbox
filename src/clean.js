var commander = require('commander');
var spawn = require('child_process').spawn;
var path = require('path');
var colors = require('colors');

commander
  .command('clean')
  .description('Clean up')
  .action(function(){
    console.log(colors.green('Start clean up...'));
    var filePath = path.resolve(__dirname, 'scripts/clean.sh');
    var operation = spawn('sh', [filePath]);
    operation.on('exit', function(code){
      console.log(colors.green('Clean up complete'));
    });
  });
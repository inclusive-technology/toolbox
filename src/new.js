var inquirer = require('inquirer');
var commander = require('commander');
var git = require('git');
var exec = require('child_process').exec;
var path = require('path');
var sequest = require('sequest');
var Client = require('ssh2').Client;

var map = {};
var shArguments = [];

// deploy command
commander
  .command('new <appName>')
  .description('Create a html boilerplate')
  .action(function(appName){

    map = {};
    shArguments = [];

    var conn = new Client();
    conn.on('ready', function() {
      console.log('Client :: ready');
      conn.exec('git', function(err, stream) {
          if (err) throw err;
          stream.on('close', function(code, signal) {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
          }).on('data', function(data) {
            console.log('STDOUT: ' + data);
          }).stderr.on('data', function(data) {
            console.log('STDERR: ' + data);
          });
        });
    }).connect({
      host: '10.0.0.85',
      port: 22,
      username: '',
      password: ''
    });




























    // dev().then(production).then(function(){
    //   runShellScript(appName)
    // });







    // console.log('Creating new app...')

    // // console.log(name);

    // var command = 'sh ' + path.join(__dirname, 'new.sh') + ' ' +
    //   name + ' ' +
    //   2 + ' ' +
    //   'param1' + ' ' +
    //   'param2' + ' ';

    // exec(command, function(error, stdout, stderr){
    //   if(error){
    //     console.log(error);
    //   }
    //   else{
    //     console.log(stdout)
    //   }
    // });
  });
commander.parse(process.argv);

function runShellScript(appName){
  // var numOfTargets = Math.ceil(shArguments.length/2);

  // var command = 'sh ' + path.join(__dirname, 'new.sh') + ' ' +
  //   appName + ' ' +
  //   numOfTargets + ' ' +
  //   shArguments.join(' ');

  // console.log(command);

  // exec(command, function(error, stdout, stderr){
  //   if(error){
  //     console.log(error);
  //   }
  //   else{
  //     console.log(stdout)
  //   }
  // });

  sequest(map['dev-deploy'].url, 'ls', function(error, stdout){
    if(error){
      throw error;
    }
    console.log(stdout);
  })
}

function dev(){
  return selectDeployment('dev-deploy').then(function(isSelected){
    if(isSelected){
      return setDetail('dev-deploy');
    }
    return false;
  })
}

function production(){
  return selectDeployment('production-deploy').then(function(isSelected){
    if(isSelected){
      return setDetail('production-deploy');
    }
    return false;
  })
}

function selectDeployment(targetName){
  return new Promise(function(resolve, reject){
    var questions = [
      {
        type: 'confirm',
        name: 'isSelected',
        message: 'Do you want to deploy to "'+targetName+'"',
        default: true,
      }
    ];

    inquirer.prompt(questions, function(answer){
      console.log(answer);
      resolve(answer['isSelected']);
    });
  });
}

function setDetail(targetName){
  return new Promise(function(resolve, reject){

    var urlQuestion = {
      type: 'input',
      name: 'url',
      message: 'Specify the SSH for remote ' + targetName + ': '
    };

    var passwordQuestion = {
      type: 'password',
      name: 'password',
      message: 'What is the password for remote ' + targetName + ': '
    }

    inquirer.prompt([urlQuestion, passwordQuestion], function(answers){
      map[targetName] = {
        // name: targetName,
        url: answers['url'],
        password: answers['password']
      };

      shArguments.push(answers['url']);
      shArguments.push(answers['password']);

      resolve(answers);
    });
  });
}
var inquirer = require('inquirer');
var commander = require('commander');
var ssh = require('./ssh');
var pkg = require('../package.json');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');

// Deployment map
var map = pkg.deployment;

// deploy command
commander
  .command('new <appName>')
  .description('Create a html boilerplate')
  .action(function(appName){
    // Validate directory
    var d = map['staging'].directory;
    if(d.charAt(d.length-1) !== '/'){
      map['staging'].directory = d + '/';
    }
    d = map['production'].directory;
     if(d.charAt(d.length-1) !== '/'){
      map['production'].directory = d + '/';
    }


    staging()
    .then(function(data){
      // console.log(map['staging'].host, data.username, data.password, map['staging'].port)
      return ssh.connect(map['staging'].host, data.username, data.password, map['staging'].port)
    })
    .then(function(){
      return ssh.new(appName, map['staging'].directory)
    })
    .then(function(){
      return production();
    })
    .then(function(data){
      var host = map['production'].host;
      var port = map['production'].port || 22;
      var directory = map['production'].directory;

      return ssh.connect(map['production'].host, data.username, data.password, map['production'].port)
    })
    .then(function(){
      return ssh.new(appName, map['production'].directory)
    })
    .then(function(){
      return setupLocalRepo(appName);
    })
    .then(function(success){
      if(success){
        customize(appName);
      }
    });

  });

function staging(){
  console.log('Staging SSH:')
  return setQuestionDetail('staging');
}

function production(){
  console.log('Production SSH:')
  return setQuestionDetail('production');
}

function setQuestionDetail(env){
  return new Promise(function(resolve, reject){

    var usernameQuestion = {
      type: 'input',
      name: 'username',
      default: 'zhengyi@inclusive',
      message: 'username: '
    };

    var passwordQuestion = {
      type: 'password',
      name: 'password',
      message: 'password: '
    }

    inquirer.prompt([usernameQuestion, passwordQuestion], function(answers){
      map[env].username = answers['username'];

      resolve(answers);
    });
  });
}

function setupLocalRepo(appName){
  console.log('Setup local repository, please wait...');
  return new Promise(function(resolve, reject){
    // var operation = exec('git', ['clone', '--progress', 'git@bitbucket.org:inclusive-activities/boilerplate.git', appName]);
    // var operation = exec('git clone git@bitbucket.org:inclusive-activities/boilerplate.git ' + appName)

    // var directoryPath = path.join(process.cwd(), appName);
    // var operation = exec('mkdir ' + appName + ' && git archive --remote="git@bitbucket.org:inclusive-activities/boilerplate.git" master | tar -x -C ' + directoryPath)

    // var directoryPath = path.join(process.cwd(), appName);
    // var operation = exec('git clone --depth 1 git@bitbucket.org:inclusive-activities/boilerplate.git ' + appName + ' && cd ' + directoryPath + ' && git remote rm origin');

    var directoryPath = path.join(process.cwd(), appName);
    var operation = exec('git init ' + directoryPath + ' && git archive --remote="git@bitbucket.org:inclusive-activities/boilerplate.git" master | tar -x -C ' + directoryPath);

    operation.stdout.on('data', function(data){
      console.log(data.toString());
    });
    operation.stderr.on('data', function(data){
      console.log(data.toString());
    });
    operation.on('exit', function(code){
      if(code === 0){
        console.log('Repository successfully created.');
        resolve(true);
      }
      else{
        console.log('An error has happened');
        console.log('Process existed: ' + code);
        resolve(false);
      }
    });
  });
}

function customize(appName){
  console.log('Updating package.json...')
  // console.log(path.join(process.cwd(), appName));
  var filePath = path.join(process.cwd(), appName, 'package.json');
  var data = fs.readFileSync(filePath, 'utf8');

  var appPkg = JSON.parse(data);
  appPkg.name = appName;
  appPkg.deployment = appPkg.deployment ? appPkg.deployment : {};
  appPkg.deployment.staging = {
    remote: 'ssh://' + map.staging.username + '@' + map.staging.host + map.staging.directory + appName + '.git'
  };
  appPkg.deployment.production = {
    remote: 'ssh://' + map.production.username + '@' + map.production.host + map.production.directory + appName + '.git'
  };

  fs.writeFileSync(filePath, JSON.stringify(appPkg, null, 2));

  console.log('Application successfully created.');
}
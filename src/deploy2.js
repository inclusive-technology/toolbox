var inquirer = require('inquirer');
var commander = require('commander');
var git = require('git');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var io = require('socket.io-client');

var repository = null;
var tagList = [];
var targetList = [];
var buildCommand;
var socket = null;

// deploy command
commander
  .command('deploy')
  .description('For deployment!')
  .option('-b --build_command <build_command>')
  .action(function(options){
    buildCommand = options.build_command;

    // Read the current application information
    var filePath = path.resolve(process.cwd(), 'package.json');
    var data = fs.readFileSync(filePath, 'utf8');
    var appInfo = JSON.parse(data);

    // listening on specific project build
    socket = io.connect('http://217.155.67.46:3001');
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


    openRepo()
    .then(function(){
      return getTags();
    })
    .then(function(){
      return getTargets();
    })
    .then(function(){
      var tagQuestion = {
        type: 'list',
        name: 'tag',
        message: 'Choose which tag to be deployed',
        choices: tagList
      };

      var targetQuestion = {
        type: 'list',
        name: 'target',
        message: 'Where to deploy to',
        choices: targetList,
      };

      inquirer.prompt([tagQuestion, targetQuestion], function(answers){
        deploy(answers.tag, answers.target);
      });
    })
  });

function openRepo(){
  return new Promise(function(resolve, reject){
    new git.Repo(process.cwd(), {is_bare: false}, function(error, repo){
      if(!error){
        repository = repo;
        resolve(repo);
      }
      else{
        reject(error)
      }
    })
  });
}

function getTags(){
  return new Promise(function(resolve, reject){
    repository.tags(function(error, tags){
      if(error){
        reject(error);
      }
      else{
        tagList = [];
        // Sort the tags in date order, most recent at the top
        tags.sort(function(a, b){

          var dateA = new Date(a.commit.committed_date);
          var dateB = new Date(b.commit.committed_date);
          return dateA < dateB ? 1 : -1;
        });



        for(var i in tags){
          tagList.push(tags[i].name);
        }

        if(tagList.length === 0){
          console.log('You do not have any tags to deploy yet!');
          reject(null);
        }
        else{
          resolve(tagList);
        }
      }
    });
  });
}

function getTargets(){
  return new Promise(function(resolve, reject){
    // Read the current application information
    var filePath = path.resolve(process.cwd(), 'package.json');
    var data = fs.readFileSync(filePath, 'utf8');
    var appInfo = JSON.parse(data);
    targetList = appInfo.targets;

    if(!targetList || targetList.length === 0){
      targetList = ['gerty', 'mygaze'];
    }

    resolve(targetList)
  });
}

function deploy(tag, target){
  var params = [
   'push',
   '-f',
   'origin',
   tag+':refs/heads/'+target
  ];

  // console.log('push to', tag);
  // stdio: 'inherit' retains the format information of the output.
  // var operation = spawn('git', params, {stdio: 'inherit', stdout: 'inherit'});
  var operation = spawn('git', params);
  operation.stdout.on('data', function(data){
    console.log(data.toString());
  })
  operation.stderr.on('data', function(data){
    console.log(data.toString());
    // TODO: exit the terminal!
  })
  operation.on('exit', function(code){
    if(code === 0){
      console.log('Branch successfully pushed.');
    }
    else{
      console.log('Branch push failed.');
    }
  });
}
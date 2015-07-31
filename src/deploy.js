var inquirer = require('inquirer');
var commander = require('commander');
var git = require('git');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var io = require('socket.io-client');
var url = require('url');
var colors = require('colors');

var tagList = [];
var targetList = [];
var appInfo = null;
var socket;

// deploy command
commander
  .command('deploy')
  .description('For deployment!')
  .option('-b --build_command <build_command>')
  .action(function(options){
    readPackageInfo();

    openRepo()
    .then(function(repo){
      return getTags(repo);
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
        // Connect to the correct server to get build messages output
        connectSocket(answers.tag, answers.target).then(function(){
          return deploy(answers.tag, answers.target);
        }).catch(function(error){
          console.log(error);
        });
      });
    })
  });

function readPackageInfo(){
  // Read the current application information
  var filePath = path.resolve(process.cwd(), 'package.json');
  var data = fs.readFileSync(filePath, 'utf8');
  appInfo = JSON.parse(data);
  return appInfo;
}

function openRepo(){
  return new Promise(function(resolve, reject){
    new git.Repo(process.cwd(), {is_bare: false}, function(error, repo){
      if(!error){
        resolve(repo);
      }
      else{
        reject(error);
      }
    })
  });
}

function getTags(repo){
  return new Promise(function(resolve, reject){
    repo.tags(function(error, tags){
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

        tagList.unshift('HEAD');

        if(tagList.length === 0){
          console.log('You do not have any tags to deploy yet!');
          reject();
        }
        else{
          resolve();
        }
      }
    });
  });
}

function getTargets(){
  return new Promise(function(resolve, reject){
    targetList = appInfo.deployments.map(function(value){
      return value.name;
    });

    resolve();
  });
}

function connectSocket(tag, target){
  return new Promise(function(resolve, reject){

    var deployInfo = appInfo.deployments.filter(function(value){
      return target === value.name;
    })[0];

    var urlData = url.parse(deployInfo.url);

    // listening on specific project build
    socket = io.connect(urlData.protocol + '//' + urlData.host);

    // // Manually check timeout, otherwise it will stuck there forever.
    // var timeoutID = setTimeout(function(){
    //   socket.disconnect();
    //   reject('Socket server timeout. Closing socket...');
    // }, 5000);

    socket.on('connect', function(data){
      console.log('\nSocket connected...\n');
      // clearTimeout(timeoutID);
      resolve();
    });
    socket.on('data', function(data){
      // TODO: the data buffer might be contains ansi color info?
      console.log(data.toString());
    });
    socket.on('timeout', function(data){
      reject();
    });
    socket.on('disconnect', function(){
      // Once the socket is closed, we can safely delete the temp branch for deployment
      deleteBranch(tag, target)
    });
    // Listening on specific build message
    socket.emit('listen', appInfo.name);
  })
}

function deploy(tag, target){
  return new Promise(function(resolve, reject){
    // This peels annotated information(such as comments) of the tag, so
    // we can push it directly to the remote branch.
    // http://stackoverflow.com/a/4061542/111518
    branchParam = tag + ':refs/heads/' + target;
    if(tag.toLowerCase() !== 'head'){
      branchParam = tag + '~0:refs/heads/'+target;
    }
    var params = [
     'push',
     '-f',
     'origin',
     branchParam
    ];

    // console.log('push to', tag);
    // stdio: 'inherit' retains the format information of the output.
    // var operation = spawn('git', params, {stdio: 'inherit', stdout: 'inherit'});
    var operation = spawn('git', params);
    operation.stdout.on('data', function(data){
      console.log(data.toString());
    });
    operation.stderr.on('data', function(data){
      console.log(data.toString());
      // TODO: exit the terminal!
    });
    operation.on('exit', function(code){
      if(code === 0){
        console.log('Branch successfully pushed.');
      }
      else{
        console.log('Branch push failed.');
      }
      resolve();
    });
  })
}

// TODO: Do not rely on the branch deletion and find a better way to force push to deployment branch?
function deleteBranch(tag, target){
  var operation = exec('git push origin :' + target);
  operation.stdout.on('data', function(data){
    console.log(data.toString());
  });
  operation.stderr.on('data', function(data){
    console.log(data.toString());
    // TODO: exit the terminal!
  });
  operation.on('exit', function(code){
    if(code !== 0){
      console.log('WARN Branch deletion failed.');
    }
    console.log(colors.green('Successfully deployed %s to %s'), tag, target);
  });
}
var inquirer = require('inquirer');
var commander = require('commander');
var git = require('git');
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');

var repository = null;
var tagList = [];
var remoteList = [];

// deploy command
commander
  .command('deploy')
  .description('For deployment!')
  .action(function(options){
    openRepo()
    .then(function(){
      return getTags();
    })
    .then(function(){
      return getRemotes();
    })
    .then(function(){
      var tagQuestion = {
        type: 'list',
        name: 'tag',
        message: 'Choose which tag to be deployed',
        choices: tagList
      };

      var remoteQuestion = {
        type: 'list',
        name: 'remote',
        message: 'Where to deploy to',
        choices: remoteList,
      };

      inquirer.prompt([tagQuestion, remoteQuestion], function(answers){
        // console.log(answers);
        deploy(answers.tag, answers.remote);
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
          tagList.push(tags[i].name)
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

function getRemotes(){
  return new Promise(function(resolve, reject){
    var filePath = path.resolve(process.cwd(), 'package.json');
    var data = fs.readFileSync(filePath, 'utf8');
    var appPkg = JSON.parse(data);

    if(appPkg.deployment.staging.remote){
      remoteList.push({
        key: 'staging',
        name: 'staging',
        value: appPkg.deployment.staging.remote
      });
    }
    if(appPkg.deployment.production.remote){
      remoteList.push({
        key: 'production',
        name: 'production',
        value: appPkg.deployment.production.remote
      });
    }

    resolve(remoteList)

    // exec('git remote -v', function(error, stdout, stderr){

    //   if(error){
    //     reject(error);
    //   }
    //   else{
    //     var lines = stdout.split('\n');

    //     var map = {};
    //     for(var i in lines){
    //       var chunks = lines[i].split('\t');
    //       if(chunks.length == 2){
    //         var name = chunks[0];
    //         var url = chunks[1].replace(/\s\(.*\)/, '');

    //         // Do not include origin as a deploy target
    //         if(!map[name] && name !== 'origin'){
    //           map[name] = true;
    //           remoteList.push({
    //             key: name,
    //             name: lines[i].replace(/\s\(.*\)/, ''),
    //             value: url,
    //           });
    //         }
    //       }
    //     }

    //     resolve(remoteList)
    //   }
    // })
  });
}

function deploy(tag, remote){
  // var branchName = 'deploy-' + Math.ceil(Math.random()*9999);
  // var command = 'git checkout -b ' + branchName + ' ' + tag + ' && ' +
  //   'git add -f public && ' +
  //   'git commit -m Deploy && ' +
  //   'git push -f ' + remote + ' ' + branchName + ':master && ' +
  //   'git checkout -f '
  // console.log(command);
  // exec('git init ' + directoryPath + ' && git archive --remote="git@bitbucket.org:inclusive-activities/boilerplate.git" master | tar -x -C ' + directoryPath);

  var script = path.resolve(__dirname, 'scripts', 'deploy.sh');
  console.log(script);
  var operation = exec(script + ' ' + tag + ' ' + remote);

  operation.stdout.on('data', function(data){
    console.log(data.toString());
  });
  operation.stderr.on('data', function(data){
    console.log(data.toString());
  });
  operation.on('exit', function(code){
    if(code === 0){
      console.log('Deploy successfully.');
    }
    else{
      console.log('An error has happened');
      console.log('Process existed: ' + code);
    }
  });
}
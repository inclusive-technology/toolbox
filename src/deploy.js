var inquirer = require('inquirer');
var commander = require('commander');
var git = require('git');
var exec = require('child_process').exec;

var repository = null;
var tagList = [];
var remoteList = [];

// deploy command
commander
  .command('deploy')
  .description('For deployment!')
  .action(function(options){
    openRepo().then(function(repo){
      return Promise.all([getTags(), getRemotes()])
    }).then(function(){
      console.log('all done');

      console.log(remoteList);

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
        console.log(answers);
      });
    })
  });
commander.parse(process.argv);


function openRepo(){
  console.log('open repo');
  return new Promise(function(resolve, reject){
    new git.Repo(process.cwd(), {is_bare: false}, function(error, repo){
      console.log(error);
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

        resolve(tagList);
      }
    });
  });
}

function getRemotes(){
  return new Promise(function(resolve, reject){
    exec('git remote -v', function(error, stdout, stderr){

      if(error){
        reject(error);
      }
      else{
        var lines = stdout.split('\n');

        var map = {};
        for(var i in lines){
          var chunks = lines[i].split('\t');
          if(chunks.length == 2){
            var name = chunks[0];
            var url = chunks[1].replace(/\s\(.*\)/, '');

            // Do not include origin as a deploy target
            if(!map[name] && name !== 'origin'){
              map[name] = true;
              remoteList.push({
                key: name,
                name: lines[i].replace(/\s\(.*\)/, ''),
                value: url,
              });
            }
          }
        }

        resolve(remoteList)
      }
    })
  });
}
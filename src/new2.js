var inquirer = require('inquirer');
var commander = require('commander');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

// Setup default api request.
// OAuth consumer key and secret setup, etc.
var apiRequest = require('request').defaults({
  baseUrl: 'https://api.bitbucket.org',
  oauth: {
    consumer_key: process.env.BITBUCKET_KEY,
    consumer_secret: process.env.BITBUCKET_SECRET
  },
  json: true
});

var packageInfo = null;

commander
  .command('new <slug> [owner]')
  .description('Create a html boilerplate. Owner defaults to "inclusive-activities"')
  .action(function(slug, owner){
    owner = owner || 'inclusive-activities';

    if(!slug){
      throw new Error('Missing slug name!');
    }

    // If local directory already exist, stop it.
    var directoryPath = path.join(process.cwd(), slug);
    if(fs.existsSync(directoryPath)){
      throw new Error('Directory: "' + directoryPath + '" already exists!');
    }

    // If remote repository exists, directly clone the repository. Otherwise,
    // go through step by step to create a brand new application.
    createRemoteRepo(owner, slug).then(function(remoteRepoExist){
      if(remoteRepoExist){
        return cloneRemoteRepo(owner, slug);
      }
      else{
        return createLocalRepo(slug).then(function(){
          return setupHooks(owner, slug);
        // }).then(function(){
        //   return setDeploymentKey(owner, slug);
        }).then(function(){
          return setRemotes(owner, slug);
        }).then(function(){
          return firstCommit(slug);
        });
      }
    }).catch(function(error){
      console.log(error);
    });
  });

function cloneRemoteRepo(owner, slug){
  console.log('Remote repository already exist, directly clone the repository. You might want to double check the name.')
  return new Promise(function(resolve, reject){
    var params = ['clone', 'git@bitbucket.org:'+owner+'/'+slug+'.git'];
    var operation = spawn('git', params, {stdio: 'inherit'});
    operation.on('exit', function(code){
      if(code === 0){
        console.log('Local repository created.');
        resolve();
      }
      else{
        throw new Error('An error has happened during local repository creation. Exit code: ' + code);
      }
    });
  });
}

function createRemoteRepo(owner, slug){
  return new Promise(function(resolve, reject){
    apiRequest.post({
      uri: '1.0/repositories',
      body: {
        name: slug,
        is_private: true,
        scm: 'git'
      }
    }, function(error, response, body){
      if(error){
        console.log(error);
        reject();
      }
      // Successfully created remote repository. No remote repository exist.
      // It will cause extracting a brand new repository locally
      else if(response.statusCode === 200){
        resolve(false)
      }
      // Same named repository exists under the owner.
      // It will cause cloning the existing remote repository to local directory.
      else if(response.statusCode === 400){
        resolve(true);
      }
      else{
        reject();
      }
    });
  });
}

function createLocalRepo(slug){
  console.log('Setup local repository, please wait...');
  return new Promise(function(resolve, reject){
    var directoryPath = path.join(process.cwd(), slug);
    var operation = exec('git init ' + directoryPath + ' && git archive --remote="git@bitbucket.org:inclusive-activities/boilerplate.git" master | tar -x -C ' + directoryPath.replace(/\\/g, '/'));
    operation.stdout.on('data', function(data){
      console.log(data.toString());
    });
    operation.stderr.on('data', function(data){
      throw new Error(data.toString());
    });
    operation.on('exit', function(code){
      if(code === 0){
        console.log('Local repository created.');
        resolve();
      }
      else{
        throw new Error('An error has happened during local repository creation. Exit code: ' + code);
      }
    });
  });
}

function setPackageInfo(slug){
  console.log('Update application name...');
  var filePath = path.join(process.cwd(), slug, 'package.json');
  packageInfo = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  packageInfo.name = slug;
  fs.writeFileSync(filePath, JSON.stringify(packageInfo, null, 2));
  return packageInfo;
}

function setupHooks(owner, slug){
  setPackageInfo(slug);

  console.log('Setup deployment hooks...');
  var promises = [];
  for(var i=0; packageInfo.deployments && i<packageInfo.deployments.length; ++i){
    var hook = packageInfo.deployments[i];
    var promise = new Promise(function(resolve, reject){
      hook.description = hook.name;
      hook.events = ['repo:push'];
      hook.active = true;

      apiRequest.post({
        uri: '2.0/repositories/' + owner + '/' + slug + '/hooks',
        body: hook
      }, function(error, response, body){
        if(error){
          console.log(error);
          reject();
        }
        else{
          resolve();
        }
      })
    });
    promises.push(promise);
  }

  return Promise.all(promises);
}


function setDeploymentKey(owner, slug){
  console.log('Setup deployment key...');
  var key = encodeURIComponent(fs.readFileSync(path.join(__dirname, 'keys', 'deploy_rsa.pub'), 'utf8'));

  return new Promise(function(resolve, reject){
    apiRequest.post({
      uri: '1.0/repositories/' + owner + '/' + slug + '/deploy-keys',
      body: 'key=' + key + '&label=deployment',
      // Since this REST api request does not use JSON body, have to turn the default json off
      json: false
    }, function(error, response, body){
      if(error){
        console.log(error);
        reject();
      }
      else{
        resolve();
      }
    });
  });
}

function setRemotes(owner, slug){
  return new Promise(function(resolve, reject){
    console.log('Add remotes...');

    var operation = exec('cd ' + slug + ' && git remote add origin git@bitbucket.org:' + owner + '/' + slug + '.git');
    operation.on('exit', function(code){
      if(code === 0){
        resolve();
      }
      else{
        throw new Error('An error has happened during local repository setup. Exit code: ' + code);
      }
    });
  })
}

function firstCommit(slug){
  return new Promise(function(resolve, reject){
    console.log('First commit...');

    var operation = exec('cd ' + slug + ' && git add -A && git commit -m "Initial commit" && git push --set-upstream origin master');
    operation.on('exit', function(code){
      if(code === 0){
        console.log('Application successfully created.');
      }
      else{
        throw new Error('An error has happened during local repository setup. Exit code: ' + code);
      }
    });
  })
}
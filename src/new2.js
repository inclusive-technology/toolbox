var inquirer = require('inquirer');
var commander = require('commander');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var request = require('request').defaults({
  baseUrl: 'https://api.bitbucket.org',
  oauth: {
    consumer_key: process.env.BITBUCKET_KEY,
    consumer_secret: process.env.BITBUCKET_SECRET
  },
  json: true
});


// deploy command
commander
  .command('new <slug>')
  .description('Create a html boilerplate')
  .action(function(slug){
    if(!slug){
      throw new Error('Missing slug name!');
    }

    owner = 'inclusive-activities';

    // TODO: Shall I extract the url from other repository?
    createRemoteRepo(owner, slug).then(function(){
      return setupWebHook(owner, slug, 'zhengyi', process.env.POST_RECEIVE_ZHENGYI)
    }).then(function(){
      return setupWebHook(owner, slug, 'gerty', process.env.POST_RECEIVE_GERTY)
    }).then(function(){
      return setupLocalRepo(slug);
    }).then(function(){
      return customize(slug);
    });
  });


function createRemoteRepo(owner, slug){
  return new Promise(function(resolve, reject){
    request.post({
      uri: '1.0/repositories',
      body: {
        name: slug,
        is_private: true,
        scm: 'git'
      }
    }, function(error, response, body){
      if(error){
        console.log(error);
        reject()
      }
      else{
        // console.log(body);
        resolve();
      }
    });
  });
}

function setupWebHook(owner, slug, description, postReceive){
  return new Promise(function(resolve, reject){
    request.post({
      uri: '2.0/repositories/' + owner + '/' + slug + '/hooks',
      body: {
        'description': description,
        'url': postReceive,
        'active': true,
        'events': ['repo:push']
      }
    }, function(error, response, body){
      if(error){
        console.log(error);
        reject()
      }
      else{
        resolve();
      }
    })
  })
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

    // TODO: check directory exist or not
    var directoryPath = path.join(process.cwd(), appName);
    if(fs.existsSync(directoryPath)){
      throw new Error(directoryPath + ' already exists!');
    }

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

function customize(appName){
  return new Promise(function(resolve, reject){
    console.log('Updating package.json...');
    var filePath = path.join(process.cwd(), appName, 'package.json');
    var data = fs.readFileSync(filePath, 'utf8');

    var appPkg = JSON.parse(data);
    appPkg.name = appName;
    // appPkg.deployment = appPkg.deployment ? appPkg.deployment : {};
    // appPkg.deployment.staging = {
    //   remote: 'ssh://' + map.staging.username + '@' + map.staging.host + map.staging.directory + appName + '.git'
    // };
    // appPkg.deployment.production = {
    //   remote: 'ssh://' + map.production.username + '@' + map.production.host + map.production.directory + appName + '.git'
    // };

    fs.writeFileSync(filePath, JSON.stringify(appPkg, null, 2));

    var operation = exec('cd ' + appName + ' && git remote add origin git@bitbucket.org:inclusive-activities/' + appName + '.git');
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
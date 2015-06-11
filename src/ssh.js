var Client = require('ssh2').Client;
var url = require('url');

var ssh = Object.create(null);
var conn = null;

ssh.connect = function(host, username, password, port){
  return new Promise(function(resolve, reject){
    conn = new Client();
    conn.on('ready', function(){
      resolve();
    });
    conn.on('error', reject);
    conn.connect({
      host: host,
      port: port || 22,
      username: username,
      password: password
    });
  });
}

/**
 * [new description]
 * @param  {[type]} appName [description]
 * @return {[type]}         [description]
 */
ssh.new = function(appName, directory){
  console.log('Creating', appName, 'server application.');
  console.log('Please wait... (Press CTRL + C to cancel)\n');

  if(!appName || !directory){
    var error = 'Error: appName or directory missing';
    console.log(error)
    throw error;
  }

  var repoPath = url.resolve(directory, appName+'.git');
  // return ssh.test(repoPath).then(function(canCreate){
  //   if(canCreate){
  //     return ssh.create(appName, repoPath).then(function(){
  //       console.log('Application is now ready.');
  //       console.log('\n----------------------------------------------------------\n');
  //     });
  //   }
  //   else{
  //     console.log('Application already exist and ready to deploy.');
  //     console.log('\n----------------------------------------------------------\n');
  //     ssh.close();
  //   }
  // });

  return ssh.test(repoPath)
    .then(function(repoExist){
      if(!repoExist){
        return ssh.create(appName, repoPath);
      }
    })
    .then(function(success){
      // Repo successfully created, then set the hooks
      if(success){
        return ssh.setHooks(repoPath);
      }
      else{
        console.log('Repository already exist and ready to deploy.');
        // Repo exist, no need to setup hooks...
        return true;
      }
    })
    .then(function(success){
      if(!success){
        console.log('Hooks fail to setup... Please manually setup post-receive hooks.');
      }
      console.log('Application is now ready.');
      console.log('\n----------------------------------------------------------\n');
      return ssh.close();
    })
    .catch(function(error){
      console.log(error);
      return ssh.close();
    })
};

/**
 * Test whether the repo exist on remote server
 * @param  {[type]} repoPath [description]
 * @return {[type]}      [description]
 */
ssh.test = function(repoPath){
  // console.log('Testing repository...', repoPath)
  return new Promise(function(resolve, reject){
    // Test directory exist or not
    conn.exec('[ -d ' + repoPath + ' ]', function(error, stream){
      if(error){
        throw error;
      }
      else{
        stream
          .on('exit', function(exitCode){
            // console.log('exitCode', exitCode)
            // exit code 0 indicates that the directory already exists, therefore we do not need to
            // create new application repo.
            resolve(exitCode === 0);
          })
          .on('data', function(data) {
            // console.log(data.toString());
          })
          .stderr.on('data', function(data) {
            // console.log(data.toString());
            reject(data.toString());
          });
      }
    })
  });
};

ssh.create = function(appName, repoPath){
  return new Promise(function(resolve, reject){
    // var command = 'git clone --bare git@bitbucket.org:inclusive-activities/boilerplate.git ' + repoPath;
    var command = 'git init --bare ' + repoPath;
    conn.exec(command, function(error, stream) {
      if(error){
        throw error;
      }
      stream
        .on('exit', function(exitCode){
          console.log('exit code', exitCode);
          resolve(exitCode === 0);
        })
        .on('data', function(data){
          console.log(data.toString());
        })
        .stderr.on('data', function(data) {
          reject(data.toString());
        });
    })
  });
};

ssh.setHooks = function(repoPath){
  console.log('Setup hooks...')
  return new Promise(function(resolve, reject){
    var hookPath = repoPath + '/hooks/';
    console.log('hookPath: ', hookPath);
    var command = 'git archive --remote="git@bitbucket.org:inclusive-activities/deployment-hooks.git" master | tar -x -C ' + hookPath;
    conn.exec(command, function(error, stream){
      if(error){
        console.log(error);
        throw error;
      }
      stream
        .on('exit', function(exitCode){
          // console.log('exit code', exitCode);
          resolve(exitCode === 0);
        })
        .on('data', function(data){
          console.log(data.toString());
        })
        .stderr.on('data', function(data) {
          reject(data.toString());
        });
    })
  });
}

ssh.close = function(){
  conn.end();
  // console.log('**Connection closed**');
};

module.exports = ssh;
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
    ssh.close();
    throw error;
  }

  var repoPath = url.resolve(directory, appName+'.git');
  return ssh.test(repoPath).then(function(canCreate){
    if(canCreate){
      return ssh.create(appName, repoPath).then(function(){
        console.log('Application is now ready.');
        console.log('\n----------------------------------------------------------\n');
      });
    }
    else{
      console.log('Application already exist and ready to deploy.');
      console.log('\n----------------------------------------------------------\n');
      ssh.close();
    }
  });
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
            // Exit code 1 indicates an error has happened, which means the directory does not exist
            // In this case, we want to create our repository!
            if(exitCode === 1){
              resolve(true)
            }
            else{
              resolve(false)
            }
          })
          .on('data', function(data) {
            // console.log(data.toString());
          })
          .stderr.on('data', function(data) {
            // console.log(data.toString());
            reject(false);
          });
      }
    })
  });
};

ssh.create = function(appName, repoPath){
  return new Promise(function(resolve, reject){
    var command = 'git clone --bare git@bitbucket.org:inclusive-activities/boilerplate.git ' + repoPath;
    conn.exec(command, function(error, stream) {
      if(error){
        throw error;
      }
      stream
        .on('close', function(){
          // console.log('closed!!!');
        })
        .on('exit', function(exitCode){
          // console.log('exit code', exitCode);
          resolve(exitCode === 0);
        })
        .on('end', function(code, signal){
          // Close the connection, once finished the repo creation
          // Note that if the repo already exist, the connection is closeed in ssh.new method.
          ssh.close();
        })
        .on('data', function(data){
          console.log(data.toString());
        })
        .stderr.on('data', function(data) {
          console.log(data.toString());
          reject(false);
        });
    })
  });
};

ssh.close = function(){
  conn.end();
};

module.exports = ssh;
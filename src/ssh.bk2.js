var Client = require('ssh2').Client;

var conn = null;
var ssh = Object.create(null);

ssh.connect = function(host, username, password, port){
  return new Promise(function(resolve, reject){
    conn = new Client();
    conn.on('ready', function(){
      console.log('Host: ' + host + ' connected...');
      resolve();
    });
    conn.on('error', reject);
    conn.connect({
      host: host,
      port: port || 22,
      username: username,
      password: password
    });
  })
};

ssh.exec = function(command){
  return new Promise(function(resolve, reject){
    conn.exec(command, {pty: true}, function(error, stream){
     if(error){
      reject(error);
     }
     else{
      stream
        .on('close', function(code, signal){
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
        })
        .on('data', function(data){
          console.log(data.toString());
          resolve(null, data.toString());
        })
        .stderr.on('data', function(data){
          console.log(data.toString());
          resolve(new Error(data.toString));
        });
     }
    });
  });
}

ssh.close = function(){
  conn.end();
}

module.exports = ssh;
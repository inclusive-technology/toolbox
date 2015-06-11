var commander = require('commander');
var pkg = require('./package.json');

require('./src/deploy');
require('./src/new');

// If user interrupt the process, delay exit so we have time to do a clean up.
process.on('SIGINT', function(){
  setTimeout(function(){
    process.exit();
  }, 100)
}.bind(null));

// version
commander.version(pkg.version);

// Setup all the commands
commander.parse(process.argv);
Toolbox for inclusive HTML5 application creation and deployment.

`npm install inclusive-toolbox -g` to install.

# Initial OAuth environment variable setup
The OAuth consumer is ready to use under bitbucket [inclusive-activities](https://bitbucket.org/account/user/inclusive-activities/api) team. Add both `BITBUCKET_KEY`(The consumer key) and `BITBUCKET_SECRET`(the consumer secret) into the system environment variables. This allows toolbox to authenticate, authorize and setup repository via bitbucket REST API.

# New Application
Run `toolbox new <appName>` to create a new application.

# Deployment
Under the root of the application. Run `toolbox deploy` to start the deployment process. It will prompt you with step by step instruction.

Use `npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease]` if you have no tag yet, or you can try to deploy `HEAD`.


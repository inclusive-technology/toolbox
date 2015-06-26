Toolbox for inclusive HTML5 application creation and deployment.

`npm install inclusive-toolbox -g` to install.

# Initial OAuth Environment Setup
The OAuth consumer should be ready to use under inclusive-activities team. Both `BITBUCKET_KEY`(The consumer key) and `BITBUCKET_SECRET`(the consumer secret) needs to be added in the serve environment variables. This allows toolbox to setup repository via bitbucket REST API.

# New Application
Run `toolbox new <appName>` to create a new application.

# Deployment
Under the root of the application. Run `toolbox deploy` to start the deployment process. It will prompt you with step by step instruction.

Note that, tag is compulsory for deployment. `git tag <version>` if you have no tag yet.


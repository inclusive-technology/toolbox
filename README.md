Toolbox for inclusive html 5 application creation and deployment.

`npm install inclusive-toolbox -g` to install.

# New Application
Run `toolbox new <appName>` to create a new html 5 application. It will ask for SSH login information for staging and production server in order to setup the repository.

# Deployment
Under the root of the html 5 application. Run `toolbox deploy` to start the deployment process. It will prompt you with step by step information.

Note that, tag is compulsory for deployment. `git tag <version>` if you have no tag yet.
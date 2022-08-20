# Outlook-Integration

This is a node.js project on Outlook-Integration as an backend task for RingOver Intern.

## Features
  - Setup OAuth for outlook.
  - Save encrypted auth tokens to the database.
  - Created the following Apis.
     - Fetch User
     - Send Mail with Attachments
     - Fetch Mail with Attachments
     - Fetch Email Aliases
     - Integrate a webhook to save sent mail_ids to the database.
  - Subscriptions in outlook.

## Tech stacks

- NodeJS - JS runtime environment
- Express - The web framework used
- MySQL - As database
- Sequelize - Object Relational Mapping (ORM)
- Axios - HTTP requests from node. js
- Postman - API testing  etc.

## Features Screenshots
- Setup OAuth for outlook.
    <img src="/Screenshots/Oauth-setup" width="80%"/> 
    
- Save encrypted auth tokens to the database.
    <img src="/Screenshots/save-encripted-token-to-database" width="80%"/> 

- Send Mail with Attachments
  <img src="/Screenshots/send-email" width="80%"/> 
  
- Integrate a webhook 
   <img src="/Screenshots/integrate-web-hooks" width="80%"/> 
   
- save sent mail_ids to the database.
   <img src="/Screenshots/Save-sent-mail-to-database" width="80%"/> 
   
- created subcription.
   <img src="/Screenshots/create-subscription" width="80%"/> 
        
- All features ( which given in task ) are implemented in project please visit the code.

## Setting Up Your Local Environment

If you wish to play around with the code base in your local environment, do the following

```bash
* Clone this repo to your local machine.
* Using the terminal, navigate to the cloned repo.
* Install all the neccessary dependencies, as stipulated in the package.json file.
* In your .env file, set environment variables.

* Start the server.
* Your app should be running just fine.
```

Helpful commands

```bash
$ git clone https://github.com/yourGitHubUsername/Outlook-Integration

$ cd Outlook-Integration
$ npm install
$ npm run start_dev(for development)
$ npm run start_prod(for production)
```

## Author

[Yogesh-Ghatode](https://github.com/Yogesh-Ghatode)

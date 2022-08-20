const express = require("express");
const axios = require("axios");
const crypto = require("crypto")
const qs = require("qs");
const fs = require('fs');
const joi = require('joi');
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")
const db = require("./database/database.js")
require('dotenv').config();

const clientId= process.env.OAUTH_CLIENT_ID
const authority= process.env.AUTH
const clientSecret= process.env.OAUTH_CLIENT_SECRET
const scopes= process.env.OAUTH_SCOPES
const redirect = process.env.OAUTH_REDIRECT_URI
const secret_key = process.env.SECRET_KEY
const algorithm = process.env.ALGORITHM
const auth_url = `${authority}/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirect}&response_mode=query&scope=${scopes}&state=12345`

app = express();


app.use(cookieParser());
app.use(bodyParser.json({"limit": "50mb"}))

app.get("/", (req, res) => {
    res.redirect(auth_url)
})

app.get("/auth/callback", async (req, res) => {
    code = req.query.code
    data = await getAccessToken(code)
    access_token = data.access_token
    const options = {
        headers : {
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json"
        }
    }
    userData = await getUser(options)
    encryptedToken = encryptData(access_token)
    refreshToken = data.refresh_token
    console.log(`refresh token ${refreshToken}`)
    user = {
      username: userData.userPrincipalName,
      token: encryptedToken,
      refreshToken: refreshToken
    }
    username = userData.userPrincipalName
    encryptedUsername = encryptData(username)
    await db.createUser(user)
    await createSubscription(options, username)
    res.cookie('username',  encryptedUsername, { maxAge: 900000, httpOnly: true });
    res.send({"message": "done authentication"})
});

app.get("/user", async (req, res) => {
    options = await getOptions(req)
    user = await getUser(options)
    res.send(user)
})

app.get("/getMails", async (req, res) => {
    options = await getOptions(req)
    messages = await getMails(options)
    res.send(messages)
})


app.get("/getMail", async (req, res) => {
    message_id = req.query.id
    options = await getOptions(req)
    msg = await getMail(options, message_id)
    res.send(msg)
})


app.get("/alias", async (req, res) => {
  const options = await getOptions(req)
  const username = await decryptedUsername(req)
  const aliases = await getAliases(options, username)
  res.send(aliases)
})


app.post("/sendmail", async (req, res) => {
    mail = req.body
    mailFrom = await decryptedUsername(req)
    options = await getOptions(req)
    await sendMail(options, mail, mailFrom)
    res.send("done")
})


app.post("/hook", async (req, res) => {
    if (req.query.validationToken != null) {
      const token = req.query.validationToken
      res.send(token) 
      console.log("created Subscription")
    }
  else{
      res.send("done")
      bodyValue = req.body.value[0]
      subscriptionId = bodyValue.subscriptionId
      data = {
        "subscriptionId": subscriptionId
      }
      console.log(data)

      userData = await db.getHookData(data)
      console.log(userData)
      username = userData[0].dataValues.UserUsername

      user = await db.getUser({username: username})
      access_token = user[0].dataValues.token
      decryptedToken = decryptData(access_token)

      const options = {
          headers : {
              "Authorization": `Bearer ${decryptedToken}`,
              "Content-Type": "application/json"
          }
      }
      messageId = bodyValue.resourceData.id

      mail = await getMail(options, messageId)
      await saveSentMailToDatabase(mail, username)
  }
})


async function saveSentMailToDatabase(message, username){
    toRecipients = message.toRecipients
    for (const data of toRecipients) {
        address = data.emailAddress.address
        saveData = {
          email: address,
          UserUsername: username
        }
        console.log(saveData)
        await db.createEmail(saveData)
    }
}



async function getAccessToken(code) {
    const options = {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }
    data = {
        "client_id": clientId,
        "scope": scopes,
        "code": code,
        "redirect_uri": redirect,
        "grant_type": "authorization_code",
        "client_secret": clientSecret
    }
    const token_url = `${authority}/token`;
    res = await axios.post(`${authority}/token`, qs.stringify(data), options)
    return res.data
}


async function getOptions(req) {
    decryptUsername = await decryptedUsername(req)
    console.log(decryptUsername)
    user = await db.getUser({username: decryptUsername})
    access_token = user[0].dataValues.token
    decryptedToken = decryptData(access_token)
    const options = {
        headers : {
            "Authorization": `Bearer ${decryptedToken}`,
            "Content-Type": "application/json"
        }
    }
    return options
}


async function decryptedUsername(req){
  try{
    console.log(req.cookies)
    username = req.cookies.username
    decryptUsername = decryptData(username)
    console.log(decryptUsername)
    return decryptUsername
  }catch(err){
    console.log(err)
  }
}


async function getUser(options){
    user = await axios.get("https://graph.microsoft.com/v1.0/me", options)
    console.log(user)
    return user.data
}

async function getMails(options){
    messages = await axios.get("https://graph.microsoft.com/v1.0/me/messages", options)
    return messages.data
}

async function getMail(options, message_id) {
    msg = await axios.get(`https://graph.microsoft.com/v1.0/me/messages/${message_id}`, options)
    attachments = await axios.get(`https://graph.microsoft.com/v1.0/me/messages/${message_id}/attachments`, options)
    console.log(msg.data)
    msg = msg.data
    attachment = attachments.data.value
    msg.attachement = attachment
    return msg
}

async function getAliases(options, username){
    user = await axios.get(`https://graph.microsoft.com/v1.0/me/?$select=proxyaddresses`, options)
    console.log(user.data)
    return user.data
}

async function sentMails(options){
    msg = await axios.get(`https://graph.microsoft.com/v1.0/me/mailFolders/SentItems/messages`, options)
    console.log(msg.data)
    return msg.data
}



function drafAttachments(base64Data) {
    requestBody = {
        "@odata.type": "#microsoft.graph.fileAttachment",
        "contentBytes": base64Data.contentBytes,
        "name": base64Data.name
    }
    console.log(requestBody)
    return requestBody
}


async function sendMail(options, mail, mailFrom) {
    console.log(`mail from ${mailFrom}`)
    l = []
    for (attachment of mail.attachments){
      l.push(drafAttachments(attachment))
    }
    message = {
        message:{
            "subject": mail.subject,
            "body": {
            "contentType": mail.type,
            "content": mail.content,
            },
            "attachments": l,
            "toRecipients": [
            {
                "emailAddress": {
                  "address": mail.toRecipients
                }
            }
            ],
            "from": {
            "emailAddress": {
                "address": mailFrom
            }
            }
        }
    }
    console.log(message)
    await axios.post("https://graph.microsoft.com/v1.0/me/sendmail", message, options)
    return {"message": "Done"}
}


async function createSubscription(options, user){
  const username = user
  const userData = await db.getHook({UserUsername: username})
  if (userData == 0){
    data = {
      "changeType": "updated",
      "clientState": "SecretClientState",
      "notificationUrl": "https://prabalpk.loca.lt/hook",
      "resource": "me/mailFolders('SentItems')/messages",
      "expirationDateTime": "2022-08-21T04:30:28.2257768+00:00"
    }
    res = await axios.post("https://graph.microsoft.com/beta/subscriptions", data, options)
    id = res.data
    console.log(id)
    data = {
      'UserUsername': username,
      'SubscriptionId': res.data.id
    }
    console.log(data)
    await db.createHooks(data)
  }else{
    console.log("user already exists")
  }
}


function encryptData(data) {
    var cipher = crypto.createCipher(algorithm, secret_key);  
    var encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    return encrypted
}

function decryptData(data){
    var decipher = crypto.createDecipher(algorithm, secret_key);
    var decrypted = decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
    return decrypted
}
app.listen(3000)


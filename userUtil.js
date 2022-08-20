const axios = require("axios")
const qs = require("qs")
const crypto = require("crypto")


const authority= process.env.AUTH


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
    user = await axios.get(`https://graph.microsoft.com/v1.0/me/${username}?$select=proxyaddresses`, options)
    console.log(user)
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

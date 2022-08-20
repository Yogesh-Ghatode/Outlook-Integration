const { user, emails, hooks } = require("./models.js")

async function createUser(data){
  try {
      var c = await user.create(data)
  }catch(e){
    await updateUser(data)
  }
}

async function createEmail(data){
  try{

    var c = await emails.create(data)
  }catch(e){
    console.log("duplicate key")
  }
}

async function createHooks(data){
  try{
    await hooks.create(data)
  }catch(error){
    await updateHook(data)
  }
}

async function updateUser(data){
  await user.update(data, {where: {username: data.username}})
}

async function updateEmail(data){
  await emails.update(data, {where: {UserUsername: data.UserUsername}})
}

async function updateHook(data){
  await hooks.update(data, {where: {UserUsername: data.UserUsername}})
}


async function getUser(data){
    data = await user.findAll({where: {username: data.username}})
    return data
}

async function getHook(data){
  data = await hooks.count({where: data})
  console.log(data)
  return data
}

async function getHookData(data){
  data = await hooks.findAll({where: data})
  console.log(data)
  return data
}
async function getAllUser(){
  data = await user.findAll()
  console.log(data)
}

async function getAllEmails(){
  data = await emails.findAll()
  console.log(data)
}


data = {
  UserUsername:"yogeshghatode1512@gmail.com",
}
getHook(data)

module.exports = {
  createUser: createUser,
  createEmail: createEmail,
  createHooks: createHooks,
  updateUser: updateUser,
  updateEmail: updateEmail,
  updateHook: updateHook,
  getUser: getUser,
  getHook: getHook,
  getHookData: getHookData,
  getAllUser: getAllUser,
  getAllEmails: getAllEmails,
}

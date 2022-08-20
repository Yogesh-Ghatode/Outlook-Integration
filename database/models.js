const { Sequelize, Model, DataTypes } = require('sequelize')
const db = require("./db.config.js")


async function connectionCheck()  {
    try {
      await db.authenticate();
      console.log('Connection has been established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
}


const User = db.define('User', {
    username: {type: DataTypes.STRING, primaryKey: true},
    token: DataTypes.TEXT,
    refreshToken: DataTypes.TEXT,
});

const Emails = db.define("emailIds", {
  email: {type: DataTypes.STRING, allowNull: false},
},
  {
    indexes: [
      {
        unique: true,
        fields: ['email', 'UserUsername']
      }
    ]
  }
)

const HookData = db.define("hooksData", {
  SubscriptionId: DataTypes.TEXT
},
  {
    indexes: [
      {
        unique: true,
        fields: ["UserUsername"]
      }
    ]
  }
)

User.hasOne(Emails);
User.hasOne(HookData);

// (async () => {
//   await db.sync({ force: true });
//   // Code here
// })();


module.exports = {
  user: User,
  emails: Emails,
  hooks: HookData,
}

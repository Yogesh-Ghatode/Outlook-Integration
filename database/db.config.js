const Sequelize = require("sequelize");
require("dotenv").config()
password = process.env.MYSQL_PASS

module.exports = new Sequelize("testdb", "root",
    password, {
    host: "localhost",
    dialect: "mysql",
    operationsAliases: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

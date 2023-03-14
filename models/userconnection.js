'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserConnection extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserConnection.belongsTo(models.User, {as: 'to', foreignKey: 'toId'});
      UserConnection.belongsTo(models.User, {as: 'from', foreignKey: 'fromId'});
    }
  }
  UserConnection.init({
    fromId: DataTypes.INTEGER,
    toId: DataTypes.INTEGER,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'UserConnection',
  });
  return UserConnection;
};
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Player extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Player.belongsTo(models.Team, {
        foreignKey: 'teamId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }
  Player.init(
    {
      teamId: DataTypes.INTEGER,
      fullName: DataTypes.STRING,
      primaryPosition: DataTypes.STRING,
      thumbUrl: DataTypes.STRING,
      externalRef: DataTypes.STRING,
      age: DataTypes.INTEGER,
      shirtNumber: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Player',
    }
  );
  return Player;
};

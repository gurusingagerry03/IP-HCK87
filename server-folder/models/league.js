'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class League extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      League.hasMany(models.Team, {
        foreignKey: 'leagueId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      League.hasMany(models.Match, {
        foreignKey: 'league_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }
  League.init(
    {
      name: DataTypes.STRING,
      country: DataTypes.STRING,
      externalRef: DataTypes.STRING,
      logoUrl: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'League',
    }
  );
  return League;
};

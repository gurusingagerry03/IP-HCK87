'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Match extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Match.belongsTo(models.League, {
        foreignKey: 'league_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      Match.belongsTo(models.Team, {
        foreignKey: 'home_team_id',
        as: 'HomeTeam',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      Match.belongsTo(models.Team, {
        foreignKey: 'away_team_id',
        as: 'AwayTeam',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }
  Match.init(
    {
      league_id: DataTypes.INTEGER,
      home_team_id: DataTypes.INTEGER,
      away_team_id: DataTypes.INTEGER,
      match_date: DataTypes.DATE,
      match_time: DataTypes.TIME,
      home_score: DataTypes.STRING,
      away_score: DataTypes.STRING,
      status: DataTypes.STRING,
      venue: DataTypes.STRING,
      externalRef: { type: DataTypes.STRING, allowNull: false, unique: true },
      match_overview: DataTypes.TEXT,
      tactical_analysis: DataTypes.TEXT,
      match_preview: DataTypes.TEXT,
      prediction: DataTypes.TEXT,
      predicted_score_home: DataTypes.INTEGER,
      predicted_score_away: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Match',
    }
  );
  return Match;
};

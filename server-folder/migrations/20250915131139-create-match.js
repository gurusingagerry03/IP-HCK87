'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Matches', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      league_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Leagues',
          key: 'id',
        },
      },
      league_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Leagues',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      home_team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Teams',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      away_team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Teams',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      match_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      match_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      home_score: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      away_score: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      venue: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      externalRef: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Matches');
  },
};

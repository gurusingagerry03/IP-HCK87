'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Teams', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      leagueId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Leagues',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      logoUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      foundedYear: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stadiumName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stadiumCity: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stadiumCapacity: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      venueAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      externalRef: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lastSyncedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      coach: {
        type: Sequelize.STRING,
        allowNull: true,
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
    await queryInterface.dropTable('Teams');
  },
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Matches', 'match_preview', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('Matches', 'prediction', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('Matches', 'predicted_score_home', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('Matches', 'predicted_score_away', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Matches', 'match_preview');
    await queryInterface.removeColumn('Matches', 'prediction');
    await queryInterface.removeColumn('Matches', 'predicted_score_home');
    await queryInterface.removeColumn('Matches', 'predicted_score_away');
  },
};

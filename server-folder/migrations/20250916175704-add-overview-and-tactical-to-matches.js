'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Matches', 'match_overview', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('Matches', 'tactical_analysis', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Matches', 'match_overview');
    await queryInterface.removeColumn('Matches', 'tactical_analysis');
  },
};

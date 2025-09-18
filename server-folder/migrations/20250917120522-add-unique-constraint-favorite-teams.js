// migrations/YYYYMMDDHHMMSS-add-unique-constraint-favorite-teams.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Menambah unique constraint
    await queryInterface.addConstraint('Favorites', {
      fields: ['userId', 'teamId'],
      type: 'unique',
      name: 'unique_user_team_favorite',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Menghapus unique constraint
    await queryInterface.removeConstraint('Favorites', 'unique_user_team_favorite');
  },
};

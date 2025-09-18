'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add role column to users table
     */
    await queryInterface.addColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
      after: 'password', // Add column after password column
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Remove role column from users table
     */
    await queryInterface.removeColumn('Users', 'role');

    // Also drop the ENUM type if needed
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_role";');
  },
};

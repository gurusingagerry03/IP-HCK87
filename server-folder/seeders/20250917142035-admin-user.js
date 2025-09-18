'use strict';

const { hashPassword } = require('../helpers/bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add admin user seed
     */
    await queryInterface.bulkInsert(
      'Users',
      [
        {
          fullname: 'Administrator',
          email: 'admin@ninety-minutes.com',
          password: await hashPassword('admin123'),
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Remove admin user seed
     */
    await queryInterface.bulkDelete(
      'Users',
      {
        email: 'admin@ninety-minutes.com',
      },
      {}
    );
  },
};

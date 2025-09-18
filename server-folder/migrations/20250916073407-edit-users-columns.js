'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) ganti passwordHash → password
    await queryInterface.renameColumn('Users', 'passwordHash', 'password');

    // 2) ganti displayName → fullname
    await queryInterface.renameColumn('Users', 'displayName', 'fullname');

    // 3) hapus googleSub
    await queryInterface.removeColumn('Users', 'googleSub');

    // 4) tambah profileImg
    await queryInterface.addColumn('Users', 'profileImg', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // rollback

    // 1) rename password → passwordHash
    await queryInterface.renameColumn('Users', 'password', 'passwordHash');

    // 2) rename fullname → displayName
    await queryInterface.renameColumn('Users', 'fullname', 'displayName');

    // 3) tambahkan kembali googleSub
    await queryInterface.addColumn('Users', 'googleSub', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    // 4) hapus profileImg
    await queryInterface.removeColumn('Users', 'profileImg');
  },
};

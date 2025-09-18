const axios = require('axios');

const http = axios.create({
  baseURL: process.env.BASE_URL_FOOTBALL,
  params: {
    APIkey: process.env.API_KEY_FOOTBALL,
  },
});

module.exports = { http };

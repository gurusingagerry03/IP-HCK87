import axios from 'axios';

const http = axios.create({
  baseURL: 'https://ip.gerrygurusinga.xyz/api/v1',
});

export default http;

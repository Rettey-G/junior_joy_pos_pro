// Database connection configuration
// NOTE: This file contains sensitive information and should be added to .gitignore
// in a production environment

module.exports = {
  MONGODB_URI: 'mongodb+srv://Rettey:Adhu1447@cluster0.hriuovn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  PORT: process.env.PORT || 5000,
  JWT_SECRET: 'juniorjoy-secret-key',
  JWT_EXPIRES_IN: '24h'
};

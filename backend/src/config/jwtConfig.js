/**
 * JWT Configuration
 * Defines JWT settings for token generation and validation
 */

module.exports = {
  secret: process.env.JWT_SECRET,
  accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  algorithm: 'HS256',
  issuer: 'GroundCTRL',
  audience: 'GroundCTRL-API'
};

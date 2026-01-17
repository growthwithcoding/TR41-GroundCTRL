/**
 * JWT Configuration
 * Defines JWT settings for token generation and validation
 * 
 * Note: Expiry values use shorthand notation supported by the jsonwebtoken library
 * (e.g., "15m" = 15 minutes, "7d" = 7 days, "1h" = 1 hour, "30s" = 30 seconds)
 * See: https://github.com/vercel/ms#examples
 */

module.exports = {
  secret: process.env.JWT_SECRET,
  accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  algorithm: 'HS256',
  issuer: 'GroundCTRL',
  audience: 'GroundCTRL-API'
};

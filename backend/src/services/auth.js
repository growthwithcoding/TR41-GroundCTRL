// Minimal stub for authentication service
module.exports = {
  async login({ email, password }) {
    return { token: 'dummy-token', refreshToken: 'dummy-refresh', uid: 'dummy-uid' };
  },
  async register({ email, password }) {
    return { uid: 'dummy-uid', email };
  },
  async refreshToken({ refreshToken }) {
    return { token: 'dummy-token', refreshToken: 'dummy-refresh' };
  },
  async revokeToken({ token }) {
    return { success: true };
  },
};

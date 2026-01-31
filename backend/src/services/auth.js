
// Minimal stub for authentication service
module.exports = {
  async login({ _email, _password }) {
    return { token: 'dummy-token', refreshToken: 'dummy-refresh', uid: 'dummy-uid' };
  },
  async register({ _email, _password }) {
    return { uid: 'dummy-uid', email: _email };
  },
  async refreshToken({ _refreshToken }) {
    return { token: 'dummy-token', refreshToken: 'dummy-refresh' };
  },
  async revokeToken({ _token }) {
    return { success: true };
  },
};

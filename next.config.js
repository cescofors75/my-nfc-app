module.exports = {
  experimental: {
    serverActions: true,
  },
  async headers() {
    return [
      {
        source: '/api/socket',
        headers: [
          { key: 'Connection', value: 'upgrade' },
          { key: 'Upgrade', value: 'websocket' },
        ],
      },
    ];
  },
};

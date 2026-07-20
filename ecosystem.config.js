module.exports = {
  apps: [
    {
      name: "b2b-api",
      script: "./backend/server.js",
      cwd: "/var/www/b2b",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};

module.exports = {
    apps: [
        {
            name: 'karthik-traders',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
        },
    ],
};

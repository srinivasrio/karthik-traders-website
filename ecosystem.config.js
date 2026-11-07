module.exports = {
    apps: [
        {
            name: 'karthik-traders',
            script: 'npm',
            args: 'start',
            node_args: '--experimental-websocket',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
        },
    ],
};

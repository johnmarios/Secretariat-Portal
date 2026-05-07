import app from './app.mjs';

const port = Number(process.env.PORT || 3000);

function startServer(listenPort = port) {
    return app.listen(listenPort, () => {
        console.log(`Ο server τρέχει στο http://localhost:${listenPort}`);
    });
}

const server = startServer();

export { startServer, server };
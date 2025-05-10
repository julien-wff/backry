import { connect, type Socket } from 'bun';

/**
 * Test if a port is reachable on a given host by attempting to create a socket connection.
 * @param port Port to test
 * @param host Host IP or hostname
 * @param timeout Timeout in milliseconds
 */
export const isPortReachable = async (port: number, host: string, timeout = 1000) => new Promise<boolean>(async (resolve) => {
    let socket: Socket;

    const timer = setTimeout(() => {
        if (socket) {
            socket.end();
        }
        resolve(false);
    }, timeout);

    try {
        socket = await connect({
            hostname: host,
            port: port,
            socket: {
                open(socket) {
                    clearTimeout(timer);
                    socket.end();
                    resolve(true);
                },
                error(socket, error) {
                    clearTimeout(timer);
                    socket.end();
                    resolve(false);
                },
                data: () => {
                    // Mandatory callback
                },
            },
        });
    } catch (err) {
        clearTimeout(timer);
        resolve(false);
    }
});

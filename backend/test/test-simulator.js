import { io } from "socket.io-client";

const SERVER_URL = 'http://localhost:4000';

const socket = io(SERVER_URL, {
    transports: ["websocket"],
})

socket.on('connect', () => {
    console.log(` Connected to Gateway! Socket ID: ${socket.id}\n`);

    //   // 1. Listen for server-side emissions from simulatorService.fleetUpdate$
    //   socket.on('fleetUpdate', (fleetSnapshot) => {
    //     console.log(' Broadcast [fleetUpdate] received:', fleetSnapshot);
    //   });

    // 2. Trigger 'startSimulator'
    console.log('Emitting: startSimulator');
    socket.emit('startSimulator', (ackResponse) => {
        // NestJS returns value directly in callback acknowledgement
        console.log(' Server Response [startSimulator]:', ackResponse);
    });

    // 3. Trigger 'NewRestrictidArea' with mock data after 2 seconds
    //   setTimeout(() => {
    //     const mockPolygon = {
    //       coordinates: [
    //         { lat: 12.9716, lng: 77.5946 },
    //         { lat: 12.9720, lng: 77.5950 },
    //         { lat: 12.9710, lng: 77.5960 },
    //       ],
    //     };
    // 
    //     console.log('\nEmitting: NewRestrictidArea');
    //     socket.emit('NewRestrictidArea', mockPolygon, (ackResponse) => {
    //       console.log(' Server Response [NewRestrictidArea]:', ackResponse);
    //     });
    //   }, 2000);

    // 4. Trigger 'stopSimulator' and disconnect after 10 seconds
    setTimeout(() => {
        console.log('\nEmitting: stopSimulator');
        socket.emit('stopSimulator', (ackResponse) => {
            console.log(' Server Response [stopSimulator]:', ackResponse);

            console.log('Closing connection...');
            socket.disconnect();
        });
    }, 10000);
});

socket.on('disconnect', () => {
    console.log(' Disconnected from gateway.');
});

socket.on('connect_error', (err) => {
    console.error(' Connection error:', err.message);
});
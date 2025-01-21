const register = document.querySelector('#register')
register.addEventListener('submit', (e) => {
    e.preventDefault();
    const registerData = new FormData(register);

    fetch('/register', {
        method: 'POST',
        body: registerData,
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error(error);
    })
})


const webSocket = document.getElementById('webSocket')

const socket = new WebSocket('ws://localhost:3000/ws');

webSocket.addEventListener('submit', (event) => {
    event.preventDefault()
    if(socket.readyState === WebSocket.OPEN) {
        socket.send(event.target[0].value)
    } else {
        console.error('Websocket is not open')
    }

    socket.addEventListener('message', (message) => {
        console.log('message received: ', message.data)
    })
    
})




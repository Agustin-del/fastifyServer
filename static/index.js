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

const socket = new WebSocket('ws://localhost:3000/ws')

socket.onopen = () => {
    console.log("conexión establecida con el servidor");
    socket.send("hola desde el cliente");
}

socket.onmessage = (event) => {
    console.log("Mensaje recibido del servidor: ", event.data);
}

socket.onclose = () => {
    console.log('Conexión cerrada')
}

socket.onerror = (error) => {
    console.error('Error en la conexión: ', error);
}


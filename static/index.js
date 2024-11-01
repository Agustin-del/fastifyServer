const form = document.querySelector('form')
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            fetch('/register', {
                method: 'POST',
                body: formData,
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
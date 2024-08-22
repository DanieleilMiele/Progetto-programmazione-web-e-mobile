//Funzione per il messaggio di benvenuto col nome dell'utente
function getNomeBenvenuto(){
    let idUtente = localStorage.getItem("idUtente");
    let paragrafoNome = document.getElementById("nomeBenvenuto");

    fetch(`http://localhost:3000/utente/${idUtente}/info`)
    .then(response => response.json())
    .then(response => {
        console.log(response.username);
        paragrafoNome.innerHTML = `Benvenuto ${response.username}!`;

        console.log("Fetch al benvenuto effettuata");   //CONTROLLO DEBUG DA ELIMINARE
    });

    
}

//Funzione per la popolazione dei dettagli dell'account
function popolazioneDettagliAccount(){
    let idUtente = localStorage.getItem("idUtente");
    let username = document.getElementById("username");
    let email = document.getElementById("email");


    fetch(`http://localhost:3000/utente/${idUtente}/info`)
    .then(response => response.json())
    .then(response => {

        //Tolgo temporaneamente il disabled per modificare il valore
        username.removeAttribute("disabled");
        email.removeAttribute("disabled");
        
        //Modifico i valori
        username.value = response.username;
        email.value = response.email;

        //Rimetto il disabled
        username.setAttribute("disabled","true");
        email.setAttribute("disabled","true");

        console.log("Fetch ai dettagli dell'account effettuata");   //CONTROLLO DEBUG DA ELIMINARE
    });

    
}

//Funzione per l'attivazione del pulsante e del campo cambio password
function attivaCambiaPassword(){
    let btnSalvaPsw = document.getElementById("btnSalvaPsw");
    let password = document.getElementById("P");
    let btnVisualizzaPsw = document.getElementById("visualizzaPsw");

    btnSalvaPsw.classList.remove("d-none");
    password.removeAttribute("disabled");
    btnVisualizzaPsw.removeAttribute("disabled");
}

//Funzione per la disattivazione del pulsante e del campo cambio password
function disattivaCambiaPassword(){
    let btnSalvaPsw = document.getElementById("btnSalvaPsw");
    let password = document.getElementById("P");
    let btnVisualizzaPsw = document.getElementById("visualizzaPsw");
    let alertDanger = document.getElementById("alertDanger");
    let alertStessaPsw = document.getElementById("alertStessaPsw");

    btnSalvaPsw.classList.add("d-none");
    password.setAttribute("disabled", "true");
    btnVisualizzaPsw.setAttribute("disabled", "true");
    alertDanger.classList.add("d-none");
    alertStessaPsw.classList.add("d-none");
}

//Funzione per l'effettivo cambio della password
function cambiaPassword(){
    let password = document.getElementById("password").value;
    let idUtente = localStorage.getItem("idUtente");

    if( checkPassword(password) ){                   /* Controllo che la password rispetti i parametri richiesti */
        
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                _id: idUtente,
                password: password
            })
        }

        fetch(`http://localhost:3000/utente/${idUtente}/cambioPsw`, options)
        .then(response => response.json())
        .then(response => {
            console.log(JSON.stringify(response));  //CONTROLLO DEBUG DA ELIMINARE

            if(response.esito != false){
                console.log("Password cambiata con successo");  //CONTROLLO DEBUG DA ELIMINARE
                disattivaCambiaPassword();  
            }else{
                console.log("La nuova password non può essere uguale alla precedente")  //CONTROLLO DEBUG DA ELIMINARE
                let alertStessaPsw = document.getElementById("alertStessaPsw");

                alertStessaPsw.classList.remove("d-none");
            }
        });

    }else{
        console.log("Password non ha rispettato i parametri del controllo client-side");  //CONTROLLO DEBUG DA ELIMINARE
    }   
}

//Controllo che la password rispetti i parametri richiesti
function checkPassword(password){

    let alertDanger = document.getElementById("alertDanger");
    let alertSuccess = document.getElementById("alertSuccess");
    let btnSalvaPsw = document.getElementById("btnSalvaPsw");

    if(!(regP.test(password))){                   
        //Password errata
        alertDanger.classList.remove("d-none");
        alertSuccess.classList.add("d-none");
        btnSalvaPsw.setAttribute("disabled","true");
        return false;

    }else{
        //Password corretta
        alertDanger.classList.add("d-none");
        alertSuccess.classList.remove("d-none");
        btnSalvaPsw.removeAttribute("disabled");
        return true;

    }   
}

//Funzione per l'eliminazione dell'account utente
function eliminaAccount(){
    let idUtente = localStorage.getItem("idUtente");

    let options = {
        method: 'DELETE'
    }

    fetch(`http://localhost:3000/utente/${idUtente}/eliminaAccount`, options)
    .then(response => response.json())
    .then(response => {
        console.log(JSON.stringify(response));  //CONTROLLO DEBUG DA ELIMINARE

        if(response.esito != false){
            localStorage.clear();   //Pulisco il localstorage dai dati dell'utente
            window.location.href = "Login.html"; //Rimando alla pagina di login
        }
        
    });
}
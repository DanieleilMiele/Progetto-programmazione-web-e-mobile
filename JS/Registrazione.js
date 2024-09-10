/* LE CHIAVI E LE REGEX SONO PRESE DAL JAVASCRIPT "Comune.js" */

/* Variabile globale dove con un eventListener salvo l'id del supereroe preferito scelto dall'utente */
let idSupereroePreferito;

/* Funzione per popolare la tendina per la selezione del supereroe preferito */
async function getSupereroi(){
    let linkLegale = document.getElementById("link_legale");
    let tendina_supereroi = document.getElementById("tendina_supereroi");
    let offset = 0;
    let total = 0;

    /*  Limite massimo per richiesta di 100 elementi e col valore offset possiamo indicare da quale elemento del totale
        partire con la risposta, col valore total dato nella risposta si ha il totale degli elementi e così si può fare un
        ciclo che ad ogni richiesta aggiunge i 100 elementi correnti e poi aumenta di 100 l'offset in modo che vengano restituiti i
        successivi 100 */
    for(i=0; offset<=total; i++){
        await fetch(`http://gateway.marvel.com/v1/public/characters?apikey=${public_key}&limit=${100}&offset=${offset}`)
        .then(response => response.json())
        .then(response => {

            if(i==0){                   /* Prendo questi elementi solo al primo ciclo essendo cose che non variano */
                linkLegale.innerHTML = response.attributionText;     /* Aggiorno il testo del link legale con quello fornito dalla risposta */
                linkLegale.href = response.attributionH;               /* Aggiorno il link legale con quello fornito dalla risposta */
            }
            
            /* console.log(response); */
            if(i==0){
                total = response.data.total;
            }
            for(j=0; j<response.data.results.length; j++){

                /* Il primo valore della option è il testo mentre il secondo è il valore di quella selezione, li devo invertire perché nella datalist dell'html il campo su cui ci si basa è il value*/
                tendina_supereroi.appendChild(new Option(response.data.results[j].id,response.data.results[j].name));   
            }
        })

        offset += 100;
    }
}

/* Funzione di controllo formattazione lato server in caso venisse disabilitata quella lato client */
function checkCampiRegistrazione(username,erroreUsername,email,erroreEmail,password,errorePassword){    /* Ricevo gli interi elementi dom in modo da poter lavorare sul sia su di loro che sul loro valore con .value */
    let check = true;

    if(username.value.length < 3){                      /* Controllo che l'username sia lungo almeno 3 caratteri */
        //Username errato
        erroreUsername.classList.remove("d-none");
        username.classList.remove("is-valid");
        username.classList.add("is-invalid");
        check = false;
    }else{
        //Username corretto
        erroreUsername.classList.add("d-none");
        username.classList.remove("is-invalid");
        username.classList.add("is-valid");
    }

    if(!(regE.test(email.value))){                      /* Controllo che l'email sia formattata correttamente */
        //Email errata
        erroreEmail.classList.remove("d-none");
        email.classList.remove("is-valid");
        email.classList.add("is-invalid");
        check = false;
    }else{
        //Email corretta
        erroreEmail.classList.add("d-none");
        email.classList.remove("is-invalid");
        email.classList.add("is-valid");
    }

    if(!(regP.test(password.value))){                   /* Controllo che la password rispetti i parametri richiesti */
        //Password errata
        errorePassword.classList.remove("d-none");
        password.classList.remove("is-valid");
        password.classList.add("is-invalid");
        check = false;
    }else{
        //Password corretta
        errorePassword.classList.add("d-none");
        password.classList.remove("is-invalid");
        password.classList.add("is-valid");
    }   

    return check;
}

/* Evento che prende l'id di un supereroe a partire dal suo nome (che è il "value" della option, mentre l'id è il "text") */
document.getElementById("input_supereroe").addEventListener('change', function() {
    let selectedOption = Array.from(this.list.options).find(item => item.value == this.value);      /* Conversione di un oggetto HTMLCollection in un array sul quale si fa una find */
    idSupereroePreferito = parseInt(selectedOption.textContent,10);          /* Dell'option in questione vado a prendere il testo (che nel mio caso specifico è l'id del supereroe) */
});

/* Al click del pulsante di registrazione viene fatta una fetch per registrare l'utente che farà un controllo sui campi inseriti e memorizzerà l'utente oppure mostrerà messaggi d'errore */
function registraUtente(){
    let username = document.getElementById("U");
    let erroreUsername = document.getElementById("errorFeedbackU");
    let email = document.getElementById("E");
    let erroreEmail = document.getElementById("errorFeedbackE");
    let password = document.getElementById("P");
    let errorePassword = document.getElementById("errorFeedbackP");
    
    if(checkCampiRegistrazione(username,erroreUsername,email,erroreEmail,password,errorePassword)){     /* Passo gli elementi DOM in modo da poterci lavorare anche nella funzione di controllo */
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username.value,
                email: email.value,
                password: password.value,
                id_fav_supereroe: idSupereroePreferito,             //Questo valore è sempre aggiornato grazie alla variabile globale che è a sua volta aggiornata dall'eventListener al change dell'input
                crediti: 0,
                pacchetti: 0,
                album: []
            })
        }
    
        fetch(`http://localhost:3000/registrazioneUtente`, options)
        .then(response => response.json())
        .then(response => {
            if(response.outcome){
                localStorage.setItem("idUtente",response.id);
                window.location.href = "Album_main.html";
            }
        })
    }
}
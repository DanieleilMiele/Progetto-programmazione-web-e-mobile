/* LE CHIAVI E LE REGEX SONO PRESE DAL JAVASCRIPT "Comune.js" */

/* Funzione per popolare la tendina per la selezione del supereroe preferito */
async function getSupereroi(){
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

/* Funzione che gestisce il funzionamento del button per rendere in chiaro la password mentre la si digita */
function visualizzaPassword(){
    let inputPsw = document.getElementById("password");
    let imgPsw = document.getElementById("imgPsw");
    
    let decodedImgSrc = decodeURIComponent(imgPsw.src);    /* Decodifico l'url dell'immagine per poterlo confrontare */

    if(decodedImgSrc.includes("Occhio chiuso psw.png")){        /* Controllo che nell'uri decodificato compaia il nome del file con occhio chiuso */
        /* La password non era visibile e va resa visibile */
        inputPsw.type = "text";
        imgPsw.src = "../Immagini/Occhio aperto psw.png";
        
    }else{
        /* La password era visibile e va nascosta */
        inputPsw.type = "password";
        imgPsw.src = "../Immagini/Occhio chiuso psw.png";
    }
}

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

/* Al click del pulsante di registrazione viene fatta una fetch per registrare l'utente che farà un controllo sui campi inseriti e memorizzerà l'utente oppure mostrerà messaggi d'errore */
function registraUtente(){
    let username = document.getElementById("username");
    let erroreUsername = document.getElementById("errorFeedbackUsername");
    let email = document.getElementById("email");
    let erroreEmail = document.getElementById("errorFeedbackEmail");
    let password = document.getElementById("password");
    let errorePassword = document.getElementById("errorFeedbackPassword");
    let fav_supereroe = document.getElementById("tendina_supereroi").value;
    
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
                fav_supereroe: fav_supereroe
            })
        }
    
        fetch(`http://localhost:3000/registrazioneUtente`, options)
        .then(response => response.json())
        .then(response => {
            console.log(response); 
        })
    }else{
        console.log("Sono max pezzali");
    }

    
}
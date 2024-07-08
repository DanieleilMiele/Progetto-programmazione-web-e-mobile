/* Funzione che permette il funzionamento del tasto che visualizza o oscura la password in inserimento */
function visualizzaPassword(){
    let inputPsw =document.getElementById("password");
    let imgPsw = document.getElementById("imgPsw");

    let decodedImgSrc = decodeURIComponent(imgPsw.src);     /* Decodifico l'url dell'immagine per poterlo confrontare *//* Decodifico l'url dell'immagine per poterlo confrontare */

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

//Funzione che controlla i che i campi del login rispetto il formato richiesto
function checkCampiLogin(username,erroreUsername,password,errorePassword){
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

    if(!(regP.test(password.value))){
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

function loggaUtente(){
    let username = document.getElementById("username");
    let erroreUsername = document.getElementById("errorFeedbackUsername");
    let password = document.getElementById("password");
    let errorePassword = document.getElementById("errorFeedbackPassword");
    
    if(checkCampiLogin(username,erroreUsername,password,errorePassword)){

        options = {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        }

        fetch(`http://localhost:3000/login`,options)
        .then(response => response.json())
        .then(response => {
            console.log(response);
        })
    }else{
        console.log("Sono max pezzali");
    }
}

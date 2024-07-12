/* Funzione che permette il funzionamento del tasto che visualizza o oscura la password in inserimento */
function visualizzaPassword(){
    let inputPsw =document.getElementById("password");
    let imgPsw = document.getElementById("imgPsw");

    let decodedImgSrc = decodeURIComponent(imgPsw.src);     /* Decodifico l'url dell'immagine per poterlo confrontare */

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
function checkCampiLogin(email,erroreEmail,password,errorePassword){
    let check = true;
    
    if(!(regE.test(email.value))){                      /* Controllo che l'email rispetti il formato richiesto */
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
    let email = document.getElementById("email");                       //Non prendo i .value in moodo da passare alla checkCampi solo l'oggetto in modo da poter lavorare sia sul realtivo html che sul suo valore
    let erroreEmail = document.getElementById("errorFeedbackEmail");
    let password = document.getElementById("password");
    let errorePassword = document.getElementById("errorFeedbackPassword");
    
    if(checkCampiLogin(email,erroreEmail,password,errorePassword)){

        options = {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.value,
                password: password.value
            })
        }

        fetch(`http://localhost:3000/loginUtente`,options)
        .then(response => response.json())
        .then(response => {
            if(response.outcome){
                localStorage.setItem("idUtente",response._id);
                window.location.href = "../HTML/Album_main.html";
            }
        })
    }
}

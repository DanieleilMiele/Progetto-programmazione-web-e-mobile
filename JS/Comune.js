const public_key = "00f9d24688feb94b662e98b83c78ad5e";
const private_key = "55a6e08818eec367f39284596d7db6391662162f";

//Regex per email e password
const regE = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
const regP = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[ A-Za-z\d@.#$!%*?&]{8,15}$/;

//Funzione che controlla che ci sia un utente loggato al caricamento della pagina altrimenti rimanda alla pagina di login
function checkLog(){
    let idUtente = localStorage.getItem("idUtente");

    if(idUtente == null){       //Se non è salvato nessun idUtente vuol dire che nessuno si è Loggato/Registrato
        localStorage.clear();   //Pulisco il localstorage
        window.location.href = "Login.html"
    }
}

//Funzione per sloggare un utente
function logOut(){
    localStorage.removeItem("idUtente");     //Rimuovo l'id utente dal localstorage
    window.location.reload(true);           //Dopo aver eliminato l'id utente ricarico la pagina in modo che venga chiamato di nuovo il checkLog che non trovando l'id rimanderà al login
}

/* Funzione che gestisce il funzionamento del button per rendere in chiaro la password mentre la si digita */
function visualizzaPassword(){
    let inputPsw = document.getElementById("P");
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


//Funzione per restituire il numero di crediti posseduti dall'utente e il numero di pacchetti posseduti
function checkCreditiPacchetti(){
    
    let idUtente = localStorage.getItem("idUtente");
    let counterCrediti = document.getElementById("counterCrediti");
    let counterPacchetti = document.getElementById("counterPacchetti");

    return fetch(`http://localhost:3000/utente/${idUtente}/info`)       //Il return serve a specificare che la fetch ritorna qualcosa altrimenti una volta terminata la richiesta non rimane traccia dei valori restituiti
    .then(response => response.json())
    .then(response => {
        counterCrediti.innerHTML = "Crediti: "+response.crediti+' <img id="icona_crediti" class="icone" src="../Immagini/icona moneta crediti piccola.png" alt="">';
        counterPacchetti.innerHTML = "Pacchetti: "+ response.pacchetti+' <img id="icona_pacchetti" class="icone" src="../Immagini/Icona pacchetti figurine.png" alt="">';

        return {                    //Restituisco un oggetto con i crediti e i pacchetti posseduti dall'utente
            crediti: response.crediti,  
            pacchetti: response.pacchetti
        }

    })
}

//Funzione per acquistare crediti (DA FINIRE MANCANO I MESSAGGI DI ERRORE SULLE AZIONI DELL'UTENTE)
function acquistaCrediti(){

    let idUtente = localStorage.getItem("idUtente");
    let crediti = document.getElementById("numeroCrediti").value;
    crediti = parseInt(crediti,10);     //Rendo il valore un intero altrimenti l'incremento di mongo riceve una stringa come valore dell'incremento

    options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            crediti: crediti
        })
    }

    fetch(`http://localhost:3000/utente/${idUtente}/acquistaCrediti`, options)
    .then(response => response.json())
    .then(response => {
        if(response.esito){
            console.log("Acquisto crediti effettuato");
            checkCreditiPacchetti();    //Aggiorno i crediti mostrati nel bean nella navbar
        }else{
            console.log("Acquisto crediti non effettuato");
        }
    })
}

//Funzione l'acquisto di pacchetti (DA FINIRE MANCA IL CONTROLLO SUI CREDITI SE SONO SUFFICIENTI)
async function acquistaPacchetti(){

    if( await checkMinimoCrediti() == true){    //Controllo che l'utente abbia abbastanza crediti per comprare i pacchetti
                                                //L'await è perchè essendo async mi ritorna una promise, devo quindi attendere che essa sia compeletata prima di permettere di procedere
        
        let id_utente = localStorage.getItem("idUtente");
        let pacchetti = document.getElementById("numeroPacchetti").value;
        pacchetti = parseInt(pacchetti,10);     //Rendo anche qui il valore un intero altrimenti l'incremento di mongo riceve una stringa come valore dell'incremento

        options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pacchetti: pacchetti
            })
        }

        fetch(`http://localhost:3000/utente/${id_utente}/acquistaPacchetti`, options)
        .then(response => response.json())
        .then(response => {
            if(response.esito){
                console.log("Acquisto pacchetti effettuato");

                let alertCreditiIns = document.getElementById("alertCreditiIns"); //Prendo l'alert che mi avvisa che l'utente non ha abbastanza crediti
                alertCreditiIns.classList.add("d-none");   //Nascondo l'alert

                checkCreditiPacchetti();    //Aggiorno i pacchetti mostrati nel bean nella navbar

            }else{
                console.log("Acquisto pacchetti non effettuato");
            }
        })

    }else{
        let alertCreditiIns = document.getElementById("alertCreditiIns");  //Prendo l'alert che mi avvisa che l'utente non ha abbastanza crediti
        alertCreditiIns.classList.remove("d-none");   //Mostro l'alert
    }
}


//Funzione per aprire il modal di acquisto pacchetti
function spachettamento(){
    
}

//Funzione per controllare che l'utente abbia abbastanza crediti per acquistare i pacchetti
async function checkMinimoCrediti(){

    let pacchettiDaComprare = document.getElementById("numeroPacchetti").value;   //Prendo il numero di pacchetti che l'utente intende comprare

    let jsonCreditiPacchetti = await checkCreditiPacchetti();   //Prendo il numero di crediti e pacchetti posseduti dall'utente

    let creditiDisponibili = jsonCreditiPacchetti.crediti;      //Isolo dal JSON il numero di crediti posseduti dall'utente

    if(creditiDisponibili >= pacchettiDaComprare){      //Controllo che l'utente abbia abbastanza crediti per comprare i pacchetti
        console.log("L'utente ha abbastanza crediti per comprare i pacchetti");     //CONTROLLO DEBUG DA ELIMINARE
        return true;
    }else{
        console.log("L'utente non ha abbastanza crediti per comprare i pacchetti");     //CONTROLLO DEBUG DA ELIMINARE
        return false;
    }
}

//Funzione per controllare che l'utente abbia abbastanza pacchetti da aprire quando cerca di aprirne uno
async function checkMinimoPacchetti(){

    let jsonCreditiPacchetti = await checkCreditiPacchetti();   //Prendo il numero di crediti e pacchetti posseduti dall'utente
    let pacchettiDisponibili = jsonCreditiPacchetti.pacchetti;      //Isolo dal JSON il numero di pacchetti posseduti dall'utente

    if(pacchettiDisponibili > 0){      //Controllo che l'utente abbia almeno un pacchetto da aprire
        return true;
    }else{
        return false;
    }

}
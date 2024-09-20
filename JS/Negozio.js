
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


//Funzione per popolare il modal dello spacchettamento
async function spacchettamento(){

    aggiornamentoNumeroPacchetti();  //Aggiorno il numero di pacchetti posseduti dall'utente

    await pulisciModal();    //Pulisco il modal da eventuali card di spacchettamenti precedenti

    let modalCardTemplate = document.getElementById("modalCardTemplate");

    let eroiDaEstrarre = await estraiEroi();        //Estraggo i 5 eroi che l'utente riceverà

    await aggiungiFigurineAlbum(eroiDaEstrarre);      //Aggiungo le figurine estratte all'album dell'utente

    //Mostro finalmente all'utente le 5 figurine estratte
    for(let i=0; i<5; i++){
        /* console.log("Popolazione " + (i+1) + "° figurina"); */      //CONTROLLO DEBUG DA ELIMINARE
        await fetch(`http://gateway.marvel.com/v1/public/characters?apikey=${public_key}&limit=${1}&offset=${eroiDaEstrarre[i]}`)
        .then(response => response.json())
        .then(response => {
            
            let clone = modalCardTemplate.cloneNode(true);  //Clono il template della card

            let titoloEroe = clone.getElementsByClassName("card-title")[0];
            let imgEroe = clone.getElementsByClassName("card-img-top")[0];

            titoloEroe.innerHTML = response.data.results[0].name;
            imgEroe.src = response.data.results[0].thumbnail.path + "." + response.data.results[0].thumbnail.extension;

            clone.classList.remove("d-none");   //Mostro la card

            modalCardTemplate.after(clone);     //Inserisco la card nel modal
        })

    }
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

//Funzione che ritorna un array di 5 numeri casuali che rappresentano gli eroi da estrarre
async function estraiEroi(){

    let numeriEstratti = new Array(5).fill(0);    //Creo un array di 5 elementi inizializzati a 0
    let totale;     //Variabile che conterrà il numero totale di eroi presenti nel database della Marvel

    let response = await fetch(`http://gateway.marvel.com/v1/public/characters?apikey=${public_key}&limit=${1}`);
    let responseJson = await response.json();
        
    totale = responseJson.data.total;
    console.log("Id estratti nell funzione estraiEroi():");     //CONTROLLO DEBUG DA ELIMINARE
    for(let i=0; i<5; i++){
        numeriEstratti[i] = Math.floor(Math.random()*totale);   //Genero un numero casuale tra 0 e il totale degli eroi presenti nel database della Marvel
        console.log(numeriEstratti[i]);                //CONTROLLO DEBUG DA ELIMINARE
    }
    return numeriEstratti;
}

//Funzione per pulire il modal da eventuali card di spacchettamenti precedenti
async function pulisciModal(){
    let divRowCards = document.getElementById("rowModalCards");

    let cardsArray = divRowCards.children;

    for(let i=cardsArray.length-1; i>=1; i--){       //Parto da 1 perché il primo elemento è il template della card che non voglio eliminare
        divRowCards.removeChild(cardsArray[i]);
    }

}

async function aggiornamentoNumeroPacchetti(){

    let jsonCreditiPacchetti = await checkCreditiPacchetti();   //Prendo il numero di crediti e pacchetti posseduti dall'utente
    let pacchettiDisponibili = jsonCreditiPacchetti.pacchetti;      //Isolo dal JSON il numero di crediti posseduti dall'utente

    let idUtente = localStorage.getItem("idUtente");

    options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            pacchettiDecrementati: (pacchettiDisponibili-1)
        })
    }

    await fetch(`http://localhost:3000/utente/${idUtente}/decrementaPacchetti`,options)
    .then(response => response.json())
    .then(response => {
        
        if(response.esito){
            console.log("Aggiornamento pacchetti effettuato");     //CONTROLLO DEBUG DA ELIMINARE
            checkCreditiPacchetti();    //Aggiorno i pacchetti mostrati nel bean nella navbar
        }else{
            console.log("Aggiornamento pacchetti non effettuato");     //CONTROLLO DEBUG DA ELIMINARE
        }
    });

}

async function aggiungiFigurineAlbum(arrayFigurine){

    console.log("Array id figurine che sto passando per l'aggiunta all'album\n" + arrayFigurine);     //CONTROLLO DEBUG DA ELIMINARE

    let idUtente = localStorage.getItem("idUtente");

    options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            arrayFigurine: arrayFigurine
        })
    }

    await fetch(`http://localhost:3000/utente/${idUtente}/aggiungiFigurine`, options)
    .then(response => response.json())
    .then(response => {
        
        if(response.esito){
            console.log("Aggiunta figurine all'album effettuata");     //CONTROLLO DEBUG DA ELIMINARE
        }else{
            console.log("Aggiunta figurine all'album non effettuata");     //CONTROLLO DEBUG DA ELIMINARE
        }
    })

    console.log("La funzione aggiungiFigurineAlbum() è terminata");     //CONTROLLO DEBUG DA ELIMINARE
}

async function controllaButtonSpacchettamento(){
    
    let btnApriPacchetti =  document.getElementById("btnApriPacchetti");

    let jsonCreditiPacchetti = await checkCreditiPacchetti();   //Prendo il numero di crediti e pacchetti posseduti dall'utente
    let pacchettiDisponibili = jsonCreditiPacchetti.pacchetti;      //Isolo dal JSON il numero di pacchetti posseduti dall'utente

    if(pacchettiDisponibili > 0){      //Controllo che l'utente abbia almeno un pacchetto da aprire
        btnApriPacchetti.disabled = false;      //Abilito il bottone
    }else{
        btnApriPacchetti.disabled = true;       //Disabilito il bottone
    }
}

//Controllo ogni 5 secondi se l'utente ha abbastanza pacchetti per abilitare il bottone di spacchettamento
setInterval( () => {
    controllaButtonSpacchettamento();
}, 5000);
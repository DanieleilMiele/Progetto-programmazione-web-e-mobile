// Cose da fare ad ogni refresh della pagina
document.addEventListener('DOMContentLoaded', async function() {
    const btnScambioDoppio = document.getElementById('btn-scambio-doppio');
    const secondaCartaGroup = document.getElementById('seconda-carta-proposta-group');

    // Quando clicco sul proponi seconda carta si modifica l'html per avere una tendina anche per la seconda carta
    btnScambioDoppio.addEventListener('click', async function() {

        // Controllo che la seconda carta non sia già visibile, in caso contrario la mostro, se è già visibile la nascondo e svuoto la tendina
        if(secondaCartaGroup.classList.contains('d-none')){

            secondaCartaGroup.classList.remove('d-none');

            const arraySoloId = await getSupereroiPosseduti1();

            const arraySupereroi = await getSupereroiPosseduti2(arraySoloId);
            popolazioneSecondaTendina(arraySupereroi);

        } else {

            secondaCartaGroup.classList.add('d-none');
            const tendina2_carte = document.getElementById('tendina2-carte');

            tendina2_carte.innerHTML = '';
        }
        
    });

    mostraProposteScambio();

    console.log("Ottenimento array degli id dei supereroi posseduti dall'utente");    // CONTROLLO DEBUG DA ELIMINARE
    // popolazione tendine per creazione proposte di scambio, fetch alla marvel per recuperare l'array di eroi e poi lo uso sulle 3 chiamate anzichè fare 3 fetch diverse
    const arraySoloId = await getSupereroiPosseduti1();
    console.log("Array di id ottenuto, trasformazione in array di oggetti con id e nome");    // CONTROLLO DEBUG DA ELIMINARE
    const arraySupereroiPosseduti = await getSupereroiPosseduti2(arraySoloId);
    popolazionePrimaTendina(arraySupereroiPosseduti);
    console.log("Popolazione prima tendina completata");    // CONTROLLO DEBUG DA ELIMINARE

    console.log("Array di oggetti ottenuto, ottenimento array di tutti i supereroi esistenti");    // CONTROLLO DEBUG DA ELIMINARE
    const arraySupereroiTotali = await getSupereroiDaRichiedere();


    /* la popolazione della seconda tendina avviene solo nel caso in cui viene fatta una doppia proposta per non fare calcoli inutili */
    popolazioneTendinaRichiesta(arraySupereroiTotali);
    console.log("Popolazione terza tendina completata");    // CONTROLLO DEBUG DA ELIMINARE
});

// Funzione per ottenere le proposte di scambio dal server      DA TESTARE - CONTROLLO DEBUG DA ELIMINARE
async function getProposteScambio() {
    try {

        //NON USO FETCH CON I ".THEN" PERCHÈ MI SERVE CHE LA RISPOSTA VENGA COMPLETATA PER POTER RITORNARE L'ARRAY, NON POSSO FARLO DENTRO ALLA FUNZIONE DI CALLBACK ALTRIMENTI IL RETURN VIENE PERSO

        const response = await fetch('http://localhost:3000/proposteScambio')
        const dati = await response.json();

        if (dati.outcome) {
            return dati.proposte;
            
        } else {
            console.error("Errore nel recupero delle proposte: ", dati.message);
            return [];
        }
        
    } catch (e) {
        console.error("Errore durante la chiamata fetch: ", e);
        return [];
    }
}

// Funzione per verificare se l'utente possiede una certa carta     DA TESTARE - CONTROLLO DEBUG DA ELIMINARE
async function utentePossiedeCarta(idCartaRichiesta) {
    
    idUtente = localStorage.getItem('idUtente');
    // Anche qui non ho utilizzato i .then perchè mi serve che la risposta sia completata per poter ritornare la risposta
    try {
        const response = await fetch(`http://localhost:3000/utente/${idUtente}/figurine`);
        if(response.status == 200){
            
            const dati = await response.json();
            return dati.figurine.some(figurina => figurina.id == idCartaRichiesta);     // Controllo se l'utente possiede la carta che ha l'id corrispondente a quello richiesto dalla proposta

        }else{
            console.error("Errore ritornato: " +dati.messaggio);
            return false;
        }
    } catch (e) {
        console.error("Errore nel recupero delle carte dell'utente:", e);
        return false;
    }
}

// Funzione per svuotare la lista degli scambi      FUNZIONA - CONTROLLO DEBUG DA ELIMINARE
function svuotaListaScambi() {
    const listaScambi = document.getElementById('lista-scambi');
    // Rimuove tutti i figli tranne il template
    [...listaScambi.children].forEach(element => {
        if (element.id !== "template-scambio") {
            element.remove();
        }
    });
    
}

// Funzione per caricare e clonare le proposte di scambio   DA CONTROLLARE DOPO - CONTROLLO DEBUG DA ELIMINARE
async function mostraProposteScambio() {

    svuotaListaScambi();

    const proposte = await getProposteScambio();        // Ottengo l'array delle proposte di scambio
    const template = document.getElementById('template-scambio');       /* Template per uno scambio da mostrare nella lista */

    /* Solito procedimento di ciclo delle proposte ricevute dal server e clonazione+inserimento di ciascuna di esse */
    for (let i = 0; i < proposte.length; i++) {
        const proposta = proposte[i];

        // Clonazione
        const clone = template.cloneNode(true);
        clone.classList.remove('d-none');
        clone.removeAttribute('id');

        // Popolazione
        clone.getElementsByClassName('nome-utente')[0].textContent = proposta.nomeUtente;

        let nomePrimoEroe = await getNomeEroe(proposta.idCartaProposta);
        clone.getElementsByClassName('carta-proposta')[0].textContent = nomePrimoEroe;

        let nomeEroeRichiesto = await getNomeEroe(proposta.idCartaRichiesta);
        clone.getElementsByClassName('carta-richiesta')[0].textContent = nomeEroeRichiesto;

        // Eventuale gestione della seconda carta proposta (se presente), se è null, undefined o semplicemente vuoto la nascondo
        if (proposta.idSecondaCartaProposta) {
            clone.getElementsByClassName('seconda-carta-label')[0].classList.remove('d-none');
            clone.getElementsByClassName('seconda-carta-proposta')[0].classList.remove('d-none');
            let nomeSecondoEroe = await getNomeEroe(proposta.idSecondaCartaProposta);
            clone.getElementsByClassName('seconda-carta-proposta')[0].textContent = nomeSecondoEroe;
        }else{
            clone.getElementsByClassName('seconda-carta-label')[0].classList.add('d-none');
            clone.getElementsByClassName('seconda-carta-proposta')[0].classList.add('d-none');
        }

        // Verifica se l'utente possiede la carta richiesta
        const acceptButton = clone.querySelector('button');
        const idUtente = localStorage.getItem("idUtente");

        if (proposta.idUtente === idUtente) {
            acceptButton.disabled = true;
            acceptButton.classList.remove('btn-primary', 'btn-secondary');
            acceptButton.classList.add('btn-warning');  // Cambia colore per differenziarlo
            acceptButton.textContent = "È la tua proposta";
        } else {
            // Verifica se l'utente possiede la carta richiesta
            const possiedeCarta = await utentePossiedeCarta(proposta.idCartaRichiesta);
            
            if (possiedeCarta) {
                acceptButton.disabled = false;
                acceptButton.classList.remove('btn-secondary');
                acceptButton.classList.add('btn-primary');
            } else {
                acceptButton.disabled = true;
                acceptButton.classList.remove('btn-primary');
                acceptButton.classList.add('btn-secondary');
            }
        }

        // Aggiungi event listener al bottone Accetta
        acceptButton.addEventListener('click', function() {
            accettaProposta(proposta);
        });

        // Aggiungi il clone alla lista
        const listaScambi = document.getElementById('lista-scambi');
        listaScambi.appendChild(clone);
    }

    console.log("Fine caricamento proposte di scambio");    // CONTROLLO DEBUG DA ELIMINARE 
}

// Funzione per ottenere il nome di un eroe a partire dall'id in modo che si veda il nome nella proposta    FUNZIONA, CONTIENE CODICE DI TEST (RIGA CON RESPONSE) - CONTROLLO DEBUG DA ELIMINARE  
async function getNomeEroe(idEroe) {

    /* return "Padre Pio Gang test"; */    // CONTROLLO DEBUG DA ELIMINARE

    // Anche qui non uso i .then perchè mi serve che la risposta sia completata per poter ritornare la risposta
    response = await fetch(`http://gateway.marvel.com/v1/public/characters/${idEroe}?apikey=${public_key}`);
    dati = await response.json();

    if(dati.data.results.length > 0){
        return dati.data.results[0].name;
    } else {
        return "L'id non corrisponde a nessun eroe";
    }
    
}

// Funzione per ottenere il nome utente a partire dall'ID in modo da sapere che utente ha fatto una determinata proposta    FUNZIONA - CONTROLLO DEBUG DA ELIMINARE
async function getNomeUtente(idUtente) {

    // Anche qui non uso i .then perchè mi serve che la risposta sia completata per poter ritornare la risposta
    try {
        const response = await fetch(`http://localhost:3000/utente/${idUtente}/info`);

        if(response.status == 200){
            const dati = await response.json();

            return dati.username;
        }
        
    } catch (e) {
        console.error("Errore nel recupero del nome utente: ", e);
        return "Utente Sconosciuto";
    }
}

// Funzione per accettare una proposta di scambio       DA CONTROLLARE DOPO - CONTROLLO DEBUG DA ELIMINARE
async function accettaProposta(proposta) {

    console.log("Proposta ricevuta come parametro in accettaProposta: ", proposta);    // CONTROLLO DEBUG DA ELIMINARE
    const idProposta = proposta._id;
    console.log("Sto inviando richiesta con ID:", idProposta);  // CONTROLLO DEBUG DA ELIMINARE

    const idUtente = localStorage.getItem('idUtente');
    console.log("ID Utente:", localStorage.getItem('idUtente'));        // CONTROLLO DEBUG DA ELIMINARE

    try {
        await fetch(`http://localhost:3000/utente/${idUtente}/accettaProposta/${idProposta}`, { method: 'POST' })
        .then(response => response.json())
        .then(response => {
        
            if (response.outcome) {
                alert("Proposta di scambio accettata con successo!");
                mostraProposteScambio(); // Ricarica le proposte dopo l'accettazione
            } else {
                alert("Errore nell'accettazione della proposta: " + response.message);
            }
        });
    } catch (e) {
        console.error("Errore durante l'accettazione della proposta: ", e);
    }
}

// Funzione per aggiungere una nuova proposta di scambio    DA CORREGGERE - CONTROLLO DEBUG DA ELIMINARE
async function proponiScambio(){
    
    const secondaCartaGroup = document.getElementById('seconda-carta-proposta-group');

    const idUtente = localStorage.getItem('idUtente');

    // Codice che mi permette di ottenere l'id delle carte a partire dal nome del supereroe
    const tendina_carte = document.getElementById('tendina-carte');
    const nomeCartaProposta = document.getElementById('carta-proposta').value;
    const optionCartaProposta = Array.from(tendina_carte.options).find(option => option.value === nomeCartaProposta);
    const idCartaProposta = optionCartaProposta ? optionCartaProposta.text : false;             // QUA CI CHIAMO UNA FUNZIONE DI CONTROLLO CHE DEVO ANCORA FARE PORCODIO
    console.log("idCartaProposta: " + idCartaProposta);    // CONTROLLO DEBUG DA ELIMINARE

    const tendina2_carte = document.getElementById('tendina2-carte');
    const nomeSecondaCartaProposta = document.getElementById('seconda-carta-proposta').value || undefined;  // Se il campo che cerchiamo di ottenere è vuoto assegno 'undefined' alla variabile 'secondaCartaProposta'.
    const optionSecondaCartaProposta = Array.from(tendina2_carte.options).find(option => option.value === nomeSecondaCartaProposta);
    const idSecondaCartaProposta = optionSecondaCartaProposta ? optionSecondaCartaProposta.text : undefined;           // QUA CI CHIAMO UNA FUNZIONE DI CONTROLLO CHE DEVO ANCORA FARE PORCODIO
    console.log("idSecondaCartaProposta: " + idSecondaCartaProposta);    // CONTROLLO DEBUG DA ELIMINARE

    const tendina_carte_richiesta = document.getElementById('tendina-carte-richiesta');
    const nomeCartaRichiesta = document.getElementById('carta-richiesta').value;
    const optionCartaRichiesta = Array.from(tendina_carte_richiesta.options).find(option => option.value === nomeCartaRichiesta);
    const idCartaRichiesta = optionCartaRichiesta ? optionCartaRichiesta.text : undefined;           // QUA CI CHIAMO UNA FUNZIONE DI CONTROLLO CHE DEVO ANCORA FARE PORCODIO
    console.log("idCartaRichiesta: " + idCartaRichiesta);    // CONTROLLO DEBUG DA ELIMINARE

    const nomeUtente = await getNomeUtente(idUtente);    // Ottengo il nome utente da visualizzare per la proposta

    // Controllo che i campi siano corretti e se lo sono procedo con la proposta mentre se non lo sono
    if(checkCampiProposta(idCartaProposta, idSecondaCartaProposta, idCartaRichiesta)){
        
        //Se i controlli vanno a buon fine, creo il contenuto della post e lo invio al server       
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nomeUtente: nomeUtente,
                idCartaProposta: idCartaProposta,
                idSecondaCartaProposta: idSecondaCartaProposta,
                idCartaRichiesta: idCartaRichiesta
            })
        }

        try {
            await fetch(`http://localhost:3000/utente/${idUtente}/proposteScambio`, options)
            .then(response => response.json())
            .then(response => {
                
                if (response.outcome) {
                    alert("Proposta di scambio inviata con successo!");
                    mostraProposteScambio(); // Ricarico le proposte dopo l'invio

                    // Reset delle variabili e interfaccia
                    document.getElementById('carta-proposta').value = "";
                    document.getElementById('carta-richiesta').value = "";
                    document.getElementById('seconda-carta-proposta').value = "";

                    // Nascondo il campo della seconda carta se era visibile
                    secondaCartaGroup.classList.add('d-none');
                    document.getElementById('tendina2-carte').innerHTML = ''; // Svuoto la tendina della seconda carta
                } else {
                    alert("Errore nell'invio della proposta: " + response.message);
                }
            }); 
        } catch (e) {
            console.error("Errore durante l'invio della proposta: ", e);
        }

        secondaCartaGroup.classList.add('d-none');      // Dopo l'invio nascondo di nuovo il campo della seconda carta e resetto il form
    }else{

        // Reset delle variabili e interfaccia per evitare che dopo un errore rimanga traccia delle scelte precedenti
        document.getElementById('carta-proposta').value = "";
        document.getElementById('carta-richiesta').value = "";
        document.getElementById('seconda-carta-proposta').value = "";
        document.getElementById('tendina2-carte').innerHTML = '';

        alert("Porcodio non hai passato i controlli gg")                                        // CONTROLLO DEBUG DA ELIMINARE
        console.log("PorcodeddioooooOOOOOOOO non hai superato il check dei dati inseriti");    // CONTROLLO DEBUG DA ELIMINARE
    }

}

// Funzione per controllare che i campi della proposta siano corretti       SEMBRA FUNZIONARE - CONTROLLO DEBUG DA ELIMINARE
function checkCampiProposta(idPrimaCarta, idSecondaCarta, idCartaRichiesta){

    // Controllo che sia stata selezionata almeno una carta proposta e una carta richiesta
    if (!idPrimaCarta || !idCartaRichiesta) {
        alert("Errore: Devi selezionare almeno una carta da proporre e una carta da richiedere.");
        return false;
    }

    // Controllo che la seconda carta, se visibile, sia stata selezionata
    const secondaCartaGroup = document.getElementById('seconda-carta-proposta-group');
    if (!secondaCartaGroup.classList.contains('d-none') && !idSecondaCarta) {
        alert("Errore: Se scegli di proporre una seconda carta, devi selezionarla.");
        return false;
    }

    // Controllo che le due carte proposte non siano uguali
    if (idSecondaCarta && idPrimaCarta === idSecondaCarta) {
        alert("Errore: Non puoi proporre due volte la stessa carta.");
        return false;
    }

    // Impedisco che una delle carte proposte sia uguale alla carta richiesta
    if (idPrimaCarta === idCartaRichiesta || idSecondaCarta === idCartaRichiesta) {
        alert("Errore: Non puoi proporre una carta che stai anche richiedendo.");
        return false;
    }

    return true; // Se tutti i controlli sono superati, la proposta è valida

}

//Creazione array di tutti i supereroi esistenti che sarà usato per popolare le tendine     DISATTIVATA CON UN RETURN PER I TEST MA FUNZIONA - CONTROLLO DEBUG DA ELIMINARE 
async function getSupereroiDaRichiedere() {

    /* // Array di test con due eroi        // CONTROLLO DEBUG DA ELIMINARE

    const cazziNeri = [
        { id: 1017576, name: "terza carta" },
        { id: 1009206, name: "seconda carta" }
    ];

    return cazziNeri; */

    console.log("getSupereroi è lenta per colpa dell'API ma funziona");    // CONTROLLO DEBUG DA ELIMINARE
    let offset = 0;
    let total = 0;
    const superheroes = [];

    // Questo do while cicla finchè l'offset non arriva al totale di supereroi presenti nel database della Marvel
    do {
        await fetch(`http://gateway.marvel.com/v1/public/characters?apikey=${public_key}&limit=100&offset=${offset}`)
        .then(response => response.json())
        .then(response => {

            if (offset === 0) {
                total = response.data.total;
            }

            const heroes = response.data.results.map(hero => ({id: hero.id,name: hero.name})); 
            // map serve per creare un nuovo array trasformando gli elementi dell'array originale secondo una funzione specificata
            // In questo caso, per ogni eroe, creo un oggetto con le proprietà 'id' e 'name' che viene messo in nel nuovo array 'heroes'

            superheroes.push(...heroes);    //qua uso uno spread operator insieme a push per aggiungere ad ogni ciclo tutti gli elementi di heroes (INDIVIDUALMENTE grazie allo spread operator) all'array superheroes
            offset += 100;
        });
    } while (offset < total);

    console.log("Arrivo alla fine della funzione getSupereroi");    // CONTROLLO DEBUG DA ELIMINARE
    return superheroes;     // Alla fine ritorno l'array superheroes
    
}

//Creazione array con solo gli id di tutti i supereroi posseduti dall'utente              DISATTIVATA PER TEST MA FUNZIONA - CONTROLLO DEBUG DA ELIMINARE
async function getSupereroiPosseduti1(){                      

    const idUtente = localStorage.getItem('idUtente');
    const response = await fetch(`http://localhost:3000/utente/${idUtente}/figurine`);
    
    if(response.status == 200){

        const dati = await response.json();
        return dati.figurine;

    }else{
        console.error("Errore nel recupero delle carte dell'utente: ", dati.message);
    }
}

//Creazione array di tutte le carte che l'utente possiede con id e nome                     DISATTIVATA PER TEST MA FUNZIONA - CONTROLLO DEBUG DA ELIMINARE
async function getSupereroiPosseduti2(arrayEroiId){ 

    /* // Array di test con due eroi        // CONTROLLO DEBUG DA ELIMINARE

    const cazziNeri = [
        { id: 1009368, name: "Iron Man" },
        { id: 1009220, name: "Captain America" }
    ];

    return cazziNeri; */

    let arrayEroiIdNome = [];

    for(i=0; i<arrayEroiId.length; i++){
            
        const idFigurina = arrayEroiId[i].id;

        const response2 = await fetch(`http://gateway.marvel.com/v1/public/characters/${idFigurina}?apikey=${public_key}`);
        const dati2 = await response2.json();

        const eroe = {id: idFigurina, name: dati2.data.results[0].name};

        arrayEroiIdNome.push(eroe);     //Qua non uso lo spread operator perchè devo aggiungere un solo elemento alla volta e non un insieme di elementi che vanno separati singolarmente
    }

    return arrayEroiIdNome;         //QUESTO FUNZIONA
}

// Funzione per popolare la tendina per la selezione della prima carta da proporre  FUNZIONA - CONTROLLO DEBUG DA ELIMINARE
function popolazionePrimaTendina(arraySupereroi){
    console.log("Dentro popolazione prima tendina");    // CONTROLLO DEBUG DA ELIMINARE

    const tendina_carte = document.getElementById('tendina-carte');

    arraySupereroi.forEach(supereroe => {
        /* Il primo valore della option è il testo mentre il secondo è il valore di quella selezione, li devo invertire perché nella datalist dell'html il campo su cui ci si basa è il value*/
        tendina_carte.appendChild(new Option(supereroe.id,supereroe.name));
    });
}

// Funzione per popolare la tendina per la selezione della seconda carta da proporre    DA TESTARE - CONTROLLO DEBUG DA ELIMINARE
function popolazioneSecondaTendina(arraySupereroi){
    console.log("Dentro popolazione seconda tendina");    // CONTROLLO DEBUG DA ELIMINARE
    /* Il primo valore della option è il testo mentre il secondo è il valore di quella selezione, li devo invertire perché nella datalist dell'html il campo su cui ci si basa è il value*/
    const tendina2_carte = document.getElementById('tendina2-carte');

    arraySupereroi.forEach(supereroe => {
        /* Il primo valore della option è il testo mentre il secondo è il valore di quella selezione, li devo invertire perché nella datalist dell'html il campo su cui ci si basa è il value*/
        tendina2_carte.appendChild(new Option(supereroe.id,supereroe.name));
    });
}

// Funzione per popolare la tendina per la selezione della carta richiesta  FUNZIONA - CONTROLLO DEBUG DA ELIMINARE
function popolazioneTendinaRichiesta(arraySupereroi){
    console.log("Dentro popolazione terza tendina");    // CONTROLLO DEBUG DA ELIMINARE
    /* Il primo valore della option è il testo mentre il secondo è il valore di quella selezione, li devo invertire perché nella datalist dell'html il campo su cui ci si basa è il value*/
    const tendina_carte_richiesta = document.getElementById('tendina-carte-richiesta');

    arraySupereroi.forEach(supereroe => {
        /* Il primo valore della option è il testo mentre il secondo è il valore di quella selezione, li devo invertire perché nella datalist dell'html il campo su cui ci si basa è il value*/
        tendina_carte_richiesta.appendChild(new Option(supereroe.id,supereroe.name));
    });
}
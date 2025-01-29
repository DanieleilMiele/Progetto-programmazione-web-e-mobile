// Cose da fare ad ogni refresh della pagina
document.addEventListener('DOMContentLoaded', async function() {
    const btnScambioDoppio = document.getElementById('btn-scambio-doppio');
    const btnProponiScambio = document.getElementById('btn-proponi-scambio');
    const secondaCartaGroup = document.getElementById('seconda-carta-proposta-group');
    

    btnScambioDoppio.addEventListener('click', async function() {
        secondaCartaGroup.classList.remove('d-none');

        const arraySupereroi = await getSupereroi();
        popolazioneSecondaTendina(arraySupereroi);
    });

    btnProponiScambio.addEventListener('click', function() {
        secondaCartaGroup.classList.add('d-none');
    });

    formScambio.addEventListener('submit', function(event) {
        // Aggiunge un event listener sul submit del form con id 'form-scambio' che esegue la funzione che si vede sopra
    

        

        // Invia la proposta al server chiamando la funzione 'proponiScambio'
        proponiScambio(proposta);
        
        secondaCartaGroup.classList.add('d-none');      // Dopo l'invio nascondo di nuovo il campo della seconda carta e resetto il form
        formScambio.reset();
    });

    console.log("chiamata funzione caricamento elenco proposte di scambio");    // CONTROLLO DEBUG DA ELIMINARE
    caricaProposteScambio();

    console.log("Ottenimento array supereroi");    // CONTROLLO DEBUG DA ELIMINARE
    // popolazione tendine per creazione proposte di scambio, fetch alla marvel per recuperare l'array di eroi e poi lo uso sulle 3 chiamate anzichè fare 3 fetch diverse
    const arraySupereroi = await getSupereroi();

    console.log("Inizio popolazione tendine");    // CONTROLLO DEBUG DA ELIMINARE
    popolazionePrimaTendina(arraySupereroi);
    /* la popolazione della seconda tendina avviene solo nel caso in cui viene fatta una doppia proposta per non fare calcoli inutili */
    popolazioneTendinaRichiesta(arraySupereroi);
});

//Funzione per la proposta di uno scambio



// Funzione per ottenere le proposte di scambio dal server
async function getProposteScambio() {
    try {
        const response = await fetch('http://localhost:3000/proposteScambio');
        const data = await response.json();
        if (data.outcome) {
            return data.proposte;
        } else {
            console.error("Errore nel recupero delle proposte: ", data.message);
            return [];
        }
    } catch (e) {
        console.error("Errore durante la chiamata fetch: ", e);
        return [];
    }
}

// Funzione per verificare se l'utente possiede una certa carta
async function utentePossiedeCarta(cartaRichiesta) {
    // Simulazione di una chiamata API per verificare se l'utente possiede la carta
    // Sostituisci questo codice con la tua logica per verificare le carte dell'utente
    return new Promise((resolve, reject) => {
        // Simuliamo che l'utente possieda tutte le carte tranne 'Hulk'
        if (cartaRichiesta === 'Hulk') {
            resolve(false);
        } else {
            resolve(true);
        }
    });
}

// Funzione per svuotare la lista degli scambi
function svuotaListaScambi() {
    const listaScambi = document.getElementById('lista-scambi');
    // Rimuove tutti i figli tranne il template
    listaScambi.innerHTML = '';
}

// Funzione per caricare e clonare le proposte di scambio
async function caricaProposteScambio() {
    svuotaListaScambi();

    const proposte = await getProposteScambio();

    const template = document.getElementById('template-scambio');       /* Template per uno scambio da mostrare nella lista */

    /* Solito procedimento di ciclo delle proposte ricevute dal server e clonazione+inserimento di ciascuna di esse */
    for (let i = 0; i < proposte.length; i++) {
        const proposta = proposte[i];

        // Clonazione
        const clone = template.cloneNode(true);
        clone.classList.remove('d-none');
        clone.removeAttribute('id');

        // Popolazione
        const nomeUtente = await getNomeUtente(proposta.utente);
        clone.querySelector('.nome-utente').textContent = nomeUtente;
        clone.querySelector('.carta-proposta').textContent = proposta.cartaProposta;
        clone.querySelector('.carta-richiesta').textContent = proposta.cartaRichiesta;

        // Eventuale gestione della seconda carta proposta (se presente)
        if (proposta.secondaCartaProposta) {
            clone.querySelector('.seconda-carta-label').classList.remove('d-none');
            clone.querySelector('.seconda-carta-proposta').classList.remove('d-none');
            clone.querySelector('.seconda-carta-proposta').textContent = proposta.secondaCartaProposta;
        }

        // Verifica se l'utente possiede la carta richiesta
        const possiedeCarta = await utentePossiedeCarta(proposta.cartaRichiesta);
        const acceptButton = clone.querySelector('button');

        if (possiedeCarta) {
            acceptButton.disabled = false;
            acceptButton.classList.remove('btn-secondary');
            acceptButton.classList.add('btn-primary');
        } else {
            acceptButton.disabled = true;
            acceptButton.classList.remove('btn-primary');
            acceptButton.classList.add('btn-secondary');
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

// Funzione per ottenere il nome utente a partire dall'ID
async function getNomeUtente(idUtente) {
    try {
        const response = await fetch(`http://localhost:3000/utente/${idUtente}/info`);
        const data = await response.json();
        if (data.outcome) {
            return data.username;
        } else {
            return "Utente Sconosciuto";
        }
    } catch (e) {
        console.error("Errore nel recupero del nome utente: ", e);
        return "Utente Sconosciuto";
    }
}

// Funzione per accettare una proposta di scambio
async function accettaProposta(proposta) {

    try {
        await fetch(`http://localhost:3000/utente/${idUtente}/accettaProposta/${proposta._id}`, { method: 'POST' })
        .then(response => response.json())
        .then(response => {
        
            if (response.outcome) {
                alert("Proposta di scambio accettata con successo!");
                caricaProposteScambio(); // Ricarica le proposte dopo l'accettazione
            } else {
                alert("Errore nell'accettazione della proposta: " + response.message);
            }
        });
    } catch (e) {
        console.error("Errore durante l'accettazione della proposta: ", e);
    }
}

// Funzione per aggiungere una nuova proposta di scambio
async function proponiScambio() {
    
    const cartaProposta = document.getElementById('carta-proposta').value;
    const secondaCartaProposta = document.getElementById('seconda-carta-proposta').value || undefined;  // Se il campo che cerchiamo di ottenere è vuoto assegno 'undefined' alla variabile 'secondaCartaProposta'.
    const cartaRichiesta = document.getElementById('carta-richiesta').value;

    // Creo un oggetto 'proposta' che contiene le informazioni delle carte proposte e richieste.
    if(checkCampiProposta(cartaProposta, secondaCartaProposta, cartaRichiesta)){
        
        //Se i controlli vanno a buon fine, creo il contenuto della post e lo invio al server       
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cartaProposta: cartaProposta,
                secondaCartaProposta: secondaCartaProposta,
                cartaRichiesta: cartaRichiesta
            })
        }

        try {
            await fetch(`http://localhost:3000/utente/${idUtente}/proposteScambio`, options)
            .then(response => response.json())
            .then(response => {
                
                if (response.outcome) {
                    alert("Proposta di scambio inviata con successo!");
                    caricaProposteScambio(); // Ricarica le proposte dopo l'invio
                } else {
                    alert("Errore nell'invio della proposta: " + response.message);
                }
            }); 
        } catch (e) {
            console.error("Errore durante l'invio della proposta: ", e);
        }
    }
}

function checkCampiProposta(primaCarta, secondaCarta, cartaRichiesta){

    

}

//Creazione array di tutti i supereroi esistenti che sarà usato per popolare le tendine
async function getSupereroi() {
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

// Funzione per popolare la tendina per la selezione della prima carta da proporre
function popolazionePrimaTendina(arraySupereroi){
    console.log("Dentro popolazione prima tendina");    // CONTROLLO DEBUG DA ELIMINARE
    const tendina_carte = document.getElementById('tendina-carte');

    arraySupereroi.forEach(supereroe => {
        /* Il primo valore della option è il testo mentre il secondo è il valore di quella selezione, li devo invertire perché nella datalist dell'html il campo su cui ci si basa è il value*/
        tendina_carte.appendChild(new Option(supereroe.id,supereroe.name));
    });
}

// Funzione per popolare la tendina per la selezione della seconda carta da proporre
function popolazioneSecondaTendina(arraySupereroi){
    console.log("Dentro popolazione seconda tendina");    // CONTROLLO DEBUG DA ELIMINARE
    /* Il primo valore della option è il testo mentre il secondo è il valore di quella selezione, li devo invertire perché nella datalist dell'html il campo su cui ci si basa è il value*/
    const tendina2_carte = document.getElementById('tendina2-carte');

    arraySupereroi.forEach(supereroe => {
        /* Il primo valore della option è il testo mentre il secondo è il valore di quella selezione, li devo invertire perché nella datalist dell'html il campo su cui ci si basa è il value*/
        tendina2_carte.appendChild(new Option(supereroe.id,supereroe.name));
    });
}

// Funzione per popolare la tendina per la selezione della carta richiesta
function popolazioneTendinaRichiesta(arraySupereroi){
    console.log("Dentro popolazione terza tendina");    // CONTROLLO DEBUG DA ELIMINARE
    /* Il primo valore della option è il testo mentre il secondo è il valore di quella selezione, li devo invertire perché nella datalist dell'html il campo su cui ci si basa è il value*/
    const tendina_carte_richiesta = document.getElementById('tendina-carte-richiesta');

    arraySupereroi.forEach(supereroe => {
        /* Il primo valore della option è il testo mentre il secondo è il valore di quella selezione, li devo invertire perché nella datalist dell'html il campo su cui ci si basa è il value*/
        tendina_carte_richiesta.appendChild(new Option(supereroe.id,supereroe.name));
    });
}
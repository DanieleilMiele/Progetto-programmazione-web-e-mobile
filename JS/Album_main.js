//EventListener per capire quando l'utente preme enter con il focus sull'input di ricerca utente
let barra_ricerca = document.getElementById('input_ricerca_figurina');
barra_ricerca.addEventListener('keydown', function onEvent(event) {
    if (event.key === "Enter") {
        getCloniFigurine();
    }
});


//Funzione per la restituzione degli id delle figurine possedute dall'utente
function getIdFigurine(){

    return new Promise((resolve,reject) => {
        let idUtente = localStorage.getItem("idUtente");        //Prendo l'id dell'utente loggato 

        fetch(`http://localhost:3000/utente/${idUtente}/figurine`)      //Fetch per prendere le figurine dell'utente
        .then(response => response.json())
        .then(response => {
            /* console.log(response.messaggio);  */       //CONTROLLO DEBUG DA ELIMINARE
            
            let arr_figurine_utente = response.figurine;    //Array di id delle figurine dell'utente

            resolve(arr_figurine_utente);
        })
        .catch(error => {
            console.error("Errore ottenimento elenco di figurine possedute dall'utente: "+error);
            reject(error);
        })  
    })
}  

//Funzione per svuotare il div che contiene tutte le figurine dell'album
async function svuotaAlbum(){

    let div_album = document.getElementById("div_album");     //Div contenente tutte le figurine dell'album
    let array_figurine = div_album.children;    //Array di tutte le figurine dell'album
    console.log("Numero di figurine attualmente nella pagina template incluso: "+array_figurine.length);   //CONTROLLO DEBUG DA ELIMINARE

    for(let i=array_figurine.length-2; i>=0; i--){                   //Ciclo tutte le figurine dell'album tranne l'ultima che è il template da clonare
        console.log("Numero ciclo svuotamento: "+i);   //CONTROLLO DEBUG DA ELIMINARE
        div_album.removeChild(array_figurine[i]);
    }
}

//Funzione che basandosi sull'array di id delle figurine dell'utente crea e aggiunge all'album le figurine stesse oppure mostra 
//i supereroi cercati dall'utente corrispondenti alla ricerca fatta dall'utente
async function getCloniFigurine(fig_visualizzate){

    //BLOCCO SVUOTAMENTO ALBUM
    await svuotaAlbum();

    //BLOCCO GESTIONE NUMERO ELEMENTI PER PAGINA
    if(fig_visualizzate == undefined){

        //Se non c'è nulla salvato nel localStorage si prende il valore di default
        if(localStorage.getItem("fig_visualizzate") == null){
            
            fig_visualizzate = 10;
        }else{

            fig_visualizzate = localStorage.getItem("fig_visualizzate");
        }

    }else{
        //Se è stato scelto un nuovo numero di elementi per pagina lo si aggiorna anche nel localStorage
        localStorage.setItem("fig_visualizzate",fig_visualizzate);
    }
    
    //BLOCCO REPERIMENTO ID SUPEREROI POSSEDUTI DALL'UTENTE
    let arr_figurine_utente = await getIdFigurine();     //Array di id delle figurine dell'utente

    
    //BLOCCO CREAZIONE FIGURINE
    const figurina = document.getElementById('figurina_template');     //Template vuoto per la creazione delle figurine
    /* let inputUtente = document.getElementById("input_ricerca_figurina"); */
    let valInputUtente = barra_ricerca.value;

    let linkLegale = document.getElementById("link_legale");        //Link legale per la marvel

    if(valInputUtente != ""){       //Se l'utente ha inserito un valore nella barra di ricerca
        console.log("Sto per fare la fetch (con input di testo) alla marvel di merda");   //CONTROLLO DEBUG DA ELIMINARE
        
        let errore = document.getElementById("mex_no_sup");     //Messaggio di errore se non ci sono supereroi corrispondenti
        let offset = 0;
        let total = 0;
        let eroeTrovato = false;

        /*  Limite massimo per richiesta di 100 elementi e col valore offset possiamo indicare da quale elemento del totale
        partire con la risposta, col valore total dato nella risposta si ha il totale degli elementi e così si può fare un
        ciclo che ad ogni richiesta aggiunge i 100 elementi correnti e poi aumenta di 100 l'offset in modo che vengano restituiti i
        successivi 100 */
        for(j=0; offset<=total; j++){

            //Cerco tutti i supereroi che hanno il nome inserito dall'utente per poi vedere quali tra quelli trovati sono tra le figurine dell'utente
            await fetch(`http://gateway.marvel.com/v1/public/characters?apikey=${public_key}&nameStartsWith=${valInputUtente}&limit=${100}&offset=${offset}`)
            .then(response => response.json())
            .then(response => {

                //Ciclo tutti i superEroi col nome corrispondente a quello cercato dall'utente
                for(i = 0; i < response.data.results.length; i++){

                    if(i==0){                   /* Prendo questi elementi solo al primo ciclo essendo cose che non variano */
                        linkLegale.innerHTML = response.attributionText;     /* Aggiorno il testo del link legale con quello fornito dalla risposta */
                        linkLegale.href = response.attributionH;               /* Aggiorno il link legale con quello fornito dalla risposta */
                        total = response.data.total;            //Totale dei supereroi con il nome cercato
                    }

                    let idSupereroe = response.data.results[i].id;    //Id del supereroe corrente

                    if(arr_figurine_utente.includes(idSupereroe)){    //Se il supereroe corrente è tra le figurine dell'utente

                        eroeTrovato = true;     //Setto a true la variabile che indica che almeno un supereroe è stato trovato
                        errore.classList.add('d-none');             //Nascondo il messaggio di errore
                        const clone = figurina.cloneNode(true);     /* Clono il template vuoto e lavoro su quello */
                        
                        /* Non posso usare gli id perché sarebbero tutti uguali devo usare il ByClassName
                        e prendere il primo elemento dell'array che mi viene dato (elemento che
                        sarà unico avendo per ogni ciclo di for un solo clone che viene sovrascritto
                        ogni volta) per legare alle variabili il rispettivo elemento HTML del clone */
                        let nome = clone.getElementsByClassName('card-title')[0];
                        let immagine = clone.getElementsByClassName('card-img-top')[0];
                        let dettagli = clone.getElementsByClassName('card-link')[0];
                        
                        /* Nelle variabili legate al clone mettiamo i valori presi dalla response*/
                        nome.innerHTML = response.data.results[i].name;
                        immagine.src = response.data.results[i].thumbnail.path + "." + response.data.results[i].thumbnail.extension;
                        dettagli.href = "Info_supereroe.html?id=" + idSupereroe;     //Link alla pagina di dettaglio del supereroe
                        
                        /* Rimuovo il d-none dal clone in modo da renderlo visibile */
                        clone.classList.remove('d-none');

                        /* Aggiungo al DOM della pagina dell'album il clone in modo da averlo come
                        elemento html della pagina vero e proprio */
                        figurina.before(clone);
                    }
                }
            });
            offset += 100;
        }

        if(!eroeTrovato){
            //Se nessun eroe con quelle iniziali compare tra le figurine possedute dall'utente allora mostro il messaggio di errore
            console.log("Supereroe non trovato tra le figurine dell'utente");   //CONTROLLO DEBUG DA ELIMINARE
            errore.classList.remove('d-none');            //Mostro il messaggio di errore
        }
    }else{

        //Se l'utente non ha inserito nulla nella barra di ricerca si procede con la creazione di tutte le figurine possedute dall'utente
        for(let i = 0; i < arr_figurine_utente.length; i++){
            
            console.log("Sto per fare la fetch (senza input di testo) alla marvel di merda");   //CONTROLLO DEBUG DA ELIMINARE

            //Cerco il supereroe tramite l'id del ciclo corrente
            await fetch(`http://gateway.marvel.com/v1/public/characters/${arr_figurine_utente[i]}?apikey=${public_key}`)
            .then(response => response.json())
            .then(response => {

              /*   console.log("\n\nResponse del ciclo"+i+": \n" + JSON.stringify(response));   //CONTROLLO DEBUG DA ELIMINARE */

                if(i==0){                   /* Prendo questi elementi solo al primo ciclo essendo cose che non variano */
                    linkLegale.innerHTML = response.attributionText;     /* Aggiorno il testo del link legale con quello fornito dalla risposta */
                    linkLegale.href = response.attributionH;               /* Aggiorno il link legale con quello fornito dalla risposta */
                }

                const clone = figurina.cloneNode(true);     /* Clono il template vuoto e lavoro su quello */
                
                /* Non posso usare gli id perché sarebbero tutti uguali devo usare il ByClassName
                e prendere il primo elemento dell'array che mi viene dato (elemento che
                sarà unico avendo per ogni ciclo di for un solo clone che viene sovrascritto
                ogni volta) per legare alle variabili il rispettivo elemento HTML del clone */
                let nome = clone.getElementsByClassName('card-title')[0];
                let immagine = clone.getElementsByClassName('card-img-top')[0];
                let dettagli = clone.getElementsByClassName('card-link')[0];
                
                /* Nelle variabili legate al clone mettiamo i valori presi dalla response (indice 0 perchè le richieste fatte con l'id supereroe ovviamente restituiscono solo un supereroe quindi l'array results sarà sempre da un elemento)*/
                nome.innerHTML = response.data.results[0].name;
                immagine.src = response.data.results[0].thumbnail.path + "." + response.data.results[0].thumbnail.extension;
                dettagli.href = "Info_supereroe.html?id=" + response.data.results[0].id;     //Link alla pagina di dettaglio del supereroe
                
                /* Rimuovo il d-none dal clone in modo da renderlo visibile */
                clone.classList.remove('d-none');

                /* Aggiungo al DOM della pagina dell'album il clone in modo da averlo come
                elemento html della pagina vero e proprio */
                figurina.before(clone);
            })
        }
    }
}


//Funzione per modificare l'evidenziamento "active" del menu figurine visualizzate
function changeActive(valoreSelezionato){

    let fig_10 = document.getElementById("n_fig_10")
    let fig_20 = document.getElementById("n_fig_20");
    let fig_50 = document.getElementById("n_fig_50");
    let fig_100 = document.getElementById("n_fig_100");

    switch (valoreSelezionato) {
        case 10:
            fig_10.classList.add("active");
            fig_20.classList.remove("active");
            fig_50.classList.remove("active");
            fig_100.classList.remove("active");
            break;
        case 20:
            fig_10.classList.remove("active");
            fig_20.classList.add("active");
            fig_50.classList.remove("active");
            fig_100.classList.remove("active");
            break;
        case 50:
            fig_10.classList.remove("active");
            fig_20.classList.remove("active");
            fig_50.classList.add("active");
            fig_100.classList.remove("active");
            break;
        case 100:
            fig_10.classList.remove("active");
            fig_20.classList.remove("active");
            fig_50.classList.remove("active");
            fig_100.classList.add("active");
            break;
    }
    
}
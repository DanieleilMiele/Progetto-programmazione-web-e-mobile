//Funzione principale per popolare tutte le informazioni relative al supereroe
async function popolaPagina(){

    const idEroe = new URLSearchParams(window.location.search).get('id');

    //Elementi da popolare/clonare
    let immagine_eroe = document.getElementById("immagine-eroe");
    let nome_eroe = document.getElementById("nome-eroe");
    let descrizione_eroe = document.getElementById("descrizione-eroe");

    //Prendo i template per i titoli delle liste
    let template_titolo_fumetto = document.getElementById("template-titolo-fumetto");
    let template_titolo_serie = document.getElementById("template-titolo-serie");
    let template_titolo_storia = document.getElementById("template-titolo-storia");
    let template_titolo_evento = document.getElementById("template-titolo-evento");

    /* //Clono i template per i titoli delle liste
    const cloneFumetto = template_titolo_fumetto.cloneNode(true);
    const cloneSerie = template_titolo_serie.cloneNode(true);
    const cloneStoria = template_titolo_storia.cloneNode(true);
    const cloneEvento = template_titolo_evento.cloneNode(true); */

    //Recupero le informazioni del supereroe
    fetch(`http://gateway.marvel.com/v1/public/characters/${idEroe}?apikey=${public_key}`)
    .then(response => response.json())
    .then(async response => {

         //Popolo i campi fissi da non clonare
        immagine_eroe.src = response.data.results[0].thumbnail.path + "." + response.data.results[0].thumbnail.extension;
        nome_eroe.innerHTML = response.data.results[0].name;
        descrizione_eroe.innerHTML = response.data.results[0].description;

        await popolaSezione(template_titolo_fumetto, response.data.results[0].comics.items, "Presente in nessun fumetto");
        await popolaSezione(template_titolo_serie, response.data.results[0].series.items, "Presente in nessuna serie");
        await popolaSezione(template_titolo_storia, response.data.results[0].stories.items, "Presente in nessuna storia");
        await popolaSezione(template_titolo_evento, response.data.results[0].events.items, "Presente in nessun evento");


        /*
        //Popolo i titoli dei FUMETTI solo se ce ne sono
        let numeroFumetti = response.data.results[0].comics.available;
        if(numeroFumetti > 0){
            
            for(let i=0; i<numeroFumetti; i++){
                
                cloneFumetto.innerHTML = response.data.results[0].comics.items[i].name;
                cloneFumetto.classList.remove("d-none");
                template_titolo_fumetto.before(cloneFumetto);
            }

        }else{
            cloneFumetto.innerHTML = "Presente in nessun fumetto";
            cloneFumetto.classList.remove("d-none");
            template_titolo_fumetto.before(cloneFumetto);
        }

        //Popolo i titoli delle SERIE solo se ce ne sono
        let numeroSerie = response.data.results[0].series.available;
        if(numeroSerie > 0){
            
            for(let i=0; i<numeroSerie; i++){
                
                cloneSerie.innerHTML = response.data.results[0].series.items[i].name;
                cloneSerie.classList.remove("d-none");
                template_titolo_serie.before(cloneSerie);
            }
        
        }else{
            cloneSerie.innerHTML = "Presente in nessuna serie";
            cloneSerie.classList.remove("d-none");
            template_titolo_serie.before(cloneSerie);
        }

        //Popolo i titoli delle STORIE solo se ce ne sono
        let numeroStorie = response.data.results[0].stories.available;
        if(numeroStorie > 0){
            
            for(let i=0; i<numeroStorie; i++){
                
                cloneStoria.innerHTML = response.data.results[0].stories.items[i].name;
                cloneStoria.classList.remove("d-none");
                template_titolo_storia.before(cloneStoria);
            }

        }else{
            cloneStoria.innerHTML = "Presente in nessuna storia";
            cloneStoria.classList.remove("d-none");
            template_titolo_storia.before(cloneStoria);
        }

        //Popolo i titoli degli EVENTI solo se ce ne sono
        let numeroEventi = response.data.results[0].events.available;
        if(numeroEventi > 0){
            
            for(let i=0; i<numeroEventi; i++){
                
                cloneEvento.innerHTML = response.data.results[0].events.items[i].name;
                cloneEvento.classList.remove("d-none");
                template_titolo_evento.before(cloneEvento);
            }
        
        }else{
            cloneEvento.innerHTML = "Presente in nessun evento";
            cloneEvento.classList.remove("d-none");
            template_titolo_evento.before(cloneEvento);
        } */

    });
}

//Funzione per ottimizzare il popolamento ripetitivo delle sezioni
async function popolaSezione(template, arrayTitoli, MsgSezioneVuota){

    //Controllo che l'array di titoli (di fumetti,serie,storie,eventi) non sia vuoto
    if(arrayTitoli.length > 0){

        for(let i=0; i<arrayTitoli.length; i++){

            let clone = template.cloneNode(true);         //Creo un clone del template passato come parametro

            //Modifico le informazioni del clone e poi lo aggiungo prima del template
            console.log("Aggiunto un clone di " + MsgSezioneVuota);
            clone.innerHTML = arrayTitoli[i].name;
            clone.classList.remove("d-none");
            template.before(clone);
        }
    }else{

        let clone = template.cloneNode(true);         //Creo un clone del template passato come parametro
        
        //Anche qui modifico il clone (ma col messaggio di nessuna presenza) e poi lo aggiungo
        clone.innerHTML = MsgSezioneVuota;
        clone.classList.remove("d-none");
        template.before(clone);
    }
}
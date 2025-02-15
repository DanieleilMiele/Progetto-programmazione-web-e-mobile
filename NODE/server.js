//Reminder: non chiudo le connessioni a mongo perchè mongo gestisce tramite un pool di connessioni tutte le connessioni aperte rendendole riutilizzabili e ottimizzando di conseguenza il server

const express = require('express');
const app = express();
app.use(express.json());

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "REST API AFSE",
            description: "Documentazione delle API per l'album di figurine MARVEL",
            contact: {
                name: "Daniele De Mita"
            },
            servers: ["http://localhost:3000"]
        }
    },
    apis: ["server.js"]
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const cors = require('cors'); //Package che serve per per evitare errori CORS (ovvero quando il browser non permette di fare richieste che partono da un url diverso dal localhost)
app.use(cors());

const crypto = require('crypto'); //Package per l'hashing della password

const { MongoClient , ObjectId} = require('mongodb');   //Client per la connessione e wrapper per trasformare gli id (stringhe) in oggetti (ObjectId supporti di mongo)
/* const { get } = require('http');
const { join } = require('path'); */
const uri = "mongodb+srv://daniele:Lavandino21@afse.obusmfu.mongodb.net/?appName=AFSE";  //link per la connessione al database online

// Codice per la connessione al database di Mongo
const client = new MongoClient(uri);    //client è una variabile di tipo mongoClient che consente lo scambio di informazioni con mongo

//Regex per email e password
const regE = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
const regP = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[ A-Za-z\d@.#$!%*?&]{8,15}$/;

const port = 3000;

const public_key = "00f9d24688feb94b662e98b83c78ad5e";
const private_key = "55a6e08818eec367f39284596d7db6391662162f";
let ts = Date.now().toString();  //Timestamp attuale per la generazione dell'hash per l'api marvel (forzato a stringa solo per sicurezza per il metodo createHash)

/* ----------------------------------------------------------------------- FUNZIONI ----------------------------------------------------------------------- */

//Funzione per l'hashing della password
function hash(password){
    return crypto.createHash('sha256').update(password).digest('hex');
}

/* Controllo che i campi della registrazione e del login siano formattati correttamente in caso venisse aggirato il controllo client-side */
function checkCampi(body,res){
    try{       
        //Controllo username
        if(body.username != undefined){             //Controllo che lo username sia stata inserita in modo che la stessa funzione possa essere usata anche in fase di login
            if(body.username < 3){
                res.status(400).send("Username troppo corto");
                return false;
            }
        }   
        //Controllo email
        if(body.email != undefined){                //Controllo che l'email sia stata inserita in modo che la stessa funzione possa essere usata anche in altre zone dell'applicativo
            if(!(regE.test(body.email))){
                res.status(400).send("Formato email non corretto");
                return false;
            }
        }

        //Controllo password
        if(body.password != undefined){              //Controllo che la password sia stata inserita in modo che la stessa funzione possa essere usata anche in altre zone dell'applicativo
            if(!(regP.test(body.password))){
                res.status(400).send("Parametri password non rispettati");
                return false;
            }
        }
        return true;
    
    }catch(e){
        console.error(e);
        return false;
    }
}

/* Effettiva registrazione dell'Utente nel database */
async function registraUtente(utente,res){
    
    try{
        await client.connect();

        const risRegistrazione = await client.db("AFSE").collection("Utenti").insertOne(utente); //InsertOne restituisce un oggetto che metto in risRegistrazione

        //Se la registrazione avviene con successo invio la conferma e nella response l'id dell'utente registrato
        if(risRegistrazione.acknowledged){      //acknowledged è un campo che mi dice se l'operazione è andata a buon fine
            res.status(200).json({
                "outcome": true,
                "message":"Utente registrato con successo",
                "id":risRegistrazione.insertedId    //insertedId è l'id dell'oggetto inserito (ovvero l'id dell'utente generato da mongo)
            });
        }else{res.status(404).json({
            "outcome": false,
            "message": "Errore nella registrazione"
            })
        }
    }catch(e){
        if(e.code == 11000){
            res.status(500).send("Username o email già in uso");
        }else{
            res.status(500).send("Errore generico del server, codice errore: "+e.code);
        }
    }
    
}

//Login dell'utente
async function loginUtente(body,res){
    try{
        await client.connect();

        const utente = {
            "email": body.email,
            "password": body.password
        }
        const utenteLoggato = await client.db("AFSE").collection("Utenti").findOne(utente);

        if(utenteLoggato){
            res.status(202).json({
                "outcome": true,
                "message": "Utente autenticato",
                "_id": utenteLoggato._id
            })
        }else{
            res.status(401).json({
                "outcome": false,
                "message": "Credenziali errate"
            })
        }

    }catch(e){
        console.error(e);
        res.status(500).send("Errore generico del server, codice errore: "+e.code);
    }

}

//Funzione per la restituzione di tutte le figurine di un utente
async function getAlbum(id,res){
    try{
        await client.connect();
        dbConnection = client.db("AFSE");  
        
        let utente = await dbConnection.collection("Utenti").findOne({_id: ObjectId.createFromHexString(id)});
        
        if(utente != null){
            res.status(200).json({
                messaggio: "id utente trovato",
                figurine: utente.album                 //Nel db l'utente ha una voce Album che è un array di id delle figurine che ha trovato nei pacchetti
            });
            
        }else{
            res.status(404).send("Utente non trovato");
        }

        
    }catch(e){
        console.error(e);
        res.status(500).send("Errore generico del server, codice errore: "+e.code);
    }
}

//Funzione per la restituzione delle informazioni di un utente in base all'id
async function getInfoUtente(id,res){
    try{
        await client.connect();
        dbConnection = client.db("AFSE");  
        let utente = await dbConnection.collection("Utenti").findOne({_id: ObjectId.createFromHexString(id)});
        
        if(utente != null){
            res.status(200).json({
                messaggio: "id utente trovato",
                username: utente.username,
                email: utente.email,
                password: utente.password,
                crediti: utente.crediti,
                pacchetti: utente.pacchetti,
                preferito: utente.id_fav_supereroe,
            });
        }else{
            res.status(404).send("Utente non trovato");
        }

    }catch(e){
        console.error(e);
        res.status(500).send("Errore generico del server, codice errore: "+e.code);
    }
}

//Funzione per il cambio password
async function cambioPassword(body,res){
    let hashPsw = body.password;
    let id_utente = body._id;

    try{
        await client.connect();
        dbConnection = client.db("AFSE");

        let user = await dbConnection.collection("Utenti").findOne({_id: ObjectId.createFromHexString(id_utente)});       //Prendo la password vecchia dell'utente
        let hashPswVecchia = user.password;

        if(hashPswVecchia != hashPsw){          //Controllo che la password vecchia non sia uguale alla nuova

            let esitoModifica = await dbConnection.collection("Utenti").updateOne({_id: ObjectId.createFromHexString(id_utente)},{$set:{"password":hashPsw}});

            if(esitoModifica.modifiedCount == 1){
                res.status(200).json({"messaggio": "Password cambiata con successo", "esito": true});
                
            }else{
                res.status(404).json({"messaggio": "Utente non trovato", "esito": false});
            }

        }else{
            res.status(401).json({
                "messaggio": "La nuova password non può essere uguale a quella vecchia",
                "esito": false
            });
        }

    }catch(e){
        console.error(e);
        res.status(500).send("Errore generico durante il cambio password, codice errore: "+e.code);
    }
}

//Funzione per l'eliminazione dell'account
async function eliminaAccount(id,res){
    try {
        await client.connect();
        dbConnection = client.db("AFSE");

        let esitoEliminazione = await dbConnection.collection("Utenti").deleteOne({_id: ObjectId.createFromHexString(id)});

        if( esitoEliminazione.acknowledged ){
            res.status(200).json({
                "messaggio": "Account eliminato con successo",
                "esito": true
            });

        }else{
            res.status(404).send("Utente non trovato");

        }

    } catch (e) {
        res.status(500).send("Errore generico durante l'eliminazione dell'account, codice errore: "+e.code);

    }
}

//Funzione per l'acquisto di crediti
async function acquistaCrediti(id, body, res){
    try{
        await client.connect();
        dbConnection = client.db("AFSE");

        let esitoModifica = await dbConnection.collection("Utenti").updateOne({_id: ObjectId.createFromHexString(id)},{$inc:{"crediti":body.crediti}});

        if(esitoModifica.acknowledged){
            res.status(200).json({
                "messaggio": "Crediti acquistati con successo",
                "esito": true
            });
        }else{
            res.status(404).json({
                "messaggio": "Errore durante l'acquisto dei crediti",
                "esito": false
            });
        }
        
    }catch(e){
        console.error(e);
        res.status(500).send("Errore generico del server, codice errore: "+e.code);
    }

}

//Funzione per l'acquisto di pacchetti
async function acquistaPacchetti(id, body, res){
    try{

        await client.connect();
        dbConnection = client.db("AFSE");

        let utente = await dbConnection.collection("Utenti").findOne({_id: ObjectId.createFromHexString(id)});
        let creditiUtente = utente.crediti;         //Prendo il numero di crediti dell'utente per controllare che bastino per comprare il numero di pacchetti da lui voluto

        if(creditiUtente >= body.pacchetti){        //Controllo che l'utente abbia abbastanza crediti per comprare i pacchetti

            let esitoIncremento = await dbConnection.collection("Utenti").updateOne({_id: ObjectId.createFromHexString(id)},{$inc:{"pacchetti":body.pacchetti}});       //Aggiungo tanti pacchetti quanti sono stati comprati
            let esitoDecremento = await dbConnection.collection("Utenti").updateOne({_id: ObjectId.createFromHexString(id)},{$inc:{"crediti":-body.pacchetti}});        //Decremento i crediti dell'utente tanto quanti sono i pacchetti comprati

            if(esitoIncremento.acknowledged && esitoDecremento.acknowledged){
                res.status(200).json({
                    "messaggio": "Pacchetti acquistati con successo",
                    "esito": true
                });
            }else{
                res.status(404).json({
                    "messaggio": "Errore durante l'acquisto dei pacchetti",
                    "esito": false
                });
            }
        }else{
            res.status(401).json({
                "messaggio": "Crediti insufficienti per l'acquisto",
                "esito": false
            });
        }

    }catch(e){
        console.error(e);
        res.status(500).send("Errore generico del server, codice errore: "+e.code);
    }
}

async function decrementaPacchetti(id, body, res){
    try{

        await client.connect();
        dbConnection = client.db("AFSE");

        let esitoDecremento = await dbConnection.collection("Utenti").updateOne({_id: ObjectId.createFromHexString(id)},{$set:{"pacchetti":body.pacchettiDecrementati}});        //Decremento i pacchetti dell'utente tanto quanti sono stati aperti

        if(esitoDecremento.acknowledged){
            res.status(200).json({
                "messaggio": "Pacchetti decrementati con successo",
                "esito": true
            });
        }else{
            res.status(404).json({
                "messaggio": "Errore durante il decremento dei pacchetti",
                "esito": false
            });
        }
    }catch(e){
        console.error(e);
        res.status(500).send("Errore generico del server, codice errore: "+e.code);
    }
}

async function aggiungiFigurine(id, body, res){
    try{

        //Qua passo l'array di POSIZIONI delle figurine che vanno tramutate negli eroi che corrispondono a quelle posizioni tramite l'api marvel
        let arrayPosizioniFigurine = body.arrayFigurine;          //Prendo l'array di figurine che l'utente ha aperto

        let arrayFigurineNuove = [];        //Array che conterrà gli id delle figurine aperte dall'utente


        //Preparo l'hash per le richieste backend all'api marvel
        const hash = crypto.createHash('md5').update(ts + private_key + public_key).digest('hex');

        for(let i=0; i<arrayPosizioniFigurine.length; i++){
            
            await fetch(`http://gateway.marvel.com/v1/public/characters?ts=${ts}&apikey=${public_key}&hash=${hash}&limit=${1}&offset=${arrayPosizioniFigurine[i]}`)
            .then(response => response.json())
            .then(response => {

                let idEroeCorrente = response.data.results[0].id;        //Prendo l'id dell'eroe corrente
                arrayFigurineNuove.push(idEroeCorrente);                //Aggiungo l'id dell'eroe corrente all'array di figurine nuove

            })
        }

        await client.connect();
        dbConnection = client.db("AFSE");

        let esitoModifica;
        let checkPrimaFigurina = false;
        let checkInteraOperazione = true;

        do{
            let utenteCorrente = await dbConnection.collection("Utenti").findOne({_id: ObjectId.createFromHexString(id)});
            let arrayFigurineVecchie = utenteCorrente.album;        //Prendo l'array di figurine che l'utente ha già

            if(arrayFigurineVecchie.length != 0){
                //Se l'utente ha già delle figurine nel suo album...

                checkPrimaFigurina = false;         //Indico che non siamo alla prima figurina trovata dall'utente in caso la precedente fosse stata la prima

                for(let i=0; i<arrayFigurineNuove.length; i++){

                    //Cerco la figurina nuova tra quelle vecchie
                    let esitoRicercaFigurina = arrayFigurineVecchie.find(figurinaVecchia => figurinaVecchia.id == arrayFigurineNuove[i]);

                    if(esitoRicercaFigurina != undefined){
                        //Se la nuova figurina è già posseduta dall'utente....
                        esitoModifica = await dbConnection.collection("Utenti").updateOne({_id: ObjectId.createFromHexString(id), "album.id": arrayFigurineNuove[i]},{"$inc":{"album.$.count":1}});        //Incremento di 1 il count della figurina doppione (il dollaro indica il valore dell'array che ha matchato il filtro)        

                        if(!(esitoModifica.acknowledged)){
                            //Se l'operazione di aggiunta della nuova figurina non va a buon fine...
                            checkInteraOperazione = false;
                            break;
                        }

                    }else{
                        //Se la nuova figurina non è un doppione invece...
                        let nuovoOggettoFigurina = {
                            "id": arrayFigurineNuove[i],
                            "count": 1
                        }
                        esitoModifica = await dbConnection.collection("Utenti").updateOne({_id: ObjectId.createFromHexString(id)},{$push:{"album":nuovoOggettoFigurina}});        //Aggiungo la nuova figurina all'album dell'utente

                        if(!(esitoModifica.acknowledged)){
                            //Se l'operazione di aggiunta della nuova figurina non va a buon fine...

                            checkInteraOperazione = fals
                            break;
                        }
                    }
                }
            }else{
                //Se l'utente non ha nessuna figurina nel suo album...

                checkPrimaFigurina = true;        //Indico che siamo alla prima figurina trovata dall'utente

                let nuovoOggettoFigurina = {
                    "id": arrayFigurineNuove[0],        //0 perchè se sono alla prima figurina assoluta dell'album sarà di sicuro anche la prima delle 5 che sono state estratte
                    "count": 1
                }
                esitoModifica = await dbConnection.collection("Utenti").updateOne({_id: ObjectId.createFromHexString(id)},{$push:{"album":nuovoOggettoFigurina}});        //Aggiungo la nuova figurina all'album dell'utente

                if(esitoModifica.acknowledged){
                    checkInteraOperazione = true;
                }else{
                    checkInteraOperazione = false;
                }
            }

        }while(checkPrimaFigurina == true);

        if(checkInteraOperazione){
            res.status(200).json({
                "messaggio": "Figurine aggiunte con successo",
                "esito": true
            });
        }else{
            res.status(404).json({
                "messaggio": "Errore durante l'aggiunta delle figurine",
                "esito": false
            });
        }

    }catch(e){
        console.error(e);
        res.status(500).send("Errore generico del server, codice errore: "+e.code);
    }

}

// Funzione per ottenere tutte le proposte di scambio
async function getProposteScambio(res) {
    try {
        await client.connect();
        const dbConnection = client.db("AFSE");

        const proposte = await dbConnection.collection("ProposteScambio").find().toArray();     //La find vuota ritorna tutte gli elementi in una collezione

        res.status(200).json({
            "outcome": true,
            "proposte": proposte
        });

    } catch (e) {
        console.error(e);
        res.status(500).send("Errore durante il recupero delle proposte di scambio, codice errore: " + e.code);
    }
}

// Funzione per aggiungere una nuova proposta di scambio
async function aggiungiPropostaScambio(id_utente, body, res) {
    try {
        await client.connect();
        const dbConnection = client.db("AFSE");

        // Creazione dell'oggetto proposta di scambio
        const proposta = {
            idUtente: id_utente,
            nomeUtente: body.nomeUtente,
            idCartaProposta: body.idCartaProposta,
            idSecondaCartaProposta: body.idSecondaCartaProposta, // Potrebbe essere undefined
            idCartaRichiesta: body.idCartaRichiesta,
            dataProposta: new Date()
        };

        const risultato = await dbConnection.collection("ProposteScambio").insertOne(proposta);     //Inserimento della proposta di scambio

        if (risultato.acknowledged) {
            res.status(200).json({
                "outcome": true,
                "message": "Proposta di scambio aggiunta con successo"
            });
        } else {
            res.status(400).json({
                "outcome": false,
                "message": "Errore durante l'aggiunta della proposta di scambio"
            });
        }
    } catch (e) {
        console.error(e);
        res.status(500).send("Errore durante l'aggiunta della proposta di scambio, codice errore: " + e.code);
    }
}

// Funzione per accettare una proposta di scambio
async function accettaPropostaScambio(idUtente, idProposta, res) {
    try {
        await client.connect();
        const dbConnection = client.db("AFSE");

        // Recupera la proposta di scambio
        const proposta = await dbConnection.collection("ProposteScambio").findOne({ _id: ObjectId.createFromHexString(idProposta) });

        // Semplice controllo che la proposta esista
        if (!proposta) {
            res.status(404).json({ "outcome": false, "message": "Proposta di scambio non trovata" });
            return;
        }

        // Prendo i due protagonisti dello scambio
        const utenteAccettante = await dbConnection.collection("Utenti").findOne({ _id: ObjectId.createFromHexString(idUtente) });
        const utenteProponente = await dbConnection.collection("Utenti").findOne({ _id: ObjectId.createFromHexString(proposta.idUtente) });

        // Verifica la validità dello scambio prima di eseguirlo
        const validitaScambio = await verificaValiditaScambio(utenteAccettante, proposta);
        if (!validitaScambio.valido) {
            res.status(400).json({ "outcome": false, "message": validitaScambio.message });
            return;
        }

        // Semplice controllo anche qua che entrambe gli id corrispondano a utenti esistenti
        if (!utenteAccettante || !utenteProponente) {
            res.status(404).json({ "outcome": false, "message": "Uno dei due utenti non esiste" });
            return;
        }

        // Funzione per gestire la rimozione di una figurina dall'album
        async function rimuoviFigurina(idUtente, idCarta) {
            let utente = await dbConnection.collection("Utenti").findOne({ _id: ObjectId.createFromHexString(idUtente) });
            let album = utente.album;

            // Nell'eliminazione uso findIndex per trovare la precisa posizione nell'array della figurina da eliminare
            let i = album.findIndex(fig => fig.id == idCarta);
            if (i !== -1) {     // Controllino veloce che la figurina esista nel'album (altrimenti mi torna -1)
                if (album[i].count > 1) {
                    album[i].count -= 1;  // Se il count è maggiore di 1, decremento solo il count
                } else {
                    album.splice(i, 1);   // Se count == 1, la rimuovo del tutto
                }
                await dbConnection.collection("Utenti").updateOne(
                    { _id: ObjectId.createFromHexString(idUtente) },
                    { $set: { album: album } }
                );
            }
        }

        // Funzione per aggiungere una figurina all'album
        async function aggiungiFigurina(idUtente, idCarta) {
            let utente = await dbConnection.collection("Utenti").findOne({ _id: ObjectId.createFromHexString(idUtente) });
            let album = utente.album;

            // Nell'aggiunta uso find perchè non serve conoscerne la posizione precisa, dobbiamo solo decrementare il count oppure aggiungerla
            let figurina = album.find(fig => fig.id == idCarta);        // Ritorna true se trova la figurina altrimenti false
            if (figurina) {
                figurina.count += 1;  // Se l'utente ha già la figurina, incrementa il count
            } else {
                album.push({ id: idCarta, count: 1 });  // Altrimenti, aggiungila con count = 1
            }

            // Una volta fatto aggiorno l'album dell'utente
            await dbConnection.collection("Utenti").updateOne({ _id: ObjectId.createFromHexString(idUtente) },{ $set: { album: album } });
        }

        // Esegui lo scambio
        await rimuoviFigurina(idUtente, proposta.idCartaRichiesta);
        await aggiungiFigurina(idUtente, proposta.idCartaProposta);
        await rimuoviFigurina(proposta.idUtente, proposta.idCartaProposta);
        await aggiungiFigurina(proposta.idUtente, proposta.idCartaRichiesta);

        // Gestione del caso della seconda carta proposta
        if (proposta.idSecondaCartaProposta) {
            await rimuoviFigurina(proposta.idUtente, proposta.idSecondaCartaProposta);
            await aggiungiFigurina(idUtente, proposta.idSecondaCartaProposta);
        }

        // Elimina la proposta di scambio dal database
        await dbConnection.collection("ProposteScambio").deleteOne({ _id: ObjectId.createFromHexString(idProposta) });

        res.status(200).json({ "outcome": true, "message": "Scambio effettuato con successo" });

    } catch (e) {
        console.error(e);
        res.status(500).send("Errore durante l'accettazione della proposta di scambio, codice errore: " + e.code);
    }
}


// Funzione per verificare anche lato server per sicurezza se l'utente può accettare uno scambio
async function verificaValiditaScambio(utente, proposta) {
    try {
        
        if (!utente) {
            return { valido: false, message: "Utente non trovato" };
        }

        // Controllo se l'utente possiede la carta richiesta
        const cartaRichiesta = utente.album.find(figurina => figurina.id == proposta.idCartaRichiesta);
        if (!cartaRichiesta) {
            return { valido: false, message: "Non possiedi la carta richiesta per accettare lo scambio" };
        }

        // Controllo se l'utente possiede già la carta proposta
        const cartaProposta = utente.album.find(figurina => figurina.id == proposta.idCartaProposta);
        if (cartaProposta) {
            return { valido: false, message: "Non puoi accettare lo scambio perché possiedi già la carta proposta" };
        }

        // Controllo se l'utente possiede già la seconda carta proposta (se esiste)
        if (proposta.idSecondaCartaProposta) {
            const secondaCartaProposta = utente.album.find(figurina => figurina.id == proposta.idSecondaCartaProposta);
            if (secondaCartaProposta) {
                return { valido: false, message: "Non puoi accettare lo scambio perché possiedi già la seconda carta proposta" };
            }
        }

        return { valido: true }; // Se supera tutti i controlli, lo scambio è valido
    } catch (e) {
        console.error("Errore nella verifica dello scambio:", e);
        return { valido: false, message: "Errore interno durante la verifica dello scambio" + e.message };
    }
}


// Funzione per vendere una figurina e ottenere 1 credito
async function vendiFigurina(idUtente, figurinaId, res) {
    try {
        await client.connect();
        const dbConnection = client.db("AFSE");

        // Rimuove la figurina dall'album dell'utente
        let esitoRimozione = await dbConnection.collection("Utenti").updateOne({ _id: ObjectId.createFromHexString(idUtente) },{ $pull: { album: { id: figurinaId }}});

        // Controllo se la rimozione è andata a buon fine
        if (esitoRimozione.modifiedCount > 0) {
            // Incrementa i crediti dell'utente
            let esitoIncremento = await dbConnection.collection("Utenti").updateOne({ _id: ObjectId.createFromHexString(idUtente) },{ $inc: { crediti: 1 }});

            if (esitoIncremento.modifiedCount > 0) {
                res.status(200).json({
                    "messaggio": "Figurina venduta con successo",
                    "esito": true
                });
            } else {
                res.status(500).json({
                    "messaggio": "Errore nell'aggiornamento dei crediti",
                    "esito": false
                });
            }
        } else {
            res.status(404).json({
                "messaggio": "Figurina non trovata nell'album",
                "esito": false
            });
        }
    } catch (e) {
        console.error("Errore nella vendita della figurina:", e);
        res.status(500).send("Errore generico del server, codice errore: " + e.code);
    }
}


/* ----------------------------------------------------------------------- PATHS --------------------------------------------------------------------------- */

// Path per la registrazione dell'utente
/**
 * @swagger
 * /registrazioneUtente:
 *   post:
 *     summary: Registra un nuovo utente
 *     description: Permette a un nuovo utente di registrarsi fornendo username, email e password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nome utente univoco
 *                 example: "IronMan123"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email dell'utente
 *                 example: "ironman@avengers.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password sicura dell'utente
 *                 example: "SuperSicuro123!"
 *     responses:
 *       200:
 *         description: Registrazione avvenuta con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outcome:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Utente registrato con successo"
 *                 id:
 *                   type: string
 *                   example: "65a1bc123e89f8b6d1e4c67b"
 *       400:
 *         description: Errore di validazione dei dati
 *       500:
 *         description: Errore interno del server
 */
app.post('/registrazioneUtente', async (req, res) => {
    if(checkCampi(req.body, res)){
        req.body.password = hash(req.body.password);
        await registraUtente(req.body, res);
    }
});

// Path per il login dell'utente
/**
 * @swagger
 * /loginUtente:
 *   post:
 *     summary: Effettua il login di un utente
 *     description: Permette a un utente di autenticarsi fornendo email e password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email dell'utente registrato
 *                 example: "ironman@avengers.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password associata all'account
 *                 example: "SuperSicuro123!"
 *     responses:
 *       202:
 *         description: Login effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outcome:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Utente autenticato"
 *                 _id:
 *                   type: string
 *                   example: "65a1bc123e89f8b6d1e4c67b"
 *       401:
 *         description: Credenziali errate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outcome:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Credenziali errate"
 *       500:
 *         description: Errore interno del server
 */

app.post('/loginUtente', async (req, res) => {
    if(checkCampi(req.body,res)){
        req.body.password = hash(req.body.password);
        await loginUtente(req.body, res);
    }
})

//Path per la restituzione di tutte le figurine di un utente
/**
 * @swagger
 * /utente/{id}/figurine:
 *   get:
 *     summary: Ottiene tutte le figurine possedute da un utente
 *     description: Restituisce l'elenco delle figurine presenti nell'album di un utente specifico.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'utente di cui ottenere le figurine
 *         schema:
 *           type: string
 *           example: "65a1bc123e89f8b6d1e4c67b"
 *     responses:
 *       200:
 *         description: Elenco delle figurine possedute dall'utente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messaggio:
 *                   type: string
 *                   example: "id utente trovato"
 *                 figurine:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1011334"
 *                       count:
 *                         type: integer
 *                         example: 2
 *       404:
 *         description: Utente non trovato
 *       500:
 *         description: Errore interno del server
 */

app.get('/utente/:id/figurine', async (req, res) => {
    await getAlbum(req.params.id, res);
})

//Path per la restituzione delle informazioni di un utente in base all'id
/**
 * @swagger
 * /utente/{id}/info:
 *   get:
 *     summary: Recupera le informazioni di un utente
 *     description: Restituisce i dati dell'utente specificato, inclusi username, email, crediti e pacchetti.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'utente da cercare
 *         schema:
 *           type: string
 *           example: "65a1bc123e89f8b6d1e4c67b"
 *     responses:
 *       200:
 *         description: Informazioni utente restituite con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   example: "IronMan123"
 *                 email:
 *                   type: string
 *                   example: "ironman@avengers.com"
 *                 crediti:
 *                   type: integer
 *                   example: 10
 *                 pacchetti:
 *                   type: integer
 *                   example: 3
 *       404:
 *         description: Utente non trovato
 *       500:
 *         description: Errore interno del server
 */
app.get('/utente/:id/info', async (req, res) => {
    await getInfoUtente(req.params.id, res);
})

// Path per il cambio password di un utente
/**
 * @swagger
 * /utente/{id}/cambioPsw:
 *   post:
 *     summary: Cambia la password di un utente
 *     description: Permette a un utente di aggiornare la propria password.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'utente che vuole cambiare la password
 *         schema:
 *           type: string
 *           example: "65a1bc123e89f8b6d1e4c67b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Nuova password dell'utente
 *                 example: "NuovaPasswordSicura123!"
 *     responses:
 *       200:
 *         description: Password cambiata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messaggio:
 *                   type: string
 *                   example: "Password cambiata con successo"
 *                 esito:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: La nuova password non può essere uguale alla precedente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messaggio:
 *                   type: string
 *                   example: "La nuova password non può essere uguale a quella vecchia"
 *                 esito:
 *                   type: boolean
 *                   example: false
 *       400:
 *         description: Formato password non valido
 *       500:
 *         description: Errore interno del server
 */

app.post('/utente/:id/cambioPsw', async (req, res) => {
    if(checkCampi(req.body,res)){
        req.body.password = hash(req.body.password);
        await cambioPassword(req.body, res);
    }
})

//Path per eliminazione account di un utente
/**
 * @swagger
 * /utente/{id}/eliminaAccount:
 *   delete:
 *     summary: Elimina l'account di un utente
 *     description: Rimuove definitivamente l'account di un utente dal database.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'utente da eliminare
 *         schema:
 *           type: string
 *           example: "65a1bc123e89f8b6d1e4c67b"
 *     responses:
 *       200:
 *         description: Account eliminato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messaggio:
 *                   type: string
 *                   example: "Account eliminato con successo"
 *                 esito:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Utente non trovato
 *       500:
 *         description: Errore interno del server
 */
app.delete('/utente/:id/eliminaAccount', async (req, res) => {
    await eliminaAccount(req.params.id,res); 
})

//Path per l'acquisto di crediti
/**
 * @swagger
 * /utente/{id}/acquistaCrediti:
 *   post:
 *     summary: Acquista crediti per l'utente
 *     description: Aggiunge un numero specifico di crediti all'account di un utente.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'utente che sta acquistando crediti
 *         schema:
 *           type: string
 *           example: "65a1bc123e89f8b6d1e4c67b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - crediti
 *             properties:
 *               crediti:
 *                 type: integer
 *                 description: Numero di crediti da acquistare
 *                 example: 10
 *     responses:
 *       200:
 *         description: Crediti acquistati con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messaggio:
 *                   type: string
 *                   example: "Crediti acquistati con successo"
 *                 esito:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Errore durante l'acquisto dei crediti
 *       500:
 *         description: Errore interno del server
 */

app.post('/utente/:id/acquistaCrediti', async (req, res) => {
    await acquistaCrediti(req.params.id, req.body, res);
})

//Path per l'acquisto di pacchetti
/**
 * @swagger
 * /utente/{id}/acquistaPacchetti:
 *   post:
 *     summary: Acquista pacchetti di figurine
 *     description: Permette a un utente di acquistare pacchetti di figurine utilizzando i crediti disponibili.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'utente che sta acquistando pacchetti
 *         schema:
 *           type: string
 *           example: "65a1bc123e89f8b6d1e4c67b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pacchetti
 *             properties:
 *               pacchetti:
 *                 type: integer
 *                 description: Numero di pacchetti da acquistare (1 pacchetto = 1 credito)
 *                 example: 5
 *     responses:
 *       200:
 *         description: Pacchetti acquistati con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messaggio:
 *                   type: string
 *                   example: "Pacchetti acquistati con successo"
 *                 esito:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Crediti insufficienti per l'acquisto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messaggio:
 *                   type: string
 *                   example: "Crediti insufficienti per l'acquisto"
 *                 esito:
 *                   type: boolean
 *                   example: false
 *       404:
 *         description: Errore durante l'acquisto dei pacchetti
 *       500:
 *         description: Errore interno del server
 */

app.post('/utente/:id/acquistaPacchetti', async(req, res) => {
    await acquistaPacchetti(req.params.id, req.body, res);
})

//Path per il decremento dei pacchetti quando vengono aperti
/**
 * @swagger
 * /utente/{id}/decrementaPacchetti:
 *   post:
 *     summary: Decrementa il numero di pacchetti posseduti dall'utente
 *     description: Aggiorna il numero di pacchetti posseduti dall'utente dopo l'apertura di uno o più pacchetti.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'utente che ha aperto pacchetti
 *         schema:
 *           type: string
 *           example: "65a1bc123e89f8b6d1e4c67b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pacchettiDecrementati
 *             properties:
 *               pacchettiDecrementati:
 *                 type: integer
 *                 description: Nuovo numero di pacchetti dopo l'apertura
 *                 example: 3
 *     responses:
 *       200:
 *         description: Numero di pacchetti aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messaggio:
 *                   type: string
 *                   example: "Pacchetti decrementati con successo"
 *                 esito:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Errore durante il decremento dei pacchetti
 *       500:
 *         description: Errore interno del server
 */

app.post('/utente/:id/decrementaPacchetti', async(req, res) => {
    await decrementaPacchetti(req.params.id, req.body, res);
})

//Path per l'aggiunta dei figurine aperti all'album dell'utente
/**
 * @swagger
 * /utente/{id}/aggiungiFigurine:
 *   post:
 *     summary: Aggiunge nuove figurine all'album di un utente
 *     description: Inserisce nell'album dell'utente le figurine ottenute dall'apertura di un pacchetto.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'utente che sta aggiungendo figurine
 *         schema:
 *           type: string
 *           example: "65a1bc123e89f8b6d1e4c67b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - arrayFigurine
 *             properties:
 *               arrayFigurine:
 *                 type: array
 *                 description: Lista delle nuove figurine ottenute (ID dei supereroi)
 *                 items:
 *                   type: string
 *                 example: ["1011334", "1009368", "1010846", "1009149", "1017100"]
 *     responses:
 *       200:
 *         description: Figurine aggiunte con successo all'album
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messaggio:
 *                   type: string
 *                   example: "Figurine aggiunte con successo"
 *                 esito:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Errore durante l'aggiunta delle figurine
 *       500:
 *         description: Errore interno del server
 */

app.post('/utente/:id/aggiungiFigurine', async(req, res) => {
    await aggiungiFigurine(req.params.id, req.body, res);
})

// Path per ottenere tutte le proposte di scambio
/**
 * @swagger
 * /proposteScambio:
 *   get:
 *     summary: Ottiene tutte le proposte di scambio disponibili
 *     description: Restituisce l'elenco di tutte le proposte di scambio attualmente presenti nel sistema.
 *     responses:
 *       200:
 *         description: Lista delle proposte di scambio recuperata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outcome:
 *                   type: boolean
 *                   example: true
 *                 proposte:
 *                   type: array
 *                   description: Elenco delle proposte di scambio disponibili
 *                   items:
 *                     type: object
 *                     properties:
 *                       idUtente:
 *                         type: string
 *                         description: ID dell'utente che ha creato la proposta
 *                         example: "65a1bc123e89f8b6d1e4c67b"
 *                       nomeUtente:
 *                         type: string
 *                         description: Nome dell'utente che ha creato la proposta
 *                         example: "IronMan123"
 *                       idCartaProposta:
 *                         type: string
 *                         description: ID della carta proposta per lo scambio
 *                         example: "1011334"
 *                       idSecondaCartaProposta:
 *                         type: string
 *                         description: ID di una seconda carta proposta (opzionale)
 *                         example: "1009368"
 *                       idCartaRichiesta:
 *                         type: string
 *                         description: ID della carta richiesta in cambio
 *                         example: "1017100"
 *                       dataProposta:
 *                         type: string
 *                         format: date-time
 *                         description: Data in cui la proposta è stata creata
 *                         example: "2024-06-15T12:00:00Z"
 *       500:
 *         description: Errore interno del server
 */
app.get('/proposteScambio', async (req, res) => {
    await getProposteScambio(res);
});

// Path per aggiungere una nuova proposta di scambio
/**
 * @swagger
 * /utente/{id}/proposteScambio:
 *   post:
 *     summary: Crea una nuova proposta di scambio
 *     description: Permette a un utente di proporre uno scambio di figurine.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'utente che sta creando la proposta di scambio
 *         schema:
 *           type: string
 *           example: "65a1bc123e89f8b6d1e4c67b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomeUtente
 *               - idCartaProposta
 *               - idCartaRichiesta
 *             properties:
 *               nomeUtente:
 *                 type: string
 *                 description: Nome dell'utente che crea la proposta
 *                 example: "IronMan123"
 *               idCartaProposta:
 *                 type: string
 *                 description: ID della carta proposta per lo scambio
 *                 example: "1011334"
 *               idSecondaCartaProposta:
 *                 type: string
 *                 description: ID di una seconda carta proposta (opzionale)
 *                 example: "1009368"
 *               idCartaRichiesta:
 *                 type: string
 *                 description: ID della carta richiesta in cambio
 *                 example: "1017100"
 *     responses:
 *       200:
 *         description: Proposta di scambio creata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outcome:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Proposta di scambio aggiunta con successo"
 *       400:
 *         description: Errore nella creazione della proposta di scambio
 *       500:
 *         description: Errore interno del server
 */

app.post('/utente/:id/proposteScambio', async (req, res) => {
    await aggiungiPropostaScambio(req.params.id, req.body, res);
});

// Path per accettare una proposta di scambio
/**
 * @swagger
 * /utente/{id}/accettaProposta/{idProposta}:
 *   post:
 *     summary: Accetta una proposta di scambio
 *     description: Permette a un utente di accettare una proposta di scambio e scambiare le figurine con un altro utente.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'utente che sta accettando la proposta
 *         schema:
 *           type: string
 *           example: "65a1bc123e89f8b6d1e4c67b"
 *       - name: idProposta
 *         in: path
 *         required: true
 *         description: ID della proposta di scambio da accettare
 *         schema:
 *           type: string
 *           example: "75b2de456f9c7a2d3e6f8g9h"
 *     responses:
 *       200:
 *         description: Scambio effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outcome:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Scambio effettuato con successo"
 *       400:
 *         description: L'utente non possiede la carta richiesta o ha già la carta proposta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outcome:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Non possiedi la carta richiesta per accettare lo scambio"
 *       404:
 *         description: Proposta di scambio non trovata o utente non esistente
 *       500:
 *         description: Errore interno del server
 */

app.post('/utente/:id/accettaProposta/:idProposta', async (req, res) => {
    await accettaPropostaScambio(req.params.id, req.params.idProposta, res);
});

// Path per la vendita di una figurina
/**
 * @swagger
 * /utente/{id}/vendiFigurina:
 *   post:
 *     summary: Vende una figurina in cambio di crediti
 *     description: Permette a un utente di vendere una figurina e ricevere 1 credito in cambio.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'utente che sta vendendo la figurina
 *         schema:
 *           type: string
 *           example: "65a1bc123e89f8b6d1e4c67b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - figurinaId
 *             properties:
 *               figurinaId:
 *                 type: string
 *                 description: ID della figurina da vendere
 *                 example: "1011334"
 *     responses:
 *       200:
 *         description: Figurina venduta con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messaggio:
 *                   type: string
 *                   example: "Figurina venduta con successo"
 *                 esito:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Figurina non trovata nell'album dell'utente
 *       500:
 *         description: Errore interno del server
 */

app.post('/utente/:id/vendiFigurina', async (req, res) => {
    await vendiFigurina(req.params.id, req.body.figurinaId, res);
});

// Path l'ascolto del server sulla porta 3000
app.listen(port, () => {
    console.log(`Server in ascolto sulla porta:${port}`)
})
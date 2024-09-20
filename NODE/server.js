//Reminder: non chiudo le connessioni a mongo perchè mongo gestisce tramite un pool di connessioni tutte le connessioni aperte rendendole riutilizzabili e ottimizzando di conseguenza il server

const express = require('express');
const app = express();
app.use(express.json());

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
        }res.status(404).json({
            "outcome": false,
            "message": "Errore nella registrazione"
        })

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
        console.log("Qua ci arrivo?");          //CONTROLLO DEBUG DA ELIMINARE
        let utente = await dbConnection.collection("Utenti").findOne({_id: ObjectId.createFromHexString(id)});
        
        if(utente != null){
            res.status(200).json({
                messaggio: "id utente trovato",
                figurine: utente.album                 //Nel db l'utente ha una voce Album che è un array di id delle figurine che ha trovato nei pacchetti
            });
            console.log("Qua invece?");         //CONTROLLO DEBUG DA ELIMINARE
        }else{
            res.status(404).send("Utente non trovato");
        }

        console.log("Qua è la fine");            //CONTROLLO DEBUG DA ELIMINARE
    }catch(e){
        console.error(e);
        res.status(500).send("Errore generico del server, codice errore: "+e.code);
    }
    console.log("Fine funzione restituzione array di id");            //CONTROLLO DEBUG DA ELIMINARE
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
        console.log("vecchia psw: "+hashPswVecchia);            //CONTROLLO DEBUG DA ELIMINARE
        console.log("nuova psw: "+hashPsw);                   //CONTROLLO DEBUG DA ELIMINARE
        

        if(hashPswVecchia != hashPsw){          //Controllo che la password vecchia non sia uguale alla nuova

            let esitoModifica = await dbConnection.collection("Utenti").updateOne({_id: ObjectId.createFromHexString(id_utente)},{$set:{"password":hashPsw}});

            console.log(JSON.stringify(esitoModifica));  //CONTROLLO DEBUG DA ELIMINARE

            if(esitoModifica.modifiedCount == 1){
                res.status(200).send("Password cambiata con successo");
                
            }else{
                res.status(404).send("Utente non trovato");
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
        console.log("Array di posizioni delle figurine\n" + arrayPosizioniFigurine);            //CONTROLLO DEBUG DA ELIMINARE

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

        console.log("Array di effettivi id delle figurine\n" + arrayFigurineNuove);            //CONTROLLO DEBUG DA ELIMINARE

        await client.connect();
        dbConnection = client.db("AFSE");

        let esitoModifica;
        let checkPrimaFigurina = false;
        let checkInteraOperazione = true;

        do{
            let utenteCorrente = await dbConnection.collection("Utenti").findOne({_id: ObjectId.createFromHexString(id)});
            let arrayFigurineVecchie = utenteCorrente.album;        //Prendo l'array di figurine che l'utente ha già
            console.log("Array di effettivi id delle figurine vecchie\n" + JSON.stringify(arrayFigurineVecchie));            //CONTROLLO DEBUG DA ELIMINARE

            console.log("Lunghezza array figurine vecchie: " + arrayFigurineVecchie.length);            //CONTROLLO DEBUG DA ELIMINARE
            if(arrayFigurineVecchie.length != 0){
                //Se l'utente ha già delle figurine nel suo album...

                console.log("Utente ha già delle figurine");            //CONTROLLO DEBUG DA ELIMINARE
                checkPrimaFigurina = false;         //Indico che non siamo alla prima figurina trovata dall'utente in caso la precedente fosse stata la prima

                for(let i=0; i<arrayFigurineNuove.length; i++){

                    console.log("Iterazione nel for di controllo doppioni numero " + i);            //CONTROLLO DEBUG DA ELIMINARE

                    //Cerco la figurina nuova tra quelle vecchie
                    let esitoRicercaFigurina = arrayFigurineVecchie.find(figurinaVecchia => figurinaVecchia.id == arrayFigurineNuove[i]);

                    if(esitoRicercaFigurina != undefined){
                        //Se la nuova figurina è già posseduta dall'utente....
                        esitoModifica = await dbConnection.collection("Utenti").updateOne({_id: ObjectId.createFromHexString(id), "album.id": arrayFigurineNuove[i]},{"$inc":{"album.$.count":1}});        //Incremento di 1 il count della figurina doppione (il dollaro indica il valore dell'array che ha matchato il filtro)        

                        if(!(esitoModifica.acknowledged)){
                            //Se l'operazione di aggiunta della nuova figurina non va a buon fine...
                            checkInteraOperazione = false;
                            console.log("Errore durante l'aggiunta delle figurine (doppione) all'iterazione numero " + i);            //CONTROLLO DEBUG DA ELIMINARE
                            break;
                        }else{
                            console.log("Figurina doppione incrementata con successo");            //CONTROLLO DEBUG DA ELIMINARE
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

                            checkInteraOperazione = false;
                            console.log("Errore durante l'aggiunta delle figurine (non doppione) all'iterazione numero " + i);            //CONTROLLO DEBUG DA ELIMINARE
                            break;
                        }else{
                            console.log("Figurina non doppione aggiunta con successo");            //CONTROLLO DEBUG DA ELIMINARE
                        }
                    }
                }
            }else{
                //Se l'utente non ha nessuna figurina nel suo album...

                console.log("E' la prima figurina dell'utente");            //CONTROLLO DEBUG DA ELIMINARE

                checkPrimaFigurina = true;        //Indico che siamo alla prima figurina trovata dall'utente

                let nuovoOggettoFigurina = {
                    "id": arrayFigurineNuove[0],        //0 perchè se sono alla prima figurina assoluta dell'album sarà di sicuro anche la prima delle 5 che sono state estratte
                    "count": 1
                }
                esitoModifica = await dbConnection.collection("Utenti").updateOne({_id: ObjectId.createFromHexString(id)},{$push:{"album":nuovoOggettoFigurina}});        //Aggiungo la nuova figurina all'album dell'utente

                if(esitoModifica.acknowledged){
                    console.log("Prima figurina aggiunta con successo");            //CONTROLLO DEBUG DA ELIMINARE
                    checkInteraOperazione = true;
                }else{
                    checkInteraOperazione = false;
                    console.log("Errore durante l'aggiunta della prima figurina all'album dell'utente");            //CONTROLLO DEBUG DA ELIMINARE
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

/* ----------------------------------------------------------------------- PATHS --------------------------------------------------------------------------- */

// Path per la registrazione dell'utente
app.post('/registrazioneUtente', async (req, res) => {
    if(checkCampi(body, res)){
        req.body.password = hash(req.body.password);
        await registraUtente(req.body, res);
    }
});

// Path per il login dell'utente
app.post('/loginUtente', async (req, res) => {
    if(checkCampi(req.body,res)){
        req.body.password = hash(req.body.password);
        await loginUtente(req.body, res);
    }
})

//Path per la restituzione di tutte le figurine di un utente
app.get('/utente/:id/figurine', async (req, res) => {
    await getAlbum(req.params.id, res);
})

//Path per la restituzione delle informazioni di un utente in base all'id
app.get('/utente/:id/info', async (req, res) => {
    await getInfoUtente(req.params.id, res);
})

// Path per il cambio password di un utente
app.post('/utente/:id/cambioPsw', async (req, res) => {
    if(checkCampi(req.body,res)){
        console.log("Psw pre hash: "+req.body.password);            //CONTROLLO DEBUG DA ELIMINARE
        req.body.password = hash(req.body.password);
        await cambioPassword(req.body, res);
    }
})

//Path per eliminazione account di un utente
app.delete('/utente/:id/eliminaAccount', async (req, res) => {
    await eliminaAccount(req.params.id,res); 
})

//Path per l'acquisto di crediti
app.post('/utente/:id/acquistaCrediti', async (req, res) => {
    await acquistaCrediti(req.params.id, req.body, res);
})

//Path per l'acquisto di pacchetti
app.post('/utente/:id/acquistaPacchetti', async(req, res) => {
    await acquistaPacchetti(req.params.id, req.body, res);
})

//Path per il decremento dei pacchetti quando vengono aperti
app.post('/utente/:id/decrementaPacchetti', async(req, res) => {
    await decrementaPacchetti(req.params.id, req.body, res);
})

//Path per l'aggiunta dei figurine aperti all'album dell'utente
app.post('/utente/:id/aggiungiFigurine', async(req, res) => {
    await aggiungiFigurine(req.params.id, req.body, res);
})

// Path l'ascolto del server sulla porta 3000
app.listen(port, () => {
    console.log(`Server in ascolto sulla porta:${port}`)
})
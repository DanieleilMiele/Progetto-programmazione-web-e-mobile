const express = require('express');
const app = express();
app.use(express.json());

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

var cors = require('cors'); //Package che serve per per evitare errori CORS (ovvero quando il browser non permette di fare richieste che partono da un url diverso dal localhost)
app.use(cors());

const crypto = require('crypto'); //Package per l'hashing della password

const { MongoClient , ObjectId} = require('mongodb');   //Client per la connessione e wrapper per trasformare gli id (stringhe) in oggetti (ObjectId supporti di mongo)
const uri = "mongodb+srv://daniele:Lavandino21@afse.obusmfu.mongodb.net/?appName=AFSE";  //link per la connessione al database online

// Codice per la connessione al database di Mongo
const client = new MongoClient(uri);    //client è una variabile di tipo mongoClient che consente lo scambio di informazioni con mongo

//Regex per email e password
const regE = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
const regP = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[ A-Za-z\d@.#$!%*?&]{8,15}$/;

const port = 3000;
/* ----------------------------------------------------------------------- FUNZIONI ----------------------------------------------------------------------- */

//Funzione per l'hashing della password
function hash(password){
    return crypto.createHash('sha256').update(password).digest('hex');
}

/* Controllo che i campi della registrazione e del login siano formattati correttamente in caso venisse aggirato il controllo client-side */
function checkCampi(body,res){
    try{       
        //Controllo username
        if(body.username != undefined){             //Controllo che l'email sia stata inserita in modo che la stessa funzione possa essere usata anche in fase di login
            if(body.username < 3){
                res.status(400).send("Username troppo corto");
                return false;
            }
        }   
        //Controllo email
        if(!(regE.test(body.email))){
            res.status(400).send("Formato email non corretto");
            return false;
        }

        //Controllo password
        if(!(regP.test(body.password))){
            res.status(400).send("Parametri password non rispettati");
            return false;
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
        }

        await client.close();

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
            res.status(401).send("Autenticazione negata, username o password errati");
        }

        await client.close();

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
        registraUtente(req.body, res);
    }
});

// Path per il login dell'utente
app.post('/loginUtente', async (req, res) => {
    if(checkCampi(req.body,res)){
        req.body.password = hash(req.body.password);
        loginUtente(req.body, res);
    }
})

// Path l'ascolto del server sulla porta 3000
app.listen(port, () => {
    console.log(`Server in ascolto sulla porta:${port}`)
})
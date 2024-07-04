const express = require('express');
const app = express();
app.use(express.json());
const port = 3000;
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
var cors = require('cors'); //Package che serve per per evitare errori CORS (ovvero quando il browser non permette di fare richieste che partono da un url diverso dal localhost)
app.use(cors());

const { MongoClient , ObjectId} = require('mongodb');   //Client per la connessione e wrapper per trasformare gli id (stringhe) in oggetti (ObjectId supporti di mongo)
const uri = "mongodb+srv://daniele:Lavandino21@afse.obusmfu.mongodb.net/?appName=AFSE";  //link per la connessione al database online

// Codice per la connessione al database di Mongo
const client = new MongoClient(uri);    //client è una variabile di tipo mongoClient che consente lo scambio di informazioni con mongo


/* ----------------------------------------------------------------------- FUNZIONI ----------------------------------------------------------------------- */

/* Controllo che i campi della registrazione siano formattati correttamente in caso si aggirasse il controllo client-side */
async function checkRegistrazione(body){
    const regE = "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?";
    const regP = "/^(?=.*[az])(?=.*[AZ])(?=.*\d)(?=.*[@.#$!%*?&^])[ A-Za-z\d@.#$!%*?&]{8,15}$/";
    try{
        if(body.username < 3){
            res.status(401).send("Username troppo corto");
            return false;
        }
        if(regE.test(body.email)){
            res.status(401).send("Formato email non corretto");
            return false;
        }
        if(regP.test(body.password)){
            res.status(401).send("Parametri password non rispettati");
            return false;
        }

        return true;
    
    }catch(e){
        console.error(e);
        return false;
    }
}

/* Effettiva registrazione dell'Utente nel database */
async function registraUtente(body){
    try{
        if(checkRegistrazione()){
            const dbConnection = await client.connect();
            console.log("Non dovrei essere qui");
        }
    }catch(e){
        console.error(e);
        return false;
    }
}

/* ----------------------------------------------------------------------- PATHS --------------------------------------------------------------------------- */

// Path per la registrazione dell'utente
app.post('/registrazioneUtente', async (req, res) => {
    if(checkRegistrazione(req.body)){
        registraUtente(req.body);
    }
});

// Path per il login dell'utente
app.get('/login', async (req, res) => {
    if(checkLogin()){
        login();
    }
})

// Path l'ascolto del server sulla porta 3000
app.listen(port, '0.0.0.0', () => {
    console.log(`Server in ascolto sulla porta:${port}`)
})
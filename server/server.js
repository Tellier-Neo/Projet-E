const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
app.use(cors());
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser'); // Ajout du middleware body-parser
const cookieParser = require('cookie-parser');
const port = 3000;
const db = mysql.createConnection({
  host: 'localhost',
  user: 'wikiadmin',
  password: '7415369852147829874123148635',
  database: 'wikicar'
});


app.use((req, res, next) => {
  console.log(`Tentative de connexion sur le port ${port} - ${new Date()}`);
  next();
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données : ' + err.message);
  } else {
    console.log('Connecté à la base de données MySQL');
  }
});

app.use(bodyParser.json()); // Utilisation du middleware body-parser

const server = app.listen(port, () => {
  console.log(`Le serveur écoute sur le port ${port}`);
});


app.post('/register', async (req, res) => {
         const userUUID = uuidv4();
if (!req.body || !req.body.identifiant || !req.body.password) {
    return res.status(600).json({ error: 'Les champs username et password sont requis.' });
  }
  const { identifiant, password, } = req.body;
 console.log(password); //C'est la plus grosse erreur de sécurité sachant que le mot de passe est crypté juste après
  // Déclaration de userExistsQuery pour la vérification de l'existence de l'utilisateur
  const userExistsQuery = 'SELECT * FROM User WHERE identifiant = ?';

  db.query(userExistsQuery, [identifiant], async (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification de l\'existence de l\'utilisateur :', err);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: 'Cet utilisateur existe déjà.' });
    }

    try {
      // Crypter le mot de passe avant de le stocker dans la base de données
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insérer le nouvel utilisateur dans la base de données
      const insertUserQuery = 'INSERT INTO User (identifiant, password, uuid) VALUES (?, ?, ?)';
      db.query(insertUserQuery, [identifiant, hashedPassword, userUUID], (insertErr) => {
        if (insertErr) {
      console.error('Erreur lors de l\'enregistrement de l\'utilisateur :', insertErr);
          return res.status(500).json({ error: 'Erreur interne du serveur.' });
        }

        // Répondre avec un message de réussite
        res.status(201).json({ message: 'Utilisateur enregistré avec succès.' });
      });
    } catch (error) {
      // En cas d'erreur lors du cryptage du mot de passe
      console.error('Erreur lors du cryptage du mot de passe :', error);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  });
});

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      console.error(`Erreur : Le port ${port} nécessite des privilèges élevés.`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Erreur : Le port ${port} est déjà en cours d'utilisation.`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Route GET pour obtenir des informations
app.get('/info', (req, res) => {
  res.json({
    message: 'Bienvenue sur le serveur Node.js !',
    timestamp: new Date().toISOString()
  });
});



app.post('/login', async (req, res) => {
  const { identifiant, password } = req.body;

  const query = 'SELECT * FROM User WHERE identifiant = ?';
  db.query(query, [identifiant], async (err, results) => {
    if (err) {
      console.error('Erreur lors de la requête à la base de données:', err);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }

    if (results.length > 0) {
      const user = results[0];

      const match = await bcrypt.compare(password, user.password);

      if (match) {
        const uuidQuery = 'SELECT uuid FROM User WHERE identifiant = ?';
        db.query(uuidQuery, [identifiant], (uuidErr, uuidResults) => {
          if (uuidErr) {
            console.error('Erreur lors de la récupération du UUID de l\'utilisateur:', uuidErr);
            return res.status(500).json({ message: 'Erreur du serveur' });
          }

          if (uuidResults.length > 0) {
            const userUUID = uuidResults[0].uuid;

            // Envoyer l'UUID en tant que JSON dans la réponse
            res.cookie('userUUID', userUUID, { httpOnly: true });
            res.status(200).json({ message: 'Connexion réussie', userUUID });
          } else {
            res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
          }
        });
      } else {
        res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
      }
    } else {
      res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }
  });
});

app.post('/get_userinfo', (req, res) => {
    const userUUID = req.body.userUUID;

    if (!userUUID) {
        return res.status(400).json({ error: 'Le userUUID est manquant dans la requête.' });
    }

    // Requête SQL pour récupérer le nom d'utilisateur en fonction du userUUID
    const query = 'SELECT identifiant FROM User WHERE uuid = ?';

    // Exécutez la requête
    db.query(query, [userUUID], (error, results) => {
        if (error) {
            console.error('Erreur lors de la requête SQL :', error);
            return res.status(500).json({ error: 'Erreur lors de la rcupération des informations de l\'utilisateur.' });
        }

        // Vérifiez si des résultats ont été trouvés
        if (results.length === 0) {
            return res.status(404).json({ error: 'Aucun utilisateur trouvé avec ce userUUID.' });
        }

        // Renvoie le nom d'utilisateur en tant que réponse
        const username = results[0].identifiant;
        res.json({ username });
    });
});
app.post('/disconnect', (req, res) => {
    const uuid = req.body.userUUID;

    if (!uuid) {
        return res.status(400).json({ error: 'Le userUUID est manquant dans la requête.' });
    }

    // Génère un nouveau userUUID
    const newUUID = uuidv4();

    // Mise à jour de l'utilisateur dans la base de données avec le nouveau userUUID
    const sqlUpdateQuery = 'UPDATE User SET uuid = ? WHERE uuid = ?';

    // Exécutez la requête SQL
    db.query(sqlUpdateQuery, [newUUID, uuid], (error, results) => {
        if (error) {
            console.error('Erreur lors de la mise à jour du userUUID dans la base de données :', error);
            return res.status(500).json({ error: 'Erreur lors de la mise à jour du userUUID.' });
        }

        // Vérifie si l'utilisateur a été mis à jour avec succès
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Aucun utilisateur trouvé avec ce userUUID.' });
        }

        // Répond avec un statut de succès
        res.json({ success: true });
    });
});
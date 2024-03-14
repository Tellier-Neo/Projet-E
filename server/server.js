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
const moment = require('moment');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'wikiadmin',
  password: '7415369852147829874123148635',
  database: 'wikicar'
});

function deleteObsoleteMessages() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const deleteQuery = 'DELETE FROM ChatText WHERE messageDate < ?';

  db.query(deleteQuery, [oneDayAgo], (error, results) => {
    if (error) {
      console.error('Erreur lors de la suppression des messages obsolètes :', error);
    } else {
      console.log('Messages obsolètes supprimés avec succès.');
    }
  });
}





db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données : ' + err.message);
  } else {
    console.log('Connecté à la base de données MySQL');
    deleteObsoleteMessages();
  }
});

app.use(bodyParser.json());

const server = app.listen(port, () => {
  console.log(`Le serveur écoute sur le port ${port}`);
});

console.log("===============================================");
console.log("               Détails du serveur              ");
console.log("===============================================");
console.log("  Nom du serveur  : Wikicar server");
console.log("  Version         : 1.1.1");
console.log("  Port écoute     : 3000");
console.log("  Environnement   : Dev edition");
console.log("===============================================");
console.log("===============================================");



app.post('/register', async (req, res) => {
  const userUUID = uuidv4();

  if (!req.body || !req.body.identifiant || !req.body.password) {
    return res.status(600).json({ error: 'Les champs username et password sont requis.' });
  }

  const { identifiant, password } = req.body;

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
      const hashedPassword = await bcrypt.hash(password, 10);

      const insertUserQuery = 'INSERT INTO User (identifiant, password, uuid, ProfilePictureURL, FavoriteCarModel) VALUES (?, ?, ?, NULL, NULL)';
      db.query(insertUserQuery, [identifiant, hashedPassword, userUUID], (insertErr) => {
        if (insertErr) {
          console.error('Erreur lors de l\'enregistrement de l\'utilisateur :', insertErr);
          return res.status(500).json({ error: 'Erreur interne du serveur.' });
        }

        res.status(201).json({ message: 'Utilisateur enregistré avec succès.' });
        console.log("Création d'un utilisateur.");
      });
    } catch (error) {
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


            res.cookie('userUUID', userUUID, { httpOnly: true });
            res.status(200).json({ message: 'Connexion réussie', userUUID });
            console.log("Connexion a un compte effectué")
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


  const query = 'SELECT identifiant FROM User WHERE uuid = ?';

  // Exécutez la requête
  db.query(query, [userUUID], (error, results) => {
    if (error) {
      console.error('Erreur lors de la requête SQL :', error);
      return res.status(500).json({ error: 'Erreur lors de la rcupération des informations de l\'utilisateur.' });
    }


    if (results.length === 0) {
      return res.status(404).json({ error: 'Aucun utilisateur trouvé avec ce userUUID.' });
    }


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
    console.log("Changement d'un UUID");
  });
});


// Route GET pour récupérer toutes les informations sauf l'id depuis la table 'Car'
app.get('/cars', (req, res) => {
  // Requête SQL pour sélectionner toutes les colonnes sauf l'id depuis la table 'Car'
  const query = 'SELECT Marque, Modele, Puissance, Description, LienImage FROM Car';

  // Exécutez la requête
  db.query(query, (error, results) => {
    if (error) {
      console.error('Erreur lors de la requête SQL :', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des données.' });
    }

    // Renvoie les résultats au format JSON
    res.json(results);
  });
});

app.post('/getbymodel', (req, res) => {
  const model = req.body.model;
  console.log('Requête getbymodel demandé');

  // Requête SQL pour rechercher une voiture par modèle ou renvoyer un nombre limité de voitures aléatoires si le modèle est vide
  const query = model
    ? 'SELECT Marque, Modele, Puissance, Description, LienImage FROM Car WHERE Modele LIKE ?'
    : 'SELECT Marque, Modele, Puissance, Description, LienImage FROM Car ORDER BY RAND() LIMIT 15';
  console.log('Requête SQL effectuée');

  // Exécutez la requête avec le modèle en tant que paramètre s'il est fourni
  db.query(query, model ? [`%${model}%`] : [], (error, results) => {
    if (error) {
      console.error('Erreur lors de la requête SQL :', error);
      return res.status(500).json({ error: 'Erreur lors de la recherche de la voiture.' });
    }

    // Renvoie les résultats au format JSON
    res.json(results);
  });
});


app.post('/addmessage', (req, res) => {
  const { uuid, text } = req.body;

  if (!uuid || !text) {
    return res.status(400).json({ error: 'Les champs uuid et text sont requis.' });
  }

  const checkUserQuery = 'SELECT id FROM User WHERE uuid = ?';

  db.query(checkUserQuery, [uuid], (error, userResults) => {
    if (error) {
      console.error('Erreur lors de la vérification de l\'existence de l\'utilisateur :', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ error: 'Aucun utilisateur trouvé avec cet uuid.' });
    }

    const userId = userResults[0].id;

    const addMessageQuery = 'INSERT INTO ChatText (text, userId, messageDate) VALUES (?, ?, ?)';

    db.query(addMessageQuery, [text, userId, moment().format('YYYY-MM-DD HH:mm:ss')], (insertError, insertResults) => {
      if (insertError) {
        console.error('Erreur lors de l\'ajout du message dans la table ChatText :', insertError);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
      }

      res.status(201).json({ message: 'Message ajouté avec succès.' });
    });
  });
});

app.get('/getlastmessages', (req, res) => {
  // Requête SQL pour obtenir les 10 derniers messages avec les usernames
  const getLastMessagesQuery = `
      SELECT ChatText.text, User.identifiant as username
      FROM ChatText
      JOIN User ON ChatText.userId = User.id
      ORDER BY ChatText.ID DESC
      LIMIT 10
  `;

  // Exécuter la requête SQL
  db.query(getLastMessagesQuery, (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération des 10 derniers messages :', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }

    // Renvoyer les résultats au client
    res.json(results);
  });
});

app.post('/addcar', (req, res) => {
  const { uuid, Marque, Modele, Puissance, Description, LienImage } = req.body;
  console.log("Requête reçue pour ajouter une voiture :", req.body);

  if (!uuid || !Marque || !Modele || !Puissance || !Description || !LienImage) {
    return res.status(480).json({ error: 'Des éléments sont manquants dans le formulaire.' });
    console.log("Erreur dans l'insertion de la voiture : Code 480")
  }

  const checkUUIDQuery = 'SELECT * FROM User WHERE uuid = ?';
  db.query(checkUUIDQuery, [uuid], (uuidCheckError, uuidCheckResults) => {
    if (uuidCheckError) {
      console.error('Erreur lors de la vérification de l\'UUID existant :', uuidCheckError);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
      console.log("Erreur 500 pour la requête addcar")
    }

    if (uuidCheckResults.length === 0) {
      return res.status(404).json({ error: 'UUID non valide.' });
    }

    const userId = uuidCheckResults[0].id;

    const getUsernameQuery = 'SELECT identifiant FROM User WHERE id = ?';
    db.query(getUsernameQuery, [userId], (usernameError, usernameResults) => {
      if (usernameError) {
        console.error('Erreur lors de la récupération du nom d\'utilisateur :', usernameError);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
      }

      if (usernameResults.length > 0) {
        const username = usernameResults[0].identifiant;

        const fullDescription = `${Description} - By ${username}`;

        const checkModelQuery = 'SELECT * FROM Car WHERE Modele = ?';
        db.query(checkModelQuery, [Modele], (modelCheckError, modelCheckResults) => {
          if (modelCheckError) {
            console.error('Erreur lors de la vérification du modèle de voiture existant :', modelCheckError);
            return res.status(500).json({ error: 'Erreur interne du serveur.' });
          }

          if (modelCheckResults.length > 0) {
            return res.status(409).json({ error: 'Le modèle de voiture existe déjà.' });
          }

          const addCarQuery = 'INSERT INTO Car (Marque, Modele, Puissance, Description, LienImage) VALUES (?, ?, ?, ?, ?)';
          db.query(addCarQuery, [Marque, Modele, Puissance, fullDescription, LienImage], (addError, addResults) => {
            if (addError) {
              console.error('Erreur lors de l\'ajout de la voiture à la table Car :', addError);
              return res.status(500).json({ error: 'Erreur interne du serveur.' });
            }

            res.status(201).json({ message: 'Voiture ajoutée avec succès.' });
          });
        });
      } else {
        return res.status(404).json({ error: 'Nom d\'utilisateur non trouvé.' });
      }
    });
  });
});

app.post('/getuserinfo', (req, res) => {
  const uuid = req.body.uuid;

  if (!uuid) {
    return res.status(400).json({ error: 'L\'UUID est manquant dans la requête.' });
  }

  const getUserInfoQuery = 'SELECT identifiant, ProfilePictureURL, Bio, FavoriteCarModel FROM User WHERE uuid = ?';

  db.query(getUserInfoQuery, [uuid], (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération des informations utilisateur :', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Aucun utilisateur trouvé avec cet UUID.' });
    }

    const userInfo = results[0];
    res.json(userInfo);
  });
});


app.post('/searchusers', async (req, res) => {
  const searchQuery = req.body.searchQuery;

  if (searchQuery === '') {
    // Si la recherche est vide, affiche les profils de 15 utilisateurs aléatoires
    const getRandomUsersQuery = 'SELECT identifiant, Bio, FavoriteCarModel FROM User ORDER BY RAND() LIMIT 15';

    db.query(getRandomUsersQuery, (error, results) => {
      if (error) {
        console.error('Erreur lors de la recherche d\'utilisateurs aléatoires :', error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
      }

      res.json(results);
    });
  } else {
    // Si la recherche n'est pas vide, recherche les utilisateurs par identifiant
    const searchUsersQuery = 'SELECT identifiant, Bio, FavoriteCarModel FROM User WHERE identifiant LIKE ?';

    db.query(searchUsersQuery, [`%${searchQuery}%`], (error, results) => {
      if (error) {
        console.error('Erreur lors de la recherche d\'utilisateurs par identifiant :', error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
      }

      res.json(results);
    });
  }
});


app.get('/randomusers', (req, res) => {
  const getRandomUsersQuery = 'SELECT identifiant, Bio, FavoriteCarModel FROM User ORDER BY RAND() LIMIT 15';

  db.query(getRandomUsersQuery, (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération des utilisateurs au hasard :', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }

    res.json(results);
  });
});


// Route pour mettre à jour le nom de l'utilisateur
app.post('/nameUpdate', (req, res) => {
  updateProfileField(req, res, 'identifiant', 'varchar');
});

// Route pour mettre à jour la bio de l'utilisateur
app.post('/BioUpdate', (req, res) => {
  updateProfileField(req, res, 'Bio', 'text');
});

// Route pour mettre à jour l'URL de l'image du profil de l'utilisateur
app.post('/ProfilePicUpdate', (req, res) => {
  updateProfileField(req, res, 'ProfilePictureURL', 'varchar');
});

// Fonction générique pour mettre à jour un champ du profil
function updateProfileField(req, res, field, fieldType) {
  const uuid = req.body.uuid;
  const value = req.body.value;

  if (!uuid || !value) {
    return res.status(400).json({ error: 'Le uuid et la valeur sont requis dans la requête.' });
  }

  // Vérifie si le champ à mettre à jour est autorisé
  const allowedFields = ['identifiant', 'Bio', 'ProfilePictureURL'];
  if (!allowedFields.includes(field)) {
    return res.status(400).json({ error: 'Le champ spécifié n\'est pas autorisé.' });
  }

  // Construit la requête SQL dynamique
  const updateQuery = `UPDATE User SET ${field} = ? WHERE uuid = ?`;

  // Exécute la requête SQL
  db.query(updateQuery, [value, uuid], (error, results) => {
    if (error) {
      console.error(`Erreur lors de la mise à jour du champ ${field} dans la base de données :`, error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du champ du profil.' });
    }

    // Vérifie si l'utilisateur a été mis à jour avec succès
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Aucun utilisateur trouvé avec ce uuid.' });
    }

    // Répond avec un statut de succès
    res.json({ success: true });
    console.log(`Mise à jour du champ ${field} pour l'utilisateur avec uuid ${uuid}`);
  });
}

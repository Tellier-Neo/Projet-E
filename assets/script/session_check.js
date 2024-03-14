// Fonction pour récupérer le contenu du cookie par son nom
function getCookieValue(cookieName) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === cookieName) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

// Fonction pour effectuer la requête vers /get_userinfo avec le userUUID dans le cookie
async function getUserInfo() {
    const userUUID = getCookieValue('ProjetE_unique_user_token');

    // Vérifie la présence du userUUID dans les cookies
    if (userUUID) {
        try {
            const response = await fetch('http://192.168.64.242:3000/get_userinfo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userUUID }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Réponse du serveur (get_userinfo):', result);

                // Met à jour l'affichage en fonction de la réponse
                updateUI(result.username);
            } else {
                console.error('Erreur lors de la requête (get_userinfo):', response.statusText);
            }
        } catch (error) {
            console.error('Erreur lors de la requête (get_userinfo):', error.message);
        }
    } else {
        console.log('Pas de userUUID trouvé dans les cookies. La requête /get_userinfo ne sera pas effectuée.');
    }
}

// Fonction pour mettre à jour l'interface utilisateur en fonction du nom d'utilisateur
function updateUI(username) {
    const logButton = document.getElementById('logButton');
    const registerButton = document.getElementById('registerButton');
    const userNameDiv = document.getElementById('userName');
    const unlogButton = document.getElementById('Unlog');
    const memberpage = document.getElementById('memberpage');
    const header_bar2 = document.getElementById('header_bar2')

    // Vérifie la présence du username
    if (username) {
        // Cache les boutons de connexion et d'inscription
        logButton.style.display = 'none';
        registerButton.style.display = 'none';

        // Affiche le nom d'utilisateur et le bouton de déconnexion
        userNameDiv.textContent = "Connecté : " + username;
        userNameDiv.style.display = 'inline';
        unlogButton.style.display = 'inline';
        memberpage.style.display = 'grid';
        header_bar2.style.display = 'block';
    } else {
        // Affiche les boutons de connexion et d'inscription
        logButton.style.display = 'inline';
        registerButton.style.display = 'inline';

        // Cache le nom d'utilisateur et le bouton de déconnexion
        userNameDiv.style.display = 'none';
        unlogButton.style.display = 'none';
    }
}

// Exécute la fonction pour effectuer la requête (vous pouvez appeler cela au moment opportun, par exemple, lorsqu'une page se charge)
getUserInfo();

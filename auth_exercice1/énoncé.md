# Double password

Vous devez implémenter la sécurité d'un backend. Votre boss est un peu zozo et tient mordicus à avoir une sécurité à deux mots de passe.

Dans le code partiel fourni, vous devez authentifier le client dans `/login` avec ses deux mots de passe puis lui renvoyer un token JWT contenant son username et son role. Deux roles existent: "user" et "admin".

La seule route protégée est `/route`. Une fois la partie d'authentification faite, un token contenant le username et le role s'affichera à l'écran lors du GET de cette route, via Postman.

Pour compléter le travail, vous n'aurez donc qu'à compléter le code dans `/login`.

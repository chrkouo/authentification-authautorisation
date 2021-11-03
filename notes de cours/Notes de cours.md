# Authentification VS Authorization

Dans le contexte d'une API RESTfull, il est souhaitable de demander à un client de fournir son identité pour pouvoir se servir du système, lors de l'appel à une route.

Du côté de l'API, on doit trouver le moyen de:

- Empêcher l'accès aux routes protégées
- Permettre la délivrance de son identité au client par le serveur pour utilisation future avec les routes protégées

**Cela s'agit de l'`Authentification`**

Dans une application web complète (frontend, backend & database), on souhaite souvent seulement autoriser l'accès à certaines ressouces **si on connait le demandeur**. Par exemple, on ne veut pas afficher les informations d'un compte de banque à un utilisateur qui n'est pas encore authentifié.

On peut aussi vouloir définir ce à quoi a accès un utilisateur authentifié en fonction de son role ou de ses accès.

On doit donc trouver un moyen de:

- Laisser passer les requêtes en provenance d'un utilisateur authentifié sur des ressources auxquelles il a accès.
- Pouvoir faire **confiance** à cet utilisateur (**mot clé: confiance**)

**Cela s'agit de l'`Authorization`**

# Authentification

À sa plus simple expression, l'autheutification à un serveur se résume à envoyer un identifiant reconnu par le serveur dans le but de pouvoir accéder au reste du système. On peut bien sur agrémenter cet identifiant d'un mot de passe.

Une fois ces informations acheminées au serveur, celui-ci va:

- `Vérifier l'existence de l'utilisateur` décrit par les informations de connexion
- Mettre en place une mécanique d'authorization pour l'utilisateur, comme la `délivrance d'un token JWT`.

Dans le cas où l'utilisateur n'existe pas dans le système, le serveur renvoyera un `403-FORBIDDEN`

# Authorization

## Historique

Les premières itérations de la sécurité sur le web, sans parler de HTTP Basic, étaient sous forme de `sessions` que le serveur (unique) devait garder en mémoire lors de la visite de l'utilisateur sur l'application ou le système. Une fois l'utilisateur authentifié d'une manière quelconque, le serveur devait garder une trace de la présence de chaque utilisateur et même gérer une échéance (timeout) pour ces derniers.

### Sticky sessions et sessions persistantes

Cela fonctionne jusqu'à temps qu'on décide de grossir (ou "scaler") une application et d'y attribuer deux instances de serveur. L'évolution du dévellopement logiciel vient tout bousiller!

À ce moment-là, un balanceur de charge (load balancer) à la tête de ces serveurs pourrait envoyer les requêtes d'un même utilisateur vers plus d'un serveur. C'est problèmatique puisque seul un d'entre eux "connait" l'utilisateur étant donné que c'est seulement ce serveur qui l'a **authentifié**.

Pour palier à cela, on a vu:

- S'implémenter des "sticky sessions" au niveau du load-balancer, soit la reconnaissance et l'aiguillage du demandeur au niveau du load balanceur.
- Mettre la session dans la base de donnée, pour être accèssible à toutes instances de serveur.

Ces deux approches sont encore très utilisées et fonctionnent bien, mais vous comprenez qu'elles viennent avec leurs lourdeurs opérationnelles respectives, en plus d'ajouter de la logique à un balanceur de charge...

Il faut avoir une bonne raison pour vouloir faire la gestion d'une session dans le backend!

## Outil moderne: JWT tokens

Les tokens JWT [au standard libre](https://tools.ietf.org/html/rfc7519) sont un moyen efficace de délivrer de l'information à un client web pour re-soumission au backend plus tard **en gardant l'assurance que cette information n'a pas été modifiée ou forgée**. Il est aussi `auto-portant`, ce qui signifie qu'il comporte sa propre signature. Cela nous permet une flexibité très intéressante, ainsi que le luxe de ne pas avoir à s'en rapeller du côté du serveur.

Il porte la forme d'un objet JSON divisé en trois parties;

- Header
- Payload
- Signature

Ces parties sont séparées par des points ( . ) et encodées individuellement. L'encodage est faite en Base64Url.

Un token aura donc cette forme:

`xxxxx.yyyyy.zzzzz`

**Important**: Garder en tête que c'est le serveur qui délivre ce token. C'est donc le serveur qui décide ce qui si trouve comme information!

### Encodage des parties

Vous verrez plus bas que le **header** et le **payload** sont encodés en base64URL. Ce n'est qu'un encodeur très simple qui change n'importe quelle chaine de charactère par une autre, qui celle-ci, est en mesure d'être envoyé via HTTP sans problèmes de reconnaissance de symboles.

Voyez vous-même comment vous pouvez [encoder](https://simplycalc.com/base64-encode.php) et [décoder](https://simplycalc.com/base64-decode.php) un token (ou n'importe quelle information).

### Header

Le header comporte en temps normal deux informations, soit le type (JWT) et le nom de la fonction de hachage (hashing function). Typiquement, on aura donc:

```javascript
{
  "alg": "HS256",
  "typ": "JWT"
}
```

Cet objet JSON est encodé en Base64Url pour former la première partie du token. Voir plus haut dans la section encodage.

### Payload

Le Payload est la partie qui nous intéresse le plus. Elle contient les réclamations, les `claims` portant sur l'entité dont il est question. Dans notre cas, il s'agit de l'utilisateur.

Trois types de claims existent dans le standard:

- Registered ([documentation](https://tools.ietf.org/html/rfc7519#section-4.1))
  - "iss" Issuer
  - "sub" Subject
  - "exp" Expiration Time
  - etc.
- Public
  - Que vous définissez selon vos besoin. Cependant, il est recommandé pour ce type de _claim_ de suivre [les noms de claims courants](https://www.iana.org/assignments/jwt/jwt.xhtml)
- Private
  - Autres claims que vous définissez vous même pour la communication client-serveur.

Cette partie ressemblera donc à un autre objet JSON simple:

```javascript
{
  "sub": "86",
  "name": "Xavier Huppe",
  "admin": true,
  "niveauMagique": 9000
}
```

Cet objet JSON est encodé en Base64Url pour former la deuxième partie du token. Voir plus haut dans la section encodage.

### Signature

Pour former la signature, on a besoin de:

- Le `header` encodé
- Le `payload` encodé
- La `fonction` de hachage spécifié dans le header, qui sera HMACSHA256 pour nous
- Un `secret`, que seul le serveur possède, qui porte aussi le nom de "salt"

On pourra ensuite faire la création de la signature, ou `signer` notre token comme suit:

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

[Vous pouvez en faire l'essaie en ligne](https://www.freeformatter.com/hmac-generator.html).

### Le token final

Ici, `token` défini le header + payload + signature. Bien que la signature fasse partie du token, elle n'est qu'utile pour le serveur. Pour le client, les parties utiles du token ne se résument qu'au header + payload.

En mettant la signature avec le `HEADER.PAYLOAD` encodé, nous obtenons une chaine de caractères ayant trois parties séparées par des points, soit le token:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.bgGd720CeHP4kY9mGuMEoteBq4TP4d0W2XkpiI4bVgg
```

Vous pouvez [jouer avec](https://jwt.io/#debugger-io) !

## Sécurité

Les tokens JWT ont quelques avantages évidents:

- Le client peut décoder le token pour voir son contenu et ses rôles
- La modification du token par le client est impossible
  - Si le client le modifie (pour se donner admin par exemple), la signature ne concordera plus au token.
  - Le client ne peut pas changer la signature pour concordre au token, car il n'a pas le secret!
- La fabrication d'un token (forger un token) est aussi impossible, pour les même raisons.
- **Si le token fourni par le client concorde avec la signature en fonction du secret, nous pouvons y faire confiance**. Ce qui veut dire qu'une fois le token délivré par le serveur, ce dernier n'a pas à en garder une trace. C'est donc state-less, ce qui est complètement fantastique!

# Authentification et Authorization en javascript

## Authentification

La première étape est de faire une route, `/login` non sécurisée, qui permettra la réception des informations de connexion. Commencons par utiliser seulement un _username_ pour se connecter;

```javascript
import express from "express";

const app = express();
app.use(express.json());

const users = ["xavier", "marco", "noemie", "luc", "ridha", "gilles"];

  app.post("/login", (req, res) => {
    const username = req.body.username;
  }
});

app.listen(3000);
```

Ensuite, on veux vérifier la présence de cet utilisateur dans la base de données (ici simulée en mémoire);

```javascript
import express from "express";

const app = express();
app.use(express.json());

const users = ["xavier", "marco", "noemie", "luc", "ridha", "gilles"];

app.post("/login", (req, res) => {
  const username = req.body.username;
  // Vérification de l'existence du user dans la BD
  if (!users.includes(username)) {
    res.sendStatus(403);
  }
});

app.listen(3000);
```

Nous sommes rendu à donner à l'utilisateur une `autorité`, soit un token JWT qu'il pourra utiliser pour avoir accès aux différentes routes. Pour ce faire nous pouvons utiliser la librairie `jsonwebtoken`. Après installation de **ce module npm** et son importation, nous pouvons créer un payload avec **le contenu de notre choix**.

jwt (jsonwebtoken), prend deux arguments;

- Le payload
- le secret (ne pas utiliser "secret" comme secret, ce n'est pas un très bon secret...)

voir le [package npm jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) pour plus d'info.

```javascript
import express from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const users = ["xavier", "marco", "noemie", "luc", "ridha", "gilles"];

app.post("/login", (req, res) => {
  const username = req.body.username;
  // Vérification de l'existence du user dans la BD
  if (!users.includes(username)) {
    res.sendStatus(403);
  }

  const token = jwt.sign({ username }, "secret");
  res.send(token);
});

app.listen(3000);
```

On pourrait décider de mettre à peu près ce qu'on veut dans le payload, selon nos besoins;

```javascript
const payload = {
  username,
  admin: true,
  roles: ["manager", "employe", "bigBoss"],
  identity: "supporter",
};

const token = jwt.sign(payload, "secret");
```

## Authorization

On veut maintenant protéger nos routes selon les accès présent dans le token (et la présence du token). Nous allons faire appel à un [middleware](https://expressjs.com/en/guide/using-middleware.html). C'est un outil très puissant qui permet d'intercepter une requête et la manipuler avant de l'envoyer à la route qui se sert du dit middleware. (Votre bodyparser est un middleware!)

Voici un middleware d'authentification qui vérifie la présence du `HEADER AUTHORIZATION`, son authenticité en comparant sa signature à notre secret et qui ajoute à la requête le contenu du token d'accès avant de laisser continuer vers la route demandée.

```javascript
// Notre middleware d'authentification
const authenticate = async (req, res, next) => {
  // On ramasse le header d'authorization
  const authHeader = req.headers["authorization"];
  // On obtient le token à partir du header en enlevant le mot "BEARER"
  const token = authHeader && authHeader.split(" ")[1];
  // Si aucun token -> unauthorized
  if (token == null) return res.sendStatus(401);

  try {
    // Vérification du token selon notre secret
    const payload = await jwt.verify(token, "secret");
    // Injection du token dans la requête pour demandeur
    req.userToken = payload;
    // Passage au prochain middleware ou la route demandée
    next();
  } catch (e) {
    // Vérification échouée -> forbidden
    return res.sendStatus(403);
  }
};

app.get("/cars", authenticate, (req, res) => {
  // Route protégé par le middleware authenticate
  // Nous avons accès au token et son contenu!
  console.log(req.userToken);
  res.send(["ford", "mazda", "toyota"]);
});
```

Pour envoyer une token obtenu lors du login dans Postman, on doit définir un Header `Authorization` égale à `BEARER {token}`:

![header auth](./images/authorizationHeader.png)

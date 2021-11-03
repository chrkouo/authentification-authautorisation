import express from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const users = [
  {
    username: "xavier",
    role: "user",
    password1: "ab",
    password2: "cd",
  },
  {
    username: "marco",
    role: "admin",
    password1: "ef",
    password2: "gh",
  },
];

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password1 = req.body.password1;
  const password2 = req.body.password2;

  if (!users.map((x) => x.username).includes(username)) {
    return res.sendStatus(403);
  }

  const knownUser = users.filter((x) => x.username == username)[0];

  // Vérifier que les mots de passe sont exact pour le user en cours de login, sinon, envoyer un 401 UNAUTHORIZED
  // ...
  if (
    users
      .map((x) => x.password1 == password1 && x.password2 == password2)
      .every((x) => x == false)
  )
    res.sendStatus(403);
  const role = knownUser.role;
  const userToken = { username, role };
  const token = jwt.sign(userToken, "secret");
  res.send(token);

  // Récupérer son role, créer un token JWT contenant le username et le role puis l'envoyer via res.send(token)
  // ...

  res.send(token);
});

const authenticate = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  try {
    const payload = await jwt.verify(token, "secret");
    req.userToken = payload;
    next();
  } catch (e) {
    return res.sendStatus(403);
  }
};

app.get("/route", authenticate, (req, res) => {
  console.log(req.userToken);
  // Vous devriez voir à l'écran le token avec le username et le role du user connecté
  // res.send(req.body.username);
  // res.send(req.body.role);
  res.sendStatus(200);
});

app.listen(3000);

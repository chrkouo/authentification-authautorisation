import express from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const users = [
  { username: "xavier", password: "123" },
  { username: "marco", password: "456" },
  { username: "noemie", password: "789" },
  { username: "luc", password: "024" },
  { username: "ridha", password: "691" },
  { username: "gilles", password: "357" },
];

app.post("/login", (req, res) => {
  const username = req.body.username;
  const pass = req.body.password;
  // Vérification de l'existence du user dans la BD
  if (
    users
      .map((x) => x.username == username && x.password == pass)
      .every((x) => x == false)
  )
    res.sendStatus(403);

  const token = jwt.sign({ username }, "secret");
  res.send(token);
});

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
  res.send(["ford", "mazda", "toyota", "subaru"]);
});

app.listen(3000);

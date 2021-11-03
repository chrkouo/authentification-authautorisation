import express from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const classes = ["Marauder", "Templar", "Witch"];

const moveset = {
  Marauder: ["leap slam", "heavy strike", "warlord cry"],
  Templar: ["lightning bolt", "hammerstomp", "Tempest aura"],
  Witch: ["firestorm", "cracking lance", "raise zombie"],
};

app.post("/login", (req, res) => {
  const identite = req.body.class;
  if (!classes.includes(identite)) {
    return res.sendStatus(403);
  }
  //const userToken = moveset[identite];
  const token = jwt.sign({ identite }, "secret");
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

app.get("/spells", authenticate, (req, res) => {
  console.log(req.userToken);
  res.send(moveset[req.body.class]);
  res.sendStatus(200);
});

app.listen(3000);

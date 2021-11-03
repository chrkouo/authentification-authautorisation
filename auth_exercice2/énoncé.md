# Magie et épée

Vous devez implémenter la sécurité d'un backend. Trois identités sont possiblement passées dans le body lors de l'authentification;

```javascript
{
  class: "Marauder"
}
{
  class: "Templar"
}
{
  class: "Witch"
}
```

Dans le code partiel fourni, vous devez authentifier le client dans `/login` avec son identité puis lui retourner un token JWT contenant cette identité.

La seule route protégée est `/spells`. Une fois la partie d'authentification faite, On souhaite que de toucher la route retourne uniquement les _spells_ que peut utiliser la classe qui s'est authentifiée.

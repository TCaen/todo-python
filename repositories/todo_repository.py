import json
from models import Todo

TODOS_FILE = "todos.json"


class TodoRepository:
    """
    Responsable uniquement de la persistence des tâches dans le fichier JSON.

    Rôle dans l'architecture :
        Controller → Repository → todos.json

    Le controller contient la logique métier (validation, règles).
    Le repository ne fait que lire et écrire — il ne sait pas ce qu'est
    une "priorité valide" ou un "état autorisé", c'est l'affaire du controller.
    """

    def load(self):
        """
        Lit todos.json et retourne la liste des tâches sous forme d'objets Todo.
        Retourne une liste vide si le fichier est absent ou corrompu.

        Retourne :
            list[Todo]
        """
        try:
            with open(TODOS_FILE, "r") as f:
                data = json.load(f).get("todos", [])
                return [Todo.from_dict(t) for t in data]
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def save(self, todos):
        """
        Sérialise et écrit la liste complète des tâches dans todos.json.

        Paramètres :
            todos (list[Todo]) : liste à persister
        """
        with open(TODOS_FILE, "w") as f:
            json.dump({"todos": [t.to_dict() for t in todos]}, f, indent=2)

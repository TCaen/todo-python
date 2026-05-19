import json
from datetime import datetime, timezone
from models import Todo

# Chemin vers le fichier JSON utilisé comme base de données
TODOS_FILE = "todos.json"


class TodoController:
    """
    Contrôleur responsable de toute la logique métier liée aux tâches.

    Rôle dans l'architecture MVC :
        - Model (models/todo.py)      : structure des données
        - Controller (ce fichier)     : logique métier, lecture/écriture, validation
        - View (app.py + templates/)  : exposition HTTP et rendu HTML

    app.py n'a plus qu'à instancier ce contrôleur et déléguer :
        controller = TodoController()
        todos = controller.get_all(category="Travail")

    Toutes les méthodes retournent soit des objets Todo, soit lèvent une
    ValueError (données invalides) ou une KeyError (id introuvable) que
    app.py transforme en réponses HTTP adaptées (400, 404...).
    """

    # -------------------------------------------------------------------------
    # Couche d'accès aux données (privée — utilisée uniquement en interne)
    # -------------------------------------------------------------------------

    def _load(self):
        """
        Lit todos.json et retourne la liste des tâches sous forme d'objets Todo.

        Méthode privée (préfixe _) : elle n'est appelée que par les autres
        méthodes de ce contrôleur, jamais depuis l'extérieur.

        Retourne :
            list[Todo] : liste des tâches, vide si le fichier est absent ou corrompu
        """
        try:
            with open(TODOS_FILE, "r") as f:
                data = json.load(f).get("todos", [])
                return [Todo.from_dict(t) for t in data]
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def _save(self, todos):
        """
        Sérialise et écrit la liste de tâches dans todos.json.

        Méthode privée : appelée en fin de chaque opération d'écriture
        (create, update, delete) pour persister l'état courant.

        Paramètres :
            todos (list[Todo]) : la liste complète à sauvegarder
        """
        with open(TODOS_FILE, "w") as f:
            json.dump({"todos": [t.to_dict() for t in todos]}, f, indent=2)

    # -------------------------------------------------------------------------
    # Opérations de lecture
    # -------------------------------------------------------------------------

    def get_all(self, category=None, state=None):
        """
        Retourne toutes les tâches, avec filtres optionnels.

        Les filtres sont cumulables : on peut filtrer par catégorie ET par état
        en même temps. Une valeur None ou "all" signifie "pas de filtre".

        Paramètres :
            category (str|None) : filtre par catégorie (ex: "Travail")
            state    (str|None) : filtre par état ("todo", "done", "forgot")

        Retourne :
            list[Todo] : tâches correspondant aux critères
        """
        todos = self._load()

        if category and category != "all":
            todos = [t for t in todos if t.category == category]

        if state and state != "all":
            todos = [t for t in todos if t.state == state]

        return todos

    def get_by_id(self, todo_id):
        """
        Retourne une tâche par son identifiant unique.

        Paramètres :
            todo_id (str) : l'UUID de la tâche recherchée

        Retourne :
            Todo : la tâche trouvée

        Lève :
            KeyError : si aucune tâche ne correspond à cet id
        """
        todos = self._load()
        for todo in todos:
            if todo.id == todo_id:
                return todo
        raise KeyError(f"Tâche introuvable : {todo_id}")

    def get_categories(self):
        """
        Retourne la liste triée et dédoublonnée de toutes les catégories existantes.

        Utilisée pour alimenter les boutons de filtre dans l'interface.

        Retourne :
            list[str] : catégories triées alphabétiquement
        """
        todos = self._load()
        return sorted({t.category for t in todos if t.category})

    # -------------------------------------------------------------------------
    # Opérations d'écriture
    # -------------------------------------------------------------------------

    def create(self, title, description="", priority="secondaire", category=None):
        """
        Crée une nouvelle tâche et la persiste.

        Validation :
            - Le titre ne peut pas être vide
            - La priorité doit être dans Todo.PRIORITIES

        Paramètres :
            title       (str)      : intitulé de la tâche (obligatoire)
            description (str)      : description courte (défaut : "")
            priority    (str)      : niveau de priorité (défaut : "secondaire")
            category    (str|None) : catégorie libre (défaut : None)

        Retourne :
            Todo : la tâche nouvellement créée (avec son id et ses timestamps)

        Lève :
            ValueError : si le titre est vide ou la priorité invalide
        """
        title = title.strip()
        if not title:
            raise ValueError("Le titre est obligatoire")

        if priority not in Todo.PRIORITIES:
            raise ValueError(f"Priorité invalide. Valeurs acceptées : {Todo.PRIORITIES}")

        todo = Todo(
            title=title,
            description=description.strip(),
            priority=priority,
            category=category.strip() if category else None,
        )

        todos = self._load()
        todos.append(todo)
        self._save(todos)
        return todo

    def update(self, todo_id, title=None, description=None, priority=None,
               category=None, state=None):
        """
        Met à jour un ou plusieurs champs d'une tâche existante.

        Seuls les paramètres explicitement passés (différents de None) sont modifiés.
        Les autres champs restent inchangés — c'est une mise à jour partielle.

        Cela permet d'appeler update() avec uniquement ce qui change :
            controller.update(id, state="done")          # change seulement l'état
            controller.update(id, title="Nouveau titre") # change seulement le titre
            controller.update(id, priority="urgent", category="Urgences")  # plusieurs champs

        Validation :
            - state doit être dans Todo.STATES si fourni
            - priority doit être dans Todo.PRIORITIES si fournie
            - title ne peut pas devenir une chaîne vide

        Paramètres :
            todo_id     (str)      : UUID de la tâche à modifier
            title       (str|None) : nouveau titre
            description (str|None) : nouvelle description
            priority    (str|None) : nouvelle priorité
            category    (str|None) : nouvelle catégorie (chaîne vide = supprime la catégorie)
            state       (str|None) : nouvel état

        Retourne :
            Todo : la tâche mise à jour

        Lève :
            ValueError : si state ou priority est invalide, ou si le titre devient vide
            KeyError   : si l'id ne correspond à aucune tâche
        """
        if state is not None and state not in Todo.STATES:
            raise ValueError(f"État invalide. Valeurs acceptées : {Todo.STATES}")

        if priority is not None and priority not in Todo.PRIORITIES:
            raise ValueError(f"Priorité invalide. Valeurs acceptées : {Todo.PRIORITIES}")

        if title is not None and not title.strip():
            raise ValueError("Le titre ne peut pas être vide")

        todos = self._load()
        for todo in todos:
            if todo.id == todo_id:
                if title is not None:
                    todo.title = title.strip()
                if description is not None:
                    todo.description = description.strip()
                if priority is not None:
                    todo.priority = priority
                if category is not None:
                    todo.category = category.strip() or None
                if state is not None:
                    todo.state = state
                todo.updated_at = datetime.now(timezone.utc).isoformat()
                self._save(todos)
                return todo

        raise KeyError(f"Tâche introuvable : {todo_id}")

    def delete(self, todo_id):
        """
        Supprime définitivement une tâche par son id.

        On reconstruit la liste sans la tâche ciblée. Si la longueur n'a pas
        changé, la tâche n'existait pas.

        Paramètres :
            todo_id (str) : UUID de la tâche à supprimer

        Lève :
            KeyError : si l'id ne correspond à aucune tâche
        """
        todos = self._load()
        updated = [t for t in todos if t.id != todo_id]

        if len(updated) == len(todos):
            raise KeyError(f"Tâche introuvable : {todo_id}")

        self._save(updated)

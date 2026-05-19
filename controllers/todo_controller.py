from datetime import datetime, timezone
from models import Todo
from repositories import TodoRepository


class TodoController:
    """
    Logique métier des tâches : validation, création, modification, suppression.

    Ne sait pas comment les données sont stockées — c'est le rôle du repository.
    Ne sait pas comment les données sont exposées — c'est le rôle de app.py.
    """

    def __init__(self):
        self.repo = TodoRepository()

    # -------------------------------------------------------------------------
    # Lecture
    # -------------------------------------------------------------------------

    def get_all(self, category=None, state=None):
        """
        Retourne toutes les tâches, avec filtres optionnels cumulables.
        Une valeur None ou "all" signifie "pas de filtre".
        """
        todos = self.repo.load()

        if category and category != "all":
            todos = [t for t in todos if t.category == category]

        if state and state != "all":
            todos = [t for t in todos if t.state == state]

        return todos

    def get_by_id(self, todo_id):
        """
        Retourne une tâche par son id.

        Lève :
            KeyError si l'id ne correspond à aucune tâche
        """
        for todo in self.repo.load():
            if todo.id == todo_id:
                return todo
        raise KeyError(f"Tâche introuvable : {todo_id}")

    def get_categories(self):
        """Retourne la liste triée et dédoublonnée des catégories existantes."""
        return sorted({t.category for t in self.repo.load() if t.category})

    # -------------------------------------------------------------------------
    # Écriture
    # -------------------------------------------------------------------------

    def create(self, title, description="", priority="secondaire", category=None):
        """
        Valide et crée une nouvelle tâche.

        Lève :
            ValueError si le titre est vide ou la priorité invalide
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

        todos = self.repo.load()
        todos.append(todo)
        self.repo.save(todos)
        return todo

    def update(self, todo_id, title=None, description=None, priority=None,
               category=None, state=None):
        """
        Met à jour les champs fournis d'une tâche existante (mise à jour partielle).
        Seuls les paramètres différents de None sont appliqués.

        Lève :
            ValueError si state ou priority est invalide, ou si le titre devient vide
            KeyError   si l'id ne correspond à aucune tâche
        """
        if state is not None and state not in Todo.STATES:
            raise ValueError(f"État invalide. Valeurs acceptées : {Todo.STATES}")
        if priority is not None and priority not in Todo.PRIORITIES:
            raise ValueError(f"Priorité invalide. Valeurs acceptées : {Todo.PRIORITIES}")
        if title is not None and not title.strip():
            raise ValueError("Le titre ne peut pas être vide")

        todos = self.repo.load()
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
                self.repo.save(todos)
                return todo

        raise KeyError(f"Tâche introuvable : {todo_id}")

    def delete(self, todo_id):
        """
        Supprime définitivement une tâche.

        Lève :
            KeyError si l'id ne correspond à aucune tâche
        """
        todos = self.repo.load()
        updated = [t for t in todos if t.id != todo_id]

        if len(updated) == len(todos):
            raise KeyError(f"Tâche introuvable : {todo_id}")

        self.repo.save(updated)

import uuid
from datetime import datetime, timezone


class Todo:
    """
    Représente une tâche dans l'application.

    Propriétés :
        id          (str)      : identifiant unique (UUID), généré automatiquement
        title       (str)      : intitulé de la tâche (obligatoire)
        description (str)      : description courte optionnelle (défaut : chaîne vide)
        state       (str)      : état de la tâche — voir STATES
        priority    (str)      : niveau de priorité — voir PRIORITIES
        category    (str|None) : catégorie libre (ex: "Travail"), None si absente
        created_at  (str)      : date de création ISO 8601 (UTC)
        updated_at  (str)      : date de dernière modification ISO 8601 (UTC)

    Valeurs autorisées pour state :
        "todo"    → tâche à faire (état initial)
        "done"    → tâche terminée
        "forgot"  → tâche oubliée / abandonnée

    Valeurs autorisées pour priority :
        "urgent"      → à traiter immédiatement
        "important"   → à traiter prochainement
        "secondaire"  → peut attendre (défaut)
    """

    STATES = ("todo", "done", "forgot")
    PRIORITIES = ("urgent", "important", "secondaire")

    def __init__(self, title, description="", priority="secondaire",
                 category=None, state="todo", id=None,
                 created_at=None, updated_at=None):
        """
        Crée une nouvelle instance de Todo.

        Les paramètres id, created_at et updated_at sont optionnels :
        - à la création : on les génère automatiquement
        - au chargement depuis le JSON (via from_dict) : on restaure les valeurs existantes
        """
        now = datetime.now(timezone.utc).isoformat()
        self.id = id or str(uuid.uuid4())
        self.title = title
        self.description = description
        self.state = state
        self.priority = priority
        self.category = category
        self.created_at = created_at or now
        self.updated_at = updated_at or now

    def to_dict(self):
        """
        Convertit la tâche en dictionnaire sérialisable en JSON.

        Utilisé avant chaque écriture fichier et avant chaque réponse HTTP
        (jsonify() ne sait pas sérialiser un objet Python personnalisé).

        Retourne :
            dict : toutes les propriétés de la tâche
        """
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "state": self.state,
            "priority": self.priority,
            "category": self.category,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data):
        """
        Reconstruit un objet Todo depuis un dictionnaire lu dans le JSON.

        Méthode inverse de to_dict(). Appelée dans load_todos() pour
        transformer chaque entrée JSON en objet Todo manipulable.

        Les .get() avec valeurs par défaut permettent de rester compatible
        avec d'anciens fichiers JSON qui manqueraient certains champs.

        Paramètres :
            data (dict) : une entrée lue depuis todos.json

        Retourne :
            Todo : l'objet reconstitué
        """
        return cls(
            id=data["id"],
            title=data["title"],
            description=data.get("description", ""),
            state=data.get("state", "todo"),
            priority=data.get("priority", "secondaire"),
            category=data.get("category"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )

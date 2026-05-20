# Todo App

Application de gestion de tâches avec tableau Kanban, construite avec Flask.

## Lancer le serveur

```bash
# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
python3 app.py
```

L'app est disponible sur **http://localhost:5000**

## Structure du projet

```
todo-python/
├── app.py                  # Routes Flask + point d'entrée
├── controllers/
│   └── todo_controller.py  # Logique métier (validation, CRUD)
├── models/
│   └── todo.py             # Modèle Todo
├── repositories/
│   └── todo_repository.py  # Lecture / écriture du fichier JSON
├── static/
│   ├── css/style.css
│   └── js/                 # Frontend (api.js, app.js, column.js...)
├── templates/
│   ├── index.html          # Tableau Kanban
│   └── new_todo.html       # Formulaire de création
└── todos.json              # Base de données (fichier plat)
```

## API

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/todos` | Liste toutes les tâches |
| GET | `/api/todos?state=todo` | Filtre par état |
| GET | `/api/todos?category=Travail` | Filtre par catégorie |
| POST | `/api/todos` | Crée une tâche |
| PUT | `/api/todos/<id>` | Met à jour une tâche |
| DELETE | `/api/todos/<id>` | Supprime une tâche |
| GET | `/api/categories` | Liste les catégories |

### Valeurs acceptées

**state** : `todo` · `done` · `forgot`

**priority** : `urgent` · `important` · `secondaire`

### Exemple de payload POST/PUT

```json
{
  "title": "Ma tâche",
  "description": "Description optionnelle",
  "priority": "important",
  "category": "Travail"
}
```

## Dépendances

- Python 3.x
- Flask 3.0.0

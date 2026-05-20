// =============================================================================
// column.js — Classe Column pour le tableau Kanban
//
// Chaque instance représente une colonne (À faire / Terminé / Oublié).
// Elle est responsable de son propre rendu et de la logique drag & drop.
// app.js crée 3 instances et gère les appels API via des callbacks.
// =============================================================================

const PRIORITY_LABELS = {
  urgent:     "Urgent",
  important:  "Important",
  secondaire: "Secondaire",
};

export class Column {
  /**
   * @param {string}   state   - état correspondant : "todo", "done", "forgot"
   * @param {string}   label   - titre affiché en en-tête de colonne
   * @param {function} onDrop  - callback(todoId, sourceState, targetState)
   *                            appelé quand une carte est déposée dans cette colonne
   */
  constructor(state, label, onDrop) {
    this.state  = state;
    this.label  = label;
    this.todos  = [];
    this.onDrop = onDrop;
  }

  addTodo(todo) {
    this.todos.push(todo);
  }

  removeTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
  }

  // ---------------------------------------------------------------------------
  // RENDU
  // ---------------------------------------------------------------------------

  /**
   * Construit et retourne l'élément DOM complet de la colonne :
   * en-tête (label + compteur) + zone de dépôt contenant toutes les cartes.
   */
  render() {
    const col = document.createElement("div");
    col.className = "kanban-column";
    col.dataset.state = this.state;

    col.appendChild(this._renderHeader());
    col.appendChild(this._renderDropZone());
    return col;
  }

  _renderHeader() {
    const header = document.createElement("div");
    header.className = "kanban-column-header";

    const title = document.createElement("h2");
    title.textContent = this.label;

    // Badge avec le nombre de cartes dans la colonne
    const count = document.createElement("span");
    count.className = "kanban-column-count";
    count.textContent = this.todos.length;

    header.appendChild(title);
    header.appendChild(count);
    return header;
  }

  _renderDropZone() {
    const zone = document.createElement("div");
    zone.className = "kanban-drop-zone";

    // dragover : autorise le dépôt + feedback visuel
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("drag-over");
    });

    // dragleave : on vérifie qu'on quitte vraiment la zone et pas un enfant
    // (le dragleave se déclenche aussi quand on survole une carte à l'intérieur)
    zone.addEventListener("dragleave", (e) => {
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove("drag-over");
      }
    });

    // drop : récupère l'id et l'état source, appelle le callback si la colonne a changé
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drag-over");
      const todoId     = e.dataTransfer.getData("todoId");
      const sourceState = e.dataTransfer.getData("sourceState");
      if (sourceState !== this.state) {
        this.onDrop(todoId, sourceState, this.state);
      }
    });

    this.todos.forEach(todo => zone.appendChild(this.renderCard(todo)));
    return zone;
  }

  /**
   * Construit et retourne l'élément DOM d'une carte.
   *
   * Structure :
   *   ┌──────────────────────────────┐
   *   │ [URGENT]            ✏️  ×   │  ← card-header
   *   │ Titre de la tâche            │  ← card-title
   *   │ Description courte           │  ← card-description (si présente)
   *   │ [Catégorie]                  │  ← todo-category (si présente)
   *   └──────────────────────────────┘
   *
   * La carte est draggable : au dragstart on stocke l'id et l'état source
   * dans dataTransfer pour que la zone de dépôt sache quoi faire.
   *
   * @param {object} todo - la tâche à afficher
   */
  renderCard(todo) {
    const card = document.createElement("div");
    card.className = `kanban-card priority-${todo.priority}`;
    card.dataset.id = todo.id;
    card.draggable = true;

    // -- Drag events --
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("todoId", todo.id);
      e.dataTransfer.setData("sourceState", this.state);
      // setTimeout 0 : laisse le navigateur générer le ghost avant d'appliquer l'opacité
      setTimeout(() => card.classList.add("dragging"), 0);
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });

    // -- En-tête de carte : badge priorité + boutons éditer/supprimer --
    const cardHeader = document.createElement("div");
    cardHeader.className = "card-header";

    const priorityBadge = document.createElement("span");
    priorityBadge.className = `priority-badge ${todo.priority}`;
    priorityBadge.textContent = PRIORITY_LABELS[todo.priority];

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "✏️";
    editBtn.title = "Modifier";
    editBtn.dataset.action = "edit";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.title = "Supprimer";
    deleteBtn.dataset.action = "delete";

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    cardHeader.appendChild(priorityBadge);
    cardHeader.appendChild(actions);

    // -- Corps de la carte --
    const cardTitle = document.createElement("p");
    cardTitle.className = "card-title";
    cardTitle.textContent = todo.title;

    card.appendChild(cardHeader);
    card.appendChild(cardTitle);

    if (todo.description) {
      const desc = document.createElement("p");
      desc.className = "card-description";
      desc.textContent = todo.description;
      card.appendChild(desc);
    }

    if (todo.category) {
      const catBadge = document.createElement("span");
      catBadge.className = "todo-category";
      catBadge.textContent = todo.category;
      card.appendChild(catBadge);
    }

    return card;
  }
}

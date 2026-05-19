// =============================================================================
// app.js — Rendu du tableau Kanban et gestion des événements
// =============================================================================

import { fetchTodos, fetchCategories, updateTodo, deleteTodo } from "./api.js";
import { Column } from "./column.js";

let currentFilter = "all";

// Définition des 3 colonnes — dans l'ordre d'affichage
const COLUMN_DEFS = [
  { state: "todo",   label: "À faire" },
  { state: "done",   label: "Terminé" },
  { state: "forgot", label: "Oublié"  },
];

const PRIORITY_LABELS = {
  urgent:     "Urgent",
  important:  "Important",
  secondaire: "Secondaire",
};


// =============================================================================
// RENDU
// =============================================================================

/**
 * Construit le tableau Kanban : crée 3 instances de Column,
 * dispatche chaque tâche dans la colonne correspondant à son state,
 * puis rend chaque colonne dans #kanban-board.
 */
function renderBoard(todos) {
  const board = document.getElementById("kanban-board");
  board.innerHTML = "";

  const columns = COLUMN_DEFS.map(
    def => new Column(def.state, def.label, handleDrop)
  );

  // Chaque tâche rejoint la colonne dont le state correspond au sien
  todos.forEach(todo => {
    const col = columns.find(c => c.state === todo.state);
    if (col) col.addTodo(todo);
  });

  columns.forEach(col => board.appendChild(col.render()));
}

function renderCategories(categories) {
  const container = document.getElementById("category-filters");
  const allBtn = container.querySelector('[data-category="all"]');
  container.innerHTML = "";
  container.appendChild(allBtn);

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (currentFilter === cat ? " active" : "");
    btn.dataset.category = cat;
    btn.textContent = cat;
    container.appendChild(btn);
  });

  allBtn.className = "filter-btn" + (currentFilter === "all" ? " active" : "");
}

/**
 * Remplace le contenu d'une carte par un formulaire d'édition inline.
 * Enregistrer → appel API + refresh. Annuler → refresh sans sauvegarder.
 *
 * @param {object}      todo - données actuelles de la tâche
 * @param {HTMLElement} card - la carte à transformer
 */
function renderEditForm(todo, card) {
  card.draggable = false; // désactive le drag pendant l'édition
  card.innerHTML = "";
  card.classList.add("editing");

  const form = document.createElement("div");
  form.className = "edit-form";

  const inputTitle = document.createElement("input");
  inputTitle.type = "text";
  inputTitle.value = todo.title;
  inputTitle.placeholder = "Titre";

  const inputDesc = document.createElement("input");
  inputDesc.type = "text";
  inputDesc.value = todo.description || "";
  inputDesc.placeholder = "Description";

  const row = document.createElement("div");
  row.className = "edit-form-row";

  const selectPriority = document.createElement("select");
  Object.entries(PRIORITY_LABELS).forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    opt.selected = value === todo.priority;
    selectPriority.appendChild(opt);
  });

  const inputCategory = document.createElement("input");
  inputCategory.type = "text";
  inputCategory.value = todo.category || "";
  inputCategory.placeholder = "Catégorie";

  row.appendChild(selectPriority);
  row.appendChild(inputCategory);

  const actions = document.createElement("div");
  actions.className = "edit-form-actions";

  const btnSave = document.createElement("button");
  btnSave.className = "btn-save";
  btnSave.textContent = "Enregistrer";

  const btnCancel = document.createElement("button");
  btnCancel.className = "btn-cancel";
  btnCancel.textContent = "Annuler";

  btnSave.addEventListener("click", async () => {
    const newTitle = inputTitle.value.trim();
    if (!newTitle) { inputTitle.focus(); return; }
    await updateTodo(todo.id, {
      title:       newTitle,
      description: inputDesc.value.trim(),
      priority:    selectPriority.value,
      category:    inputCategory.value.trim(),
    });
    await refresh();
  });

  btnCancel.addEventListener("click", () => refresh());

  actions.appendChild(btnSave);
  actions.appendChild(btnCancel);

  form.appendChild(inputTitle);
  form.appendChild(inputDesc);
  form.appendChild(row);
  form.appendChild(actions);
  card.appendChild(form);
  inputTitle.focus();
}

async function refresh() {
  const [todos, categories] = await Promise.all([
    fetchTodos(currentFilter),
    fetchCategories(),
  ]);
  renderBoard(todos);
  renderCategories(categories);
}


// =============================================================================
// CALLBACKS & ÉVÉNEMENTS
// =============================================================================

/**
 * Appelé par Column quand une carte est déposée dans une nouvelle colonne.
 * Met à jour le state côté serveur (→ todos.json) puis rafraîchit le board.
 *
 * @param {string} todoId      - UUID de la tâche déplacée
 * @param {string} sourceState - colonne d'origine
 * @param {string} targetState - colonne de destination
 */
async function handleDrop(todoId, _sourceState, targetState) {
  await updateTodo(todoId, { state: targetState });
  await refresh();
}

// Délégation sur le board pour éditer et supprimer les cartes
document.getElementById("kanban-board").addEventListener("click", async (e) => {
  const card = e.target.closest(".kanban-card");
  if (!card) return;

  if (e.target.dataset.action === "edit") {
    const todos = await fetchTodos(currentFilter);
    const todo = todos.find(t => t.id === card.dataset.id);
    if (todo) renderEditForm(todo, card);
    return;
  }

  if (e.target.dataset.action === "delete") {
    await deleteTodo(card.dataset.id);
    await refresh();
  }
});

// Filtre par catégorie
document.getElementById("category-filters").addEventListener("click", async (e) => {
  if (!e.target.classList.contains("filter-btn")) return;
  currentFilter = e.target.dataset.category;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  e.target.classList.add("active");
  await refresh();
});


// =============================================================================
// INITIALISATION
// =============================================================================

refresh();

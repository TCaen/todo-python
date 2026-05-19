// =============================================================================
// api.js — Couche de communication avec le serveur Flask
//
// Ce fichier est l'équivalent frontend du TodoController côté backend :
// il centralise tous les appels HTTP et expose des fonctions claires.
// app.js n'a pas besoin de connaître les URLs ni la structure des requêtes.
// =============================================================================

const BASE = "/api";

export async function fetchTodos(category = "all") {
  const res = await fetch(`${BASE}/todos?category=${category}`);
  const data = await res.json();
  return data.todos;
}

export async function fetchCategories() {
  const res = await fetch(`${BASE}/categories`);
  const data = await res.json();
  return data.categories;
}

export async function createTodo({ title, description, priority, category }) {
  const res = await fetch(`${BASE}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, priority, category }),
  });
  return res.ok ? await res.json() : null;
}

export async function updateTodo(id, updates) {
  const res = await fetch(`${BASE}/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return res.ok ? await res.json() : null;
}

export async function deleteTodo(id) {
  await fetch(`${BASE}/todos/${id}`, { method: "DELETE" });
}

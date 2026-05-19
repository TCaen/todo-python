from flask import Flask, jsonify, request, render_template
from controllers import TodoController

app = Flask(__name__)
controller = TodoController()


# =============================================================================
# VUE PRINCIPALE
# =============================================================================

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/todos/new")
def new_todo():
    return render_template("new_todo.html")


# =============================================================================
# API — Tâches
# =============================================================================

@app.route("/api/todos", methods=["GET"])
def get_todos():
    todos = controller.get_all(
        category=request.args.get("category"),
        state=request.args.get("state"),
    )
    return jsonify({"todos": [t.to_dict() for t in todos]})


@app.route("/api/todos", methods=["POST"])
def create_todo():
    data = request.get_json() or {}
    try:
        todo = controller.create(
            title=data.get("title", ""),
            description=data.get("description", ""),
            priority=data.get("priority", "secondaire"),
            category=data.get("category", ""),
        )
        return jsonify(todo.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/todos/<todo_id>", methods=["PUT"])
def update_todo(todo_id):
    data = request.get_json() or {}
    try:
        todo = controller.update(
            todo_id,
            title=data.get("title"),
            description=data.get("description"),
            priority=data.get("priority"),
            category=data.get("category"),
            state=data.get("state"),
        )
        return jsonify(todo.to_dict())
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except KeyError as e:
        return jsonify({"error": str(e)}), 404


@app.route("/api/todos/<todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    try:
        controller.delete(todo_id)
        return jsonify({"success": True})
    except KeyError as e:
        return jsonify({"error": str(e)}), 404


# =============================================================================
# API — Catégories
# =============================================================================

@app.route("/api/categories", methods=["GET"])
def get_categories():
    return jsonify({"categories": controller.get_categories()})


# =============================================================================
# POINT D'ENTRÉE
# =============================================================================

if __name__ == "__main__":
    app.run(debug=True)

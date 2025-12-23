import React, { useEffect, useState } from "react";

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ==============================
  // FETCH CATEGORIES
  // ==============================
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();

      // Normalize parentId (VERY IMPORTANT)
      const normalized = data.map((c: Category) => ({
        ...c,
        parentId: c.parentId ?? null
      }));

      setCategories(normalized);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  // ==============================
  // CREATE CATEGORY (FIXED)
  // ==============================
  const createCategory = async () => {
    if (!name.trim()) {
      alert("Category name is required");
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      parentId: parentId || null   // 🔥 CRITICAL FIX
    };

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to create category");
      }

      setName("");
      setParentId(null);
      fetchCategories();
    } catch (error) {
      console.error(error);
      alert("Error creating category");
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // TREE HELPERS
  // ==============================
  const buildTree = (parent: string | null, level = 0) => {
    return categories
      .filter(c => c.parentId === parent)
      .map(c => (
        <div key={c.id} style={{ marginLeft: level * 20 }}>
          ▸ {c.name}
          {buildTree(c.id, level + 1)}
        </div>
      ));
  };

  // ==============================
  // UI
  // ==============================
  return (
    <div style={{ padding: 20 }}>
      <h2>Category Manager</h2>

      {/* CREATE FORM */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Category name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ marginRight: 10 }}
        />

        <select
          value={parentId ?? ""}
          onChange={e =>
            setParentId(e.target.value ? e.target.value : null)
          }
          style={{ marginRight: 10 }}
        >
          <option value="">Root Category (Level 1)</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <button onClick={createCategory} disabled={loading}>
          {loading ? "Saving..." : "Add Category"}
        </button>
      </div>

      {/* TREE VIEW */}
      <h3>Category Hierarchy</h3>
      <div>{buildTree(null)}</div>
    </div>
  );
};

export default CategoryManager;

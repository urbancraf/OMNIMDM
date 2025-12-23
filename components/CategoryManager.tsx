import React, { useEffect, useState } from "react";
import axios from "axios";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  /**
   * FETCH CATEGORIES
   * 🔴 FIX: map backend parent_id → frontend parentId
   */
  const fetchCategories = async () => {
    try {
      const response = await axios.get("/categories");

      const mapped: Category[] = (response.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        parentId: c.parent_id ?? null   // ✅ CRITICAL FIX
      }));

      setCategories(mapped);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  /**
   * CREATE CATEGORY
   * 🔴 FIX: send parent_id to backend (NOT parentId)
   */
  const createCategory = async () => {
    if (!name.trim()) return;

    setLoading(true);

    try {
      await axios.post("/categories", {
        name: name.trim(),

        // ✅ CRITICAL FIX
        parent_id: selectedParentId
      });

      setName("");
      setSelectedParentId(null);
      fetchCategories();
    } catch (error) {
      console.error("Failed to create category", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ROOT CATEGORIES
   * 🔴 FIX: strict root detection
   */
  const rootCategories = categories.filter(
    c => c.parentId === null
  );

  /**
   * CHILD CATEGORIES
   */
  const getChildren = (parentId: string) =>
    categories.filter(c => c.parentId === parentId);

  return (
    <div>
      <h2>Category Manager</h2>

      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Category name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <button onClick={createCategory} disabled={loading}>
          {loading
            ? "Saving..."
            : selectedParentId
            ? "Create Sub-Category"
            : "Create Category"}
        </button>

        {selectedParentId && (
          <button
            style={{ marginLeft: "8px" }}
            onClick={() => setSelectedParentId(null)}
          >
            Cancel Sub-Category
          </button>
        )}
      </div>

      <ul>
        {rootCategories.map(parent => (
          <li key={parent.id}>
            <strong>{parent.name}</strong>

            <button
              style={{ marginLeft: "8px" }}
              onClick={() => setSelectedParentId(parent.id)}
            >
              Add Child
            </button>

            <ul>
              {getChildren(parent.id).map(child => (
                <li key={child.id}>{child.name}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryManager;
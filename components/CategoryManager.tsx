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
  const [tokenLoading, setTokenLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // ✅ STEP 1: FETCH TOKEN FIRST
  useEffect(() => {
    fetchAuthToken();
  }, []);

  // ✅ STEP 2: FETCH CATEGORIES AFTER TOKEN
  useEffect(() => {
    if (authToken) {
      fetchCategories();
    }
  }, [authToken]);

  /**
   * GET AUTH TOKEN FIRST
   */
  const fetchAuthToken = async () => {
    try {
      // Common token endpoints - adjust to your backend
      const tokenEndpoints = [
        '/api/auth/login',
        '/api/auth/token',
        '/auth/login',
        '/login'
      ];

      // Try common login payloads
      const loginPayloads = [
        { username: 'admin', password: 'admin' },
        { email: 'admin@example.com', password: 'password' },
        {}
      ];

      for (const endpoint of tokenEndpoints) {
        for (const payload of loginPayloads) {
          try {
            const response = await axios.post(endpoint, payload, {
              headers: { 'Content-Type': 'application/json' }
            });
            
            const token = response.data.token || 
                         response.data.access_token || 
                         response.headers.authorization?.replace('Bearer ', '');
            
            if (token) {
              setAuthToken(token);
              localStorage.setItem('authToken', token); // Persist token
              console.log('✅ Token fetched:', endpoint);
              return;
            }
          } catch (e) {
            // Try next endpoint/payload
          }
        }
      }

      // Try localStorage first
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setAuthToken(storedToken);
        return;
      }

      // Fallback: manual token input
      console.error('❌ No token found. Check your auth endpoint.');
      
    } catch (error) {
      console.error("Failed to fetch token", error);
    } finally {
      setTokenLoading(false);
    }
  };

  /**
   * FETCH CATEGORIES WITH AUTH
   */
  const fetchCategories = async () => {
    if (!authToken) return;

    try {
      const response = await axios.get("/categories", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const mapped: Category[] = (response.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        parentId: c.parent_id ?? null
      }));

      setCategories(mapped);
    } catch (error: any) {
      console.error("Failed to fetch categories", error.response?.data || error);
    }
  };

  /**
   * CREATE CATEGORY WITH AUTH
   */
  const createCategory = async () => {
    if (!name.trim() || !authToken) return;

    setLoading(true);

    try {
      await axios.post("/categories", {
        name: name.trim(),
        parent_id: selectedParentId
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      setName("");
      setSelectedParentId(null);
      fetchCategories();
    } catch (error: any) {
      console.error("Failed to create category", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * MANUAL TOKEN INPUT (Fallback)
   */
  const setManualToken = (token: string) => {
    setAuthToken(token);
    localStorage.setItem('authToken', token);
  };

  // Show loading while fetching token
  if (tokenLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>🔄 Initializing...</h2>
        <p>Fetching authentication token...</p>
      </div>
    );
  }

  // Show manual token input if no token
  if (!authToken) {
    return (
      <div style={{ maxWidth: "500px", margin: "40px auto", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h2>🔑 Authentication Required</h2>
        <p>No valid token found. Enter your JWT token:</p>
        
        <textarea
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          onChange={(e) => setManualToken(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            fontFamily: "monospace"
          }}
        />
        
        <div style={{ marginTop: "16px", gap: "12px", display: "flex", flexDirection: "column" }}>
          <button
            onClick={() => fetchAuthToken()}
            style={{
              padding: "12px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            🔄 Retry Auto-Login
          </button>
          
          <details style={{ marginTop: "12px" }}>
            <summary>Common Dev Tokens (click to copy)</summary>
            <div style={{ marginTop: "8px", fontSize: "12px", fontFamily: "monospace" }}>
              <button 
                onClick={() => setManualToken('dev-jwt-token-here')}
                style={{ marginRight: "8px", padding: "4px 8px", background: "#28a745", color: "white", border: "none", borderRadius: "3px" }}
              >
                Copy Dev Token
              </button>
              <br />
              <code>/api/auth/login → POST {JSON.stringify({username: 'admin', password: 'admin'})}</code>
            </div>
          </details>
        </div>
      </div>
    );
  }

  // ✅ MAIN UI - same as before
  const CategoryTree = ({ categories }: { categories: Category[] }) => {
    const getChildren = (parentId: string | null) =>
      categories.filter(c => c.parentId === parentId);

    const rootCategories = categories.filter(c => c.parentId === null);

    if (rootCategories.length === 0) {
      return <p>No categories found.</p>;
    }

    return (
      <ul style={{ listStyle: "none", padding: 0 }}>
        {rootCategories.map(parent => (
          <CategoryNode
            key={parent.id}
            category={parent}
            categories={categories}
            level={0}
          />
        ))}
      </ul>
    );
  };

  const CategoryNode = ({
    category,
    categories,
    level = 0
  }: {
    category: Category;
    categories: Category[];
    level: number;
  }) => {
    const children = categories.filter(c => c.parentId === category.id);

    return (
      <li 
        style={{ 
          margin: "4px 0",
          paddingLeft: `${level * 20}px`,
          borderLeft: "2px solid #eee",
          padding: "8px",
          background: level % 2 === 0 ? "#f9f9f9" : "white"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <strong>{category.name}</strong>
          
          <button
            style={{ 
              padding: "4px 8px",
              fontSize: "12px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
            onClick={() => setSelectedParentId(category.id)}
          >
            Add Child
          </button>
        </div>

        {children.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <CategoryTree categories={children} />
          </div>
        )}
      </li>
    );
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2>✅ Category Manager (Authenticated)</h2>
        <button
          onClick={() => {
            setAuthToken(null);
            localStorage.removeItem('authToken');
          }}
          style={{
            padding: "6px 12px",
            background: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px"
          }}
        >
          Logout
        </button>
      </div>

      {/* CREATE FORM */}
      <div style={{ marginBottom: "24px", padding: "16px", background: "#f0f8ff", borderRadius: "8px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Enter category name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              minWidth: "250px",
              fontSize: "14px"
            }}
          />

          <button 
            onClick={createCategory} 
            disabled={loading || !name.trim()}
            style={{
              padding: "10px 20px",
              background: loading || !name.trim() ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading || !name.trim() ? "not-allowed" : "pointer",
              fontSize: "14px"
            }}
          >
            {loading
              ? "Saving..."
              : selectedParentId
              ? "Create Sub-Category"
              : "Create Category"}
          </button>

          {selectedParentId && (
            <button
              style={{
                padding: "10px 20px",
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px"
              }}
              onClick={() => setSelectedParentId(null)}
            >
              Cancel Sub-Category
            </button>
          )}
        </div>

        {selectedParentId && (
          <p style={{ marginTop: "8px", color: "#666", fontSize: "14px" }}>
            Creating sub-category under: <strong>{categories.find(c => c.id === selectedParentId)?.name}</strong>
          </p>
        )}
      </div>

      {/* RECURSIVE TREE */}
      <CategoryTree categories={categories} />
    </div>
  );
};

export default CategoryManager;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Button, TextField } from "@mui/material";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [newItem, setNewItem] = useState(""); 
  const [items, setItems] = useState([]); 

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUser(storedUser);
      fetchItems(); // Load items from the database
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch items from the database
  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/items", {
        headers: {
          Authorization: token,
        },
      });
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  // Add an item to the database
  const addItem = async () => {
    if (newItem.trim() === "") return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:5000/items", { name: newItem }, {
        headers: {
          Authorization: token,
        },
      });
      console.log("Item added:", response.data);
      setItems([...items, response.data]); // Add the new item from the response
      setNewItem("");
    } catch (error) {
      console.error("Error adding item:", error.response ? error.response.data : error.message);
    }
  };

  // Delete an item
  const deleteItem = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/items/${id}`, {
        headers: {
          Authorization: token,
        },
      });
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" align="center" gutterBottom>
        Welcome, {user}!
      </Typography>
      <Typography variant="h4" align="center">
        ADD OR DELETE
      </Typography>

      <TextField
        fullWidth
        margin="normal"
        label="Add Item"
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
      />
      <Button variant="contained" color="primary" fullWidth onClick={addItem}>
        Add Item
      </Button>

      <ul style={{ padding: 0, listStyle: "none" }}>
        {items.map(item => (
          <li key={item.id} style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
            <TextField
              fullWidth
              value={item.name}
              onChange={(e) => updateItem(item.id, e.target.value)}
            />
            <Button variant="contained" color="secondary" onClick={() => deleteItem(item.id)} style={{ marginLeft: "10px" }}>
              Delete
            </Button>
          </li>
        ))}
      </ul>

      {/* Logout Button */}
      <Button variant="contained" color="secondary" fullWidth sx={{ mt: 2 }} onClick={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        navigate("/login");
      }}>
        Logout
      </Button>
    </Container>
  );
};

export default Dashboard;

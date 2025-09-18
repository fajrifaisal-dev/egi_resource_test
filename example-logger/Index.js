const express = require("express");
const jwt = require("jsonwebtoken");
const logger = require("./middlewares/logger");
const auth = require("./middlewares/auth");

const app = express();
app.use(express.json());
app.use(logger);

// Route login → generate JWT
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "123") {
    const token = jwt.sign(
      { userId: 1, role: "admin" },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1h" }
    );
    return res.json({ token });
  }
  res.status(401).json({ message: "Invalid credentials" });
});

// Protected route
app.get("/users", auth, (req, res) => {
  res.json([
    { id: 1, username: "rizqy" },
    { id: 2, username: "faisal" }
  ]);
});

app.listen(3000, () =>
  console.log("Example logger service running at http://localhost:3000")
);

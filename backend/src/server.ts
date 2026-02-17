import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.config";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Connect to Database
connectDB();

app.use(cors());
app.use(express.json());

import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";

app.use("/api/auth", authRoutes);
app.use("/api/users", authRoutes); // Re-using authRoutes for user profile update at /me
app.use("/api/tasks", taskRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(port, () => {
  // Server started
});

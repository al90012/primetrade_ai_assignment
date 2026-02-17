"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_config_1 = __importDefault(require("./config/db.config"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Connect to Database
(0, db_config_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", auth_routes_1.default); // Re-using authRoutes for user profile update at /me
app.use("/api/tasks", task_routes_1.default);
app.get("/", (req, res) => {
    res.send("API is running...");
});
app.listen(port, () => {
    // Server started
});

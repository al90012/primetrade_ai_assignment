"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const task_controller_1 = require("../controllers/task.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.route("/").get(auth_middleware_1.protect, task_controller_1.getTasks).post(auth_middleware_1.protect, task_controller_1.createTask);
router
    .route("/:id")
    .get(auth_middleware_1.protect, task_controller_1.getTaskById)
    .put(auth_middleware_1.protect, task_controller_1.updateTask)
    .delete(auth_middleware_1.protect, task_controller_1.deleteTask);
exports.default = router;

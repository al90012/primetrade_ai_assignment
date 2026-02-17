"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.createTask = exports.getTaskById = exports.getTasks = void 0;
const task_model_1 = __importDefault(require("../models/task.model"));
const response_util_1 = require("../utils/response.util");
const validation_util_1 = require("../utils/validation.util");
// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const search = req.query.search ? req.query.search : undefined;
    const status = req.query.status ? req.query.status : undefined;
    const keyword = search
        ? {
            $or: [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ],
        }
        : {};
    const statusFilter = status ? { status } : {};
    try {
        const tasks = yield task_model_1.default.find(Object.assign(Object.assign({ user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }, keyword), statusFilter)).sort({ createdAt: -1 });
        (0, response_util_1.sendSuccess)(res, 200, tasks, "Tasks retrieved successfully");
    }
    catch (error) {
        (0, response_util_1.sendError)(res, 500, "Server error", [error.message]);
    }
});
exports.getTasks = getTasks;
// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const task = yield task_model_1.default.findById(req.params.id);
        if (task && task.user.toString() === ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString())) {
            (0, response_util_1.sendSuccess)(res, 200, task, "Task retrieved successfully");
        }
        else {
            (0, response_util_1.sendError)(res, 404, "Task not found or not authorized");
        }
    }
    catch (error) {
        (0, response_util_1.sendError)(res, 500, "Server error", [error.message]);
    }
});
exports.getTaskById = getTaskById;
// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { title, description, status } = req.body;
    const errors = [];
    try {
        // Validation
        if (!title || !(0, validation_util_1.validateTaskTitle)(title)) {
            errors.push("Title is required and must not be empty");
        }
        if (status && !["pending", "in_progress", "completed"].includes(status)) {
            errors.push("Status must be one of: pending, in_progress, completed");
        }
        if (errors.length > 0) {
            (0, response_util_1.sendError)(res, 400, "Validation failed", errors);
            return;
        }
        const task = new task_model_1.default({
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            title,
            description,
            status: status || "pending",
        });
        const createdTask = yield task.save();
        (0, response_util_1.sendSuccess)(res, 201, createdTask, "Task created successfully");
    }
    catch (error) {
        (0, response_util_1.sendError)(res, 500, "Server error", [error.message]);
    }
});
exports.createTask = createTask;
// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { title, description, status } = req.body;
    const errors = [];
    try {
        // Validation
        if (title && !(0, validation_util_1.validateTaskTitle)(title)) {
            errors.push("Title must not be empty");
        }
        if (status && !["pending", "in_progress", "completed"].includes(status)) {
            errors.push("Status must be one of: pending, in_progress, completed");
        }
        if (errors.length > 0) {
            (0, response_util_1.sendError)(res, 400, "Validation failed", errors);
            return;
        }
        const task = yield task_model_1.default.findById(req.params.id);
        if (task && task.user.toString() === ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString())) {
            task.title = title || task.title;
            task.description = description || task.description;
            task.status = status || task.status;
            const updatedTask = yield task.save();
            (0, response_util_1.sendSuccess)(res, 200, updatedTask, "Task updated successfully");
        }
        else {
            (0, response_util_1.sendError)(res, 404, "Task not found or not authorized");
        }
    }
    catch (error) {
        (0, response_util_1.sendError)(res, 500, "Server error", [error.message]);
    }
});
exports.updateTask = updateTask;
// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const task = yield task_model_1.default.findById(req.params.id);
        if (task && task.user.toString() === ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString())) {
            yield task.deleteOne();
            (0, response_util_1.sendSuccess)(res, 200, null, "Task deleted successfully");
        }
        else {
            (0, response_util_1.sendError)(res, 404, "Task not found or not authorized");
        }
    }
    catch (error) {
        (0, response_util_1.sendError)(res, 500, "Server error", [error.message]);
    }
});
exports.deleteTask = deleteTask;

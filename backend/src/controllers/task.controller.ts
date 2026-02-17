import { Request, Response } from "express";
import Task, { ITask } from "../models/task.model";
import { sendSuccess, sendError } from "../utils/response.util";
import { validateTaskTitle } from "../utils/validation.util";

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  const search = req.query.search ? (req.query.search as string) : undefined;
  const status = req.query.status ? (req.query.status as string) : undefined;

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
    const tasks = await Task.find({
      user: (req as any).user?._id,
      ...keyword,
      ...statusFilter,
    }).sort({ createdAt: -1 });

    sendSuccess(res, 200, tasks, "Tasks retrieved successfully");
  } catch (error: any) {
    sendError(res, 500, "Server error", [error.message]);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);

    if (task && task.user.toString() === (req as any).user?._id.toString()) {
      sendSuccess(res, 200, task, "Task retrieved successfully");
    } else {
      sendError(res, 404, "Task not found or not authorized");
    }
  } catch (error: any) {
    sendError(res, 500, "Server error", [error.message]);
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { title, description, status } = req.body;
  const errors: string[] = [];

  try {
    // Validation
    if (!title || !validateTaskTitle(title)) {
      errors.push("Title is required and must not be empty");
    }

    if (status && !["pending", "in_progress", "completed"].includes(status)) {
      errors.push("Status must be one of: pending, in_progress, completed");
    }

    if (errors.length > 0) {
      sendError(res, 400, "Validation failed", errors);
      return;
    }

    const task = new Task({
      user: (req as any).user?._id,
      title,
      description,
      status: status || "pending",
    });

    const createdTask = await task.save();
    sendSuccess(res, 201, createdTask, "Task created successfully");
  } catch (error: any) {
    sendError(res, 500, "Server error", [error.message]);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { title, description, status } = req.body;
  const errors: string[] = [];

  try {
    // Validation
    if (title && !validateTaskTitle(title)) {
      errors.push("Title must not be empty");
    }

    if (status && !["pending", "in_progress", "completed"].includes(status)) {
      errors.push("Status must be one of: pending, in_progress, completed");
    }

    if (errors.length > 0) {
      sendError(res, 400, "Validation failed", errors);
      return;
    }

    const task = await Task.findById(req.params.id);

    if (task && task.user.toString() === (req as any).user?._id.toString()) {
      task.title = title || task.title;
      task.description = description || task.description;
      task.status = status || task.status;

      const updatedTask = await task.save();
      sendSuccess(res, 200, updatedTask, "Task updated successfully");
    } else {
      sendError(res, 404, "Task not found or not authorized");
    }
  } catch (error: any) {
    sendError(res, 500, "Server error", [error.message]);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);

    if (task && task.user.toString() === (req as any).user?._id.toString()) {
      await task.deleteOne();
      sendSuccess(res, 200, null, "Task deleted successfully");
    } else {
      sendError(res, 404, "Task not found or not authorized");
    }
  } catch (error: any) {
    sendError(res, 500, "Server error", [error.message]);
  }
};

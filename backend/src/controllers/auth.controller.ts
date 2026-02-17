import { Request, Response } from "express";
import User from "../models/user.model";
import generateToken from "../utils/authToken.util";
import { sendSuccess, sendError } from "../utils/response.util";
import {
  validateEmail,
  validatePassword,
  validateName,
} from "../utils/validation.util";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { name, email, password } = req.body;
  const errors: string[] = [];

  try {
    // Validation
    if (!name || !validateName(name)) {
      errors.push("Name must be at least 2 characters long");
    }

    if (!email || !validateEmail(email)) {
      errors.push("Please provide a valid email address");
    }

    if (!password) {
      errors.push("Password is required");
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        errors.push(...passwordValidation.errors);
      }
    }

    if (errors.length > 0) {
      sendError(res, 400, "Validation failed", errors);
      return;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      sendError(res, 400, "Email is already registered");
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const token = generateToken(user._id as unknown as string);

    sendSuccess(
      res,
      201,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        token,
      },
      "User registered successfully",
    );
  } catch (error: any) {
    sendError(res, 500, "Server error", [error.message]);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      sendError(res, 400, "Email and password are required");
      return;
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id as unknown as string);

      sendSuccess(
        res,
        200,
        {
          id: user._id,
          name: user.name,
          email: user.email,
          token,
        },
        "Login successful",
      );
    } else {
      sendError(res, 401, "Invalid email or password");
    }
  } catch (error: any) {
    sendError(res, 500, "Server error", [error.message]);
  }
};

// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private
export const getUserProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById((req as any).user?._id);

    if (user) {
      sendSuccess(
        res,
        200,
        {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        "Profile retrieved successfully",
      );
    } else {
      sendError(res, 404, "User not found");
    }
  } catch (error: any) {
    sendError(res, 500, "Server error", [error.message]);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
export const updateUserProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const errors: string[] = [];

  try {
    const user = await User.findById((req as any).user?._id);

    if (!user) {
      sendError(res, 404, "User not found");
      return;
    }

    // Validate name if provided
    if (req.body.name && !validateName(req.body.name)) {
      errors.push("Name must be at least 2 characters long");
    }

    // Validate email if provided
    if (req.body.email && !validateEmail(req.body.email)) {
      errors.push("Please provide a valid email address");
    }

    // Validate password if provided
    if (req.body.password) {
      const passwordValidation = validatePassword(req.body.password);
      if (!passwordValidation.valid) {
        errors.push(...passwordValidation.errors);
      }
    }

    if (errors.length > 0) {
      sendError(res, 400, "Validation failed", errors);
      return;
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    const token = generateToken(updatedUser._id as unknown as string);

    sendSuccess(
      res,
      200,
      {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        token,
      },
      "Profile updated successfully",
    );
  } catch (error: any) {
    sendError(res, 500, "Server error", [error.message]);
  }
};

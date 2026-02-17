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
exports.updateUserProfile = exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const authToken_util_1 = __importDefault(require("../utils/authToken.util"));
const response_util_1 = require("../utils/response.util");
const validation_util_1 = require("../utils/validation.util");
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    const errors = [];
    try {
        // Validation
        if (!name || !(0, validation_util_1.validateName)(name)) {
            errors.push("Name must be at least 2 characters long");
        }
        if (!email || !(0, validation_util_1.validateEmail)(email)) {
            errors.push("Please provide a valid email address");
        }
        if (!password) {
            errors.push("Password is required");
        }
        else {
            const passwordValidation = (0, validation_util_1.validatePassword)(password);
            if (!passwordValidation.valid) {
                errors.push(...passwordValidation.errors);
            }
        }
        if (errors.length > 0) {
            (0, response_util_1.sendError)(res, 400, "Validation failed", errors);
            return;
        }
        const userExists = yield user_model_1.default.findOne({ email });
        if (userExists) {
            (0, response_util_1.sendError)(res, 400, "Email is already registered");
            return;
        }
        const user = yield user_model_1.default.create({
            name,
            email,
            password,
        });
        const token = (0, authToken_util_1.default)(user._id);
        (0, response_util_1.sendSuccess)(res, 201, {
            id: user._id,
            name: user.name,
            email: user.email,
            token,
        }, "User registered successfully");
    }
    catch (error) {
        (0, response_util_1.sendError)(res, 500, "Server error", [error.message]);
    }
});
exports.registerUser = registerUser;
// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            (0, response_util_1.sendError)(res, 400, "Email and password are required");
            return;
        }
        const user = yield user_model_1.default.findOne({ email });
        if (user && (yield user.matchPassword(password))) {
            const token = (0, authToken_util_1.default)(user._id);
            (0, response_util_1.sendSuccess)(res, 200, {
                id: user._id,
                name: user.name,
                email: user.email,
                token,
            }, "Login successful");
        }
        else {
            (0, response_util_1.sendError)(res, 401, "Invalid email or password");
        }
    }
    catch (error) {
        (0, response_util_1.sendError)(res, 500, "Server error", [error.message]);
    }
});
exports.loginUser = loginUser;
// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        if (user) {
            (0, response_util_1.sendSuccess)(res, 200, {
                id: user._id,
                name: user.name,
                email: user.email,
            }, "Profile retrieved successfully");
        }
        else {
            (0, response_util_1.sendError)(res, 404, "User not found");
        }
    }
    catch (error) {
        (0, response_util_1.sendError)(res, 500, "Server error", [error.message]);
    }
});
exports.getUserProfile = getUserProfile;
// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = [];
    try {
        const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        if (!user) {
            (0, response_util_1.sendError)(res, 404, "User not found");
            return;
        }
        // Validate name if provided
        if (req.body.name && !(0, validation_util_1.validateName)(req.body.name)) {
            errors.push("Name must be at least 2 characters long");
        }
        // Validate email if provided
        if (req.body.email && !(0, validation_util_1.validateEmail)(req.body.email)) {
            errors.push("Please provide a valid email address");
        }
        // Validate password if provided
        if (req.body.password) {
            const passwordValidation = (0, validation_util_1.validatePassword)(req.body.password);
            if (!passwordValidation.valid) {
                errors.push(...passwordValidation.errors);
            }
        }
        if (errors.length > 0) {
            (0, response_util_1.sendError)(res, 400, "Validation failed", errors);
            return;
        }
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            user.password = req.body.password;
        }
        const updatedUser = yield user.save();
        const token = (0, authToken_util_1.default)(updatedUser._id);
        (0, response_util_1.sendSuccess)(res, 200, {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            token,
        }, "Profile updated successfully");
    }
    catch (error) {
        (0, response_util_1.sendError)(res, 500, "Server error", [error.message]);
    }
});
exports.updateUserProfile = updateUserProfile;

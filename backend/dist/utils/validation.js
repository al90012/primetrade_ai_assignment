"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTaskTitle = exports.validateName = exports.validatePassword = exports.validateEmail = void 0;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePassword = (password) => {
    const errors = [];
    if (password.length < 6) {
        errors.push("Password must be at least 6 characters long");
    }
    return {
        valid: errors.length === 0,
        errors,
    };
};
exports.validatePassword = validatePassword;
const validateName = (name) => {
    return !!name && name.trim().length >= 2;
};
exports.validateName = validateName;
const validateTaskTitle = (title) => {
    return !!title && title.trim().length > 0;
};
exports.validateTaskTitle = validateTaskTitle;

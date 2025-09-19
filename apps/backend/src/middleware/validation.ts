import { body } from 'express-validator';

// Validation rules for user registration
export const validateRegister = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
];

// Validation rules for user login
export const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// Validation rules for creating a sweet
export const validateCreateSweet = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Sweet name must be between 2 and 100 characters'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('price')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Price must be a valid decimal number with up to 2 decimal places')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Price must be greater than 0');
      }
      return true;
    }),
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

// Validation rules for updating a sweet
export const validateUpdateSweet = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Sweet name must be between 2 and 100 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('price')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Price must be a valid decimal number with up to 2 decimal places')
    .custom((value) => {
      if (value !== undefined && parseFloat(value) <= 0) {
        throw new Error('Price must be greater than 0');
      }
      return true;
    }),
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

// Validation rules for purchase
export const validatePurchase = [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
];

// Validation rules for restock
export const validateRestock = [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
];

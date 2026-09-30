import { validationResult, check } from 'express-validator';

export const validateRegistration = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateLogin = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
  (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateDemand = [
  check('title', 'Title is required and must be between 5 and 200 characters')
    .not().isEmpty()
    .isLength({ min: 5, max: 200 }),
  check('category', 'Category is required').not().isEmpty(),
  check('description', 'Description is required and must be between 20 and 2000 characters')
    .not().isEmpty()
    .isLength({ min: 20, max: 2000 }),
  check('location')
    .custom((value) => {
      if (!value) {
        throw new Error('Location is required');
      }
      if (typeof value === 'object' && value.address) {
        return true;
      }
      throw new Error('Location must include an address');
    }),
  check('contactEmail')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email address'),
  check('contactPhone')
    .optional({ checkFalsy: true })
    .matches(/^[\d\s\-\(\)\+]+$/)
    .withMessage('Please provide a valid phone number'),
  (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateRental = [
  check('title', 'Title is required').not().isEmpty(),
  check('category', 'Category is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('location', 'Location is required').isObject(),
  check('price', 'Price is required and must be a number').isNumeric(),
  check('squareFeet', 'Square footage is required and must be a number').isNumeric(),
  (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// API route handlers organized by resource
export { userHandlers } from './users';
export { productHandlers } from './products';
export { healthHandler, apiInfoHandler } from './system';

// Re-export all handlers for easy importing
export * from './users';
export * from './products'; 
export * from './system';
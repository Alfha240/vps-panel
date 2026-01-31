import { z } from 'zod'

// User validation
export const userSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
})

// Location validation
export const locationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    code: z.string().min(2, 'Code must be at least 2 characters').max(10),
    country: z.string().min(2, 'Country is required'),
    city: z.string().min(2, 'City is required'),
    description: z.string().optional(),
})

// Node validation
export const nodeSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    hostname: z.string().min(3, 'Hostname is required'),
    ipAddress: z.string().ip('Invalid IP address'),
    port: z.number().int().min(1).max(65535),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    apiEndpoint: z.string().url().optional().or(z.literal('')),
    maxCpu: z.number().int().positive('Max CPU must be positive'),
    maxRam: z.number().int().positive('Max RAM must be positive'),
    maxStorage: z.number().int().positive('Max storage must be positive'),
    locationId: z.string().cuid('Invalid location ID'),
})

// Plan validation
export const planSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    cpu: z.number().int().positive('CPU must be positive'),
    ram: z.number().int().positive('RAM must be positive'),
    storage: z.number().int().positive('Storage must be positive'),
    bandwidth: z.number().int().positive('Bandwidth must be positive'),
    price: z.number().positive('Price must be positive'),
})

// Server validation
export const serverSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    hostname: z.string().min(3, 'Hostname is required'),
    osType: z.string().min(1, 'OS type is required'),
    planId: z.string().cuid('Invalid plan ID'),
})

// IP Pool validation
export const ipPoolSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    cidr: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/, 'Invalid CIDR format'),
    gateway: z.string().ip('Invalid gateway IP'),
    netmask: z.string().ip('Invalid netmask'),
    locationId: z.string().cuid('Invalid location ID'),
})

// API Token validation
export const apiTokenSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    permissions: z.array(z.string()).min(1, 'At least one permission required'),
    expiresAt: z.date().optional(),
})

// Power action validation
export const powerActionSchema = z.object({
    action: z.enum(['start', 'stop', 'restart']),
})

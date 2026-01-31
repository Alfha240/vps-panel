import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32'
const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypt sensitive data (e.g., node credentials)
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16)
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32))

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Return IV + AuthTag + Encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encrypted: string): string {
    const parts = encrypted.split(':')
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encryptedText = parts[2]

    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32))

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}

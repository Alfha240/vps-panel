import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deployVPS, validateDeployment } from '@/lib/vps-deployment'
import { z } from 'zod'

const deploySchema = z.object({
    planId: z.string(),
    osType: z.string(),
    hostname: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Hostname must contain only lowercase letters, numbers, and hyphens'),
})

// POST deploy new VPS
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { planId, osType, hostname } = deploySchema.parse(body)

        // Validate deployment
        const validation = await validateDeployment(session.user.id, planId)
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 })
        }

        // Deploy VPS
        const result = await deployVPS({
            userId: session.user.id,
            planId,
            osType,
            hostname,
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Deployment error:', error)

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: error.message || 'Failed to deploy VPS' },
            { status: 500 }
        )
    }
}

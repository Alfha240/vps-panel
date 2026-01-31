import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    children?: ReactNode
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, children, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="label">
                        {label}
                        {props.required && <span className="text-error ml-1">*</span>}
                    </label>
                )}
                <select
                    ref={ref}
                    className={cn(
                        'input',
                        error && 'border-error focus:ring-error',
                        className
                    )}
                    {...props}
                >
                    {children}
                </select>
                {error && (
                    <p className="mt-1 text-sm text-error">{error}</p>
                )}
            </div>
        )
    }
)

Select.displayName = 'Select'

export default Select

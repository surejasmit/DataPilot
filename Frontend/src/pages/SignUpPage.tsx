import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthVisual } from '@/components/auth/AuthVisual'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Link as UILink } from '@/components/ui/Link'
import { Loader2 } from 'lucide-react'

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export function SignUpPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter'
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
    return null
  }

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      newErrors.password = passwordError
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // TODO: Connect to backend API
      // await api.auth.register(formData)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      navigate('/signin?registered=true')
    } catch (err) {
      setErrors({ email: 'An account with this email already exists' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <AuthLayout
      title="Create your workspace"
      description="Start analyzing your data in minutes. Free tier available, no credit card required."
      backgroundVisual={<AuthVisual />}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Alex Chen"
          autoComplete="name"
          autoFocus
          disabled={isLoading}
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="alex@company.com"
          autoComplete="email"
          disabled={isLoading}
        />

        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="••••••••"
          autoComplete="new-password"
          helperText="At least 8 characters with uppercase, lowercase, and number"
          disabled={isLoading}
        />

        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isLoading}
        />

        <Button type="submit" className="w-full mt-1" size="lg" loading={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>

        <p className="text-center text-sm text-fg-2 pt-1">
          Already have an account?{' '}
          <UILink to="/signin" className="font-semibold text-accent hover:text-accent-dim">
            Sign In
          </UILink>
        </p>
      </form>
    </AuthLayout>
  )
}
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Link as UILink } from '@/components/ui/Link'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface FormErrors {
  email?: string
  password?: string
}

export function SignInPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const registered = searchParams.get('registered') === 'true'

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
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
      // await api.auth.login(formData)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      // navigate('/dashboard') // Dashboard not implemented yet
      navigate('/')
    } catch {
      setErrors({ email: 'Invalid email or password' })
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
      title="Welcome back"
      description="Sign in to access your workspaces, datasets, and dashboards."
      sideContent={
        <div className="mt-8 p-4 bg-bg-1 border border-border-1 rounded-xl">
          <p className="text-sm text-fg-1">
            <strong className="text-fg-0">Demo credentials:</strong><br />
            Email: demo@datapilot.ai<br />
            Password: DemoPass123
          </p>
        </div>
      }
    >
      {registered && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-3 bg-success-bg border border-success/30 rounded-lg text-sm text-success flex items-center gap-2"
          role="alert"
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Account created successfully! Please sign in.
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="alex@company.com"
          autoComplete="email"
          autoFocus
          disabled={isLoading}
        />

        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={isLoading}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-border-2 text-accent focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-0 bg-bg-2"
            />
            <span className="text-sm text-fg-1">Remember me</span>
          </label>
          <UILink to="/forgot-password" className="text-sm font-medium text-accent hover:text-accent-dim">
            Forgot password?
          </UILink>
        </div>

        <Button type="submit" className="w-full mt-1" size="lg" loading={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>

        <p className="text-center text-sm text-fg-2 pt-1">
          Don&apos;t have an account?{' '}
          <UILink to="/signup" className="font-semibold text-accent hover:text-accent-dim">
            Create Account
          </UILink>
        </p>
      </form>
    </AuthLayout>
  )
}
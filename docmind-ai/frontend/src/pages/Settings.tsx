import { useState, useEffect } from 'react'
import { User, Lock, Brain, Trash2, Save, Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'

type Tab = 'profile' | 'password' | 'ai' | 'danger'

interface UserProfile {
  name: string
  email: string
}

export default function Settings() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<UserProfile>({ name: user?.name || '', email: user?.email || '' })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const handleProfileSave = async () => {
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    try {
      await api.put('/auth/me', profile)
      setMessage({ type: 'success', text: 'Profile updated successfully' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    try {
      await api.put('/auth/password', { current_password: passwords.current, new_password: passwords.new })
      setPasswords({ current: '', new: '', confirm: '' })
      setMessage({ type: 'success', text: 'Password changed successfully' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to change password' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return
    try {
      await api.delete('/auth/me')
      logout()
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete account' })
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'password', label: 'Password', icon: Lock },
    { key: 'ai', label: 'AI Preferences', icon: Brain },
    { key: 'danger', label: 'Danger Zone', icon: Trash2 },
  ]

  return (
    <div className="mx-auto max-w-5xl p-5 lg:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Settings</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Account Settings</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-48 shrink-0">
          <nav className="space-y-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === key
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>

          {/* Dark Mode Toggle */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isDark ? <Moon size={16} className="text-indigo-600" /> : <Sun size={16} className="text-amber-500" />}
                <span className="text-sm font-medium text-gray-700">Dark Mode</span>
              </div>
              <button
                onClick={() => setIsDark(!isDark)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isDark ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Profile Information</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button onClick={handleProfileSave} disabled={isSaving} className="gap-2">
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'password' && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Change Password</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button onClick={handlePasswordChange} disabled={isSaving} className="gap-2">
                  <Lock size={16} />
                  {isSaving ? 'Changing...' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'ai' && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">AI Preferences</h3>
                <p className="text-sm text-gray-500">Configure how the AI assistant behaves.</p>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Citation Mode</p>
                      <p className="text-sm text-gray-500">Always include source references in AI responses</p>
                    </div>
                    <button className="relative w-11 h-6 rounded-full bg-indigo-600">
                      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
                    </button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Hallucination Prevention</p>
                      <p className="text-sm text-gray-500">AI will only answer from document context</p>
                    </div>
                    <button className="relative w-11 h-6 rounded-full bg-indigo-600">
                      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'danger' && (
            <Card className="border-red-200">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-red-700">Danger Zone</h3>
                <p className="text-sm text-gray-500">Irreversible actions for your account.</p>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Delete Account</p>
                    <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive" onClick={handleDeleteAccount} className="gap-2">
                    <Trash2 size={16} />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

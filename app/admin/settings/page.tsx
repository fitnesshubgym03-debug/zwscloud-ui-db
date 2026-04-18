'use client'

import { useEffect, useState } from 'react'
import { Settings, CreditCard, Save, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SettingsData {
  cashfree_app_id: string
  cashfree_secret_key: string
  cashfree_mode: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    cashfree_app_id: '',
    cashfree_secret_key: '',
    cashfree_mode: 'test',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const data = await response.json()
          setSettings({
            cashfree_app_id: data.cashfree_app_id?.id || '',
            cashfree_secret_key: data.cashfree_secret_key?.key || '',
            cashfree_mode: data.cashfree_mode?.mode || 'test',
          })
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Configure your ZWS Cloud admin settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent" />
            <CardTitle>Payment Gateway</CardTitle>
          </div>
          <CardDescription>
            Configure Cashfree payment gateway credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={settings.cashfree_mode === 'test' ? 'secondary' : 'default'}>
              {settings.cashfree_mode === 'test' ? 'Test Mode' : 'Production Mode'}
            </Badge>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">App ID</label>
            <Input
              value={settings.cashfree_app_id}
              onChange={(e) => setSettings({ ...settings, cashfree_app_id: e.target.value })}
              placeholder="Enter Cashfree App ID"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Secret Key</label>
            <Input
              type="password"
              value={settings.cashfree_secret_key}
              onChange={(e) => setSettings({ ...settings, cashfree_secret_key: e.target.value })}
              placeholder="Enter Cashfree Secret Key"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mode</label>
            <div className="flex gap-2">
              <Button
                variant={settings.cashfree_mode === 'test' ? 'default' : 'outline'}
                onClick={() => setSettings({ ...settings, cashfree_mode: 'test' })}
                size="sm"
              >
                Test
              </Button>
              <Button
                variant={settings.cashfree_mode === 'production' ? 'default' : 'outline'}
                onClick={() => setSettings({ ...settings, cashfree_mode: 'production' })}
                size="sm"
              >
                Production
              </Button>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
            {saved && (
              <span className="text-sm text-green-500 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Settings saved!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            <CardTitle>General Settings</CardTitle>
          </div>
          <CardDescription>
            Other configuration options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Additional settings coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

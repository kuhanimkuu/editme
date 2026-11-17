import { useState } from 'react';
import { Bell, CreditCard, Lock, Shield, User, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { useUser } from '../context/UserContext';

type NotificationKey = 'messages' | 'projectUpdates' | 'payments' | 'marketing';

const notificationOptions: { key: NotificationKey; label: string; hint: string }[] = [
  { key: 'messages', label: 'New messages', hint: 'When someone writes to you' },
  { key: 'projectUpdates', label: 'Project updates', hint: 'Drafts delivered, reviews requested, deadlines' },
  { key: 'payments', label: 'Payments', hint: 'Escrow funded, released or refunded' },
  { key: 'marketing', label: 'Tips and news', hint: 'Occasional product updates from EditMe' },
];

export function Settings() {
  const { userRole } = useUser();
  // A fresh form per role, so switching Client/Editor shows that role's details.
  return <SettingsForm key={userRole} isClient={userRole === 'client'} />;
}

function SettingsForm({ isClient }: { isClient: boolean }) {

  const [name, setName] = useState(isClient ? 'Tech Corp' : 'Sarah Chen');
  const [email, setEmail] = useState(isClient ? 'client@techcorp.com' : 'sarah@editme.io');
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    messages: true,
    projectUpdates: true,
    payments: true,
    marketing: false,
  });
  const [twoFactor, setTwoFactor] = useState(false);

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const canSave = name.trim().length > 0 && emailValid;

  const saveProfile = () => {
    if (!canSave) return;
    toast.success('Account details saved');
  };

  const toggleNotification = (key: NotificationKey, on: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: on }));
  };

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account, notifications and security</p>
      </motion.div>

      <div className="space-y-6">
        {/* Account */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-gray-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="w-5 h-5 text-[#2979FF]" />
                Account
              </CardTitle>
              <CardDescription>
                {isClient ? 'How editors see your company' : 'How clients see you'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-name">{isClient ? 'Company name' : 'Full name'}</Label>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-email">Email</Label>
                <Input
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!emailValid}
                  className="rounded-xl"
                />
                {!emailValid && (
                  <p className="text-xs text-red-600">Enter a valid email address</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={saveProfile}
                  disabled={!canSave}
                  className="bg-[#2979FF] hover:bg-[#1565C0] rounded-xl"
                >
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-gray-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bell className="w-5 h-5 text-[#9333ea]" />
                Notifications
              </CardTitle>
              <CardDescription>Choose what EditMe emails you about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {notificationOptions.map(({ key, label, hint }, i) => (
                <div key={key}>
                  {i > 0 && <Separator className="my-3" />}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label htmlFor={`notify-${key}`} className="font-medium">{label}</Label>
                      <p className="text-sm text-gray-500">{hint}</p>
                    </div>
                    <Switch
                      id={`notify-${key}`}
                      checked={notifications[key]}
                      onCheckedChange={(on) => toggleNotification(key, on)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-gray-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CreditCard className="w-5 h-5 text-[#10b981]" />
                {isClient ? 'Payment method' : 'Payout method'}
              </CardTitle>
              <CardDescription>
                {isClient
                  ? 'Used to fund escrow when you hire an editor'
                  : 'Where released escrow payments are sent'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {isClient ? 'Visa ending 4242' : 'Bank account ending 6789'}
                    </p>
                    <p className="text-xs text-gray-500">Default</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => toast.info('Changing the payment method needs a payment provider (not connected yet)')}
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-gray-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="w-5 h-5 text-[#f97316]" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="two-factor" className="font-medium">Two-step verification</Label>
                  <p className="text-sm text-gray-500">Ask for a code when signing in on a new device</p>
                </div>
                <Switch
                  id="two-factor"
                  checked={twoFactor}
                  onCheckedChange={(on) => {
                    setTwoFactor(on);
                    toast.success(on ? 'Two-step verification on' : 'Two-step verification off');
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">Password</p>
                  <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => toast.info('A reset link would be sent to ' + email)}
                >
                  <Lock className="w-4 h-4 mr-1" />
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-red-200 rounded-2xl">
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-red-600">Delete account</p>
                <p className="text-sm text-gray-500">
                  Projects with money in escrow must be finished or refunded first
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => toast.error('Account deletion is not available in this demo')}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

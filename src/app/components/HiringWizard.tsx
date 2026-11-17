import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  Check, ChevronRight, ChevronLeft, Shield, Clock, Star,
  Upload, Link as LinkIcon, CheckCircle, Zap,
} from 'lucide-react';

interface Editor {
  id: string;
  name: string;
  avatar: string;
  category: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
}

interface HiringWizardProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    desc: 'Quick Edit',
    price: 299,
    delivery: '3 days',
    features: ['Up to 3-min video', 'Basic color grade', '2 revisions', 'HD export'],
    highlight: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    desc: 'Pro Edit',
    price: 699,
    delivery: '5 days',
    features: ['Up to 8-min video', 'Advanced color grade', '4 revisions', 'Motion graphics', '4K export'],
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    desc: 'Cinematic Edit',
    price: 1499,
    delivery: '10 days',
    features: ['Unlimited length', 'Cinematic LUT', 'Unlimited revisions', 'VFX elements', 'Project files'],
    highlight: false,
  },
];

const STEPS = ['Service', 'Details', 'Review', 'Done'];

export function HiringWizard({ editor, isOpen, onClose }: HiringWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [deadline, setDeadline] = useState('');

  const plan = plans.find(p => p.id === selectedPlan)!;

  const handleClose = () => {
    setStep(0);
    setSelectedPlan('standard');
    setProjectTitle('');
    setProjectDesc('');
    setDeadline('');
    onClose();
  };

  if (!editor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 mb-0">Hire {editor.name}</DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all ${
                  i < step ? 'bg-[#2979FF] text-white' :
                  i === step ? 'bg-[#2979FF] text-white ring-4 ring-blue-100' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-[#2979FF]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">

          {/* ── Step 0: Select Service ── */}
          {step === 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={editor.avatar} />
                  <AvatarFallback>{editor.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{editor.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {editor.rating} · {editor.category}
                  </div>
                </div>
              </div>

              {plans.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedPlan === p.id
                      ? 'border-[#2979FF] bg-[#EFF6FF]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
                        <span className="text-gray-500 text-xs">— {p.desc}</span>
                        {p.highlight && (
                          <Badge className="bg-[#2979FF] text-white border-none text-[10px] h-4 px-1.5">Popular</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.delivery}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xl font-bold text-gray-900">${p.price}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.features.map(f => (
                      <span key={f} className="text-[11px] text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ── Step 1: Project Details ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Title *</label>
                <Input
                  placeholder="e.g. Brand launch promo video"
                  value={projectTitle}
                  onChange={e => setProjectTitle(e.target.value)}
                  className="rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Describe your project *</label>
                <textarea
                  placeholder="Describe your vision, style references, tone, target audience, and any specific requirements..."
                  value={projectDesc}
                  onChange={e => setProjectDesc(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2979FF]/20 focus:border-[#2979FF] resize-none placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline preference</label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference links <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="YouTube, Vimeo, or Google Drive links"
                    className="pl-9 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#2979FF] hover:bg-blue-50/30 transition-all cursor-pointer group">
                <Upload className="w-7 h-7 text-gray-400 group-hover:text-[#2979FF] mx-auto mb-2 transition-colors" />
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Upload raw footage or assets</p>
                <p className="text-xs text-gray-400 mt-0.5">MP4, MOV, ZIP · max 2 GB</p>
              </div>
            </div>
          )}

          {/* ── Step 2: Review & Fund ── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Order summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm text-gray-900">Order Summary</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={editor.avatar} />
                    <AvatarFallback>{editor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{editor.name}</p>
                    <p className="text-xs text-gray-500">{plan.name} — {plan.desc}</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Project</span>
                    <span className="font-medium truncate max-w-[200px]">{projectTitle || 'Untitled project'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-medium">{plan.delivery}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Revisions</span>
                    <span className="font-medium">{plan.features.find(f => f.includes('revision')) || 'Included'}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-[#2979FF]">${plan.price.toLocaleString()} USD</span>
                  </div>
                </div>
              </div>

              {/* Escrow explanation */}
              <div className="flex gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="w-9 h-9 rounded-xl bg-[#9333ea] flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4.5 h-4.5 text-white w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Secured by Escrow</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Your ${plan.price.toLocaleString()} is held securely and only released when you approve the final delivery. Full refund if the editor doesn't deliver.
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                By clicking "Fund Escrow" you agree to EditMe's Terms of Service and Payment Policy.
              </p>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2979FF] to-[#9333ea] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-200">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Project workspace created!</h2>
              <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto mb-2">
                <span className="font-semibold">{editor.name}</span> has been notified and will accept within 24 hours. Your ${plan.price.toLocaleString()} is safely held in escrow.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-full mb-6">
                <Zap className="w-3 h-3" /> Fast responder — avg. reply time 1.8h
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Service</p>
                  <p className="font-semibold text-sm">{plan.name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Delivery by</p>
                  <p className="font-semibold text-sm">{plan.delivery}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {step < 3 ? (
            <>
              <Button
                variant="outline"
                onClick={step === 0 ? handleClose : () => setStep(s => s - 1)}
                className="rounded-xl border-gray-200 gap-1.5"
              >
                {step === 0 ? 'Cancel' : <><ChevronLeft className="w-4 h-4" />Back</>}
              </Button>
              <Button
                onClick={() => {
                  if (step === 2) setStep(3);
                  else setStep(s => s + 1);
                }}
                disabled={step === 1 && !projectTitle.trim()}
                className={`rounded-xl gap-1.5 shadow-sm ${
                  step === 2
                    ? 'bg-gradient-to-r from-[#9333ea] via-[#ec4899] to-[#f97316] hover:opacity-90 text-white px-6'
                    : 'bg-[#2979FF] hover:bg-[#1565C0] text-white px-6'
                }`}
              >
                {step === 0 && <>Continue <ChevronRight className="w-4 h-4" /></>}
                {step === 1 && <>Next <ChevronRight className="w-4 h-4" /></>}
                {step === 2 && <><Shield className="w-4 h-4" /> Fund Escrow · ${plan.price.toLocaleString()}</>}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleClose}
              className="w-full bg-[#2979FF] hover:bg-[#1565C0] rounded-xl h-10 shadow-sm"
            >
              View Project Workspace
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

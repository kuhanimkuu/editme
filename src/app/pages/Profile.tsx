import { useState } from 'react';
import {
  MapPin, Globe, Star, Briefcase, Edit, Upload,
  RefreshCw, CheckCircle, MessageSquare, Play,
  Clock, Shield, Zap, DollarSign, Users,
  Settings, Plus,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useUser } from '../context/UserContext';
import { motion } from 'motion/react';
import { UploadModal } from '../components/UploadModal';
import { mockProjects, mockFreelancers } from '../data/mockData';

/* ─────────────────────────────────────────
   Editor profile data
───────────────────────────────────────── */
const portfolioItems = [
  { id: 1, src: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&h=400&fit=crop', title: 'Product Launch Film', views: '24K', likes: '1.2K' },
  { id: 2, src: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&h=400&fit=crop', title: 'Brand Story Reel', views: '18K', likes: '986' },
  { id: 3, src: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=400&fit=crop', title: 'Corporate Documentary', views: '31K', likes: '2.1K' },
  { id: 4, src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop', title: 'Music Video Edit', views: '56K', likes: '4.8K' },
  { id: 5, src: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=400&fit=crop', title: 'YouTube Series Pilot', views: '12K', likes: '741' },
  { id: 6, src: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=600&h=400&fit=crop', title: 'Social Media Pack', views: '9K', likes: '529' },
];

const editorServices = [
  {
    tier: 'Basic', name: 'Quick Edit', price: 299, delivery: '3 days',
    features: ['Up to 3-min video', 'Basic color grade', '2 revisions', 'HD export'],
    highlight: false,
  },
  {
    tier: 'Standard', name: 'Pro Edit', price: 699, delivery: '5 days',
    features: ['Up to 8-min video', 'Advanced color grade', '4 revisions', 'Motion graphics', '4K export'],
    highlight: true,
  },
  {
    tier: 'Premium', name: 'Cinematic Edit', price: 1499, delivery: '10 days',
    features: ['Unlimited length', 'Cinematic LUT', 'Unlimited revisions', 'VFX elements', 'Project files'],
    highlight: false,
  },
];

const editorReviews = [
  { id: 1, name: 'Jordan Miles', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop', company: 'MilesCo Media', rating: 5, date: 'Aug 2026', text: "Sarah transformed our raw footage into a story that genuinely moved our audience. 3× watch time after the rebrand." },
  { id: 2, name: 'Aisha Novak', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop', company: 'Novak Brand Studio', rating: 5, date: 'Jul 2026', text: "Delivered three days early and nailed every note on the first revision. Color grading was exceptional." },
  { id: 3, name: 'Carlos Reyes', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop', company: 'Reyes Films', rating: 5, date: 'Jun 2026', text: "Sarah is the benchmark I hold every editor to. Communicates proactively and executes flawlessly." },
];

const editorSkills = [
  { name: 'Adobe Premiere Pro', level: 98 },
  { name: 'After Effects', level: 92 },
  { name: 'DaVinci Resolve', level: 90 },
  { name: 'Motion Graphics', level: 88 },
  { name: 'Color Grading', level: 94 },
];

/* ─────────────────────────────────────────
   Client profile data
───────────────────────────────────────── */
const hiredEditors = mockFreelancers.slice(0, 4);

const clientReviewsGiven = [
  { id: 1, editor: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop', project: 'Product Launch Video', rating: 5, date: 'Aug 2026', text: "Outstanding work. Sarah understood the brief perfectly and delivered ahead of schedule." },
  { id: 2, editor: 'Olivia Martinez', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop', project: 'Social Media Campaign', rating: 4, date: 'Jul 2026', text: "Great content creator, responsive, and very easy to work with." },
];

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
type EditorTab = 'portfolio' | 'services' | 'reviews' | 'about';
type ClientTab = 'projects' | 'editors' | 'reviews' | 'settings';

export function Profile() {
  const { userRole, toggleRole } = useUser();
  const isEditor = userRole === 'freelancer';

  const [editorTab, setEditorTab] = useState<EditorTab>('portfolio');
  const [clientTab, setClientTab] = useState<ClientTab>('projects');
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="pb-12">
      {/* Cover */}
      <div className="relative h-44 overflow-hidden">
        {isEditor ? (
          <>
            <img
              src="https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1400&h=300&fit=crop"
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#9333ea]/70 via-[#ec4899]/50 to-[#f97316]/60" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#2979FF] to-[#1565C0]">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `radial-gradient(circle at 30% 50%, white 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }} />
          </div>
        )}

        {/* Role toggle */}
        <div className="absolute top-4 right-4">
          <Button
            onClick={toggleRole}
            size="sm"
            className="bg-white/20 hover:bg-white/30 border border-white/40 text-white backdrop-blur-sm rounded-xl h-9 px-4 gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Switch to {isEditor ? 'Client' : 'Editor'} Mode
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">

        {/* ═══════════════════════════════════
            EDITOR PROFILE
        ═══════════════════════════════════ */}
        {isEditor && (
          <>
            {/* Header */}
            <div className="relative -mt-12 flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
              <div className="w-24 h-24 rounded-2xl p-[3px] bg-gradient-to-br from-[#9333ea] via-[#ec4899] to-[#f97316] shadow-xl flex-shrink-0">
                <Avatar className="w-full h-full rounded-[calc(1rem-3px)]">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop" />
                  <AvatarFallback className="rounded-[calc(1rem-3px)]">SC</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">Sarah Chen</h1>
                  <CheckCircle className="w-5 h-5 fill-[#2979FF] text-white" />
                  <Badge className="bg-[#EFF6FF] text-[#2979FF] border-[#BFDBFE] text-xs">Top Rated</Badge>
                </div>
                <p className="text-gray-500 text-sm mb-1.5">Award-winning Video Editor & Motion Designer</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />San Francisco, CA</span>
                  <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /><a href="#" className="text-[#2979FF]">sarahchen.io</a></span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Responds in ~2h</span>
                </div>
              </div>
              <div className="flex gap-2 sm:pb-1 flex-wrap">
                <Button size="sm" variant="outline" className="rounded-xl border-gray-200 gap-1.5 h-9 text-xs">
                  <Edit className="w-3.5 h-3.5" />Edit Profile
                </Button>
                <Button size="sm" onClick={() => setUploadOpen(true)} className="bg-[#2979FF] hover:bg-[#1565C0] rounded-xl h-9 gap-1.5 text-xs shadow-sm">
                  <Upload className="w-3.5 h-3.5" />Add Work
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Projects Done', value: '67', icon: Briefcase, color: 'text-[#2979FF]', bg: 'bg-blue-50' },
                { label: 'Avg Rating', value: '4.9', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Total Earned', value: '$45K', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Profile Views', value: '1.2K', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 w-[18px] h-[18px] ${color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
                    <p className="text-[11px] text-gray-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 mb-6">
              {(['portfolio', 'services', 'reviews', 'about'] as EditorTab[]).map(tab => (
                <button key={tab} onClick={() => setEditorTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                    editorTab === tab ? 'border-[#2979FF] text-[#2979FF]' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ── Portfolio ── */}
            {editorTab === 'portfolio' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                  {portfolioItems.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                      className="group relative aspect-video bg-gray-100 rounded-2xl overflow-hidden cursor-pointer border border-gray-100 hover:shadow-xl transition-all duration-300"
                    >
                      <img src={item.src} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-4 h-4 text-[#2979FF] fill-[#2979FF] ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all">
                        <p className="text-white font-semibold text-xs truncate">{item.title}</p>
                        <div className="flex items-center gap-2 text-white/70 text-[10px] mt-0.5">
                          <span>{item.views} views</span>
                          <span>{item.likes} likes</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={() => setUploadOpen(true)}
                  className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center hover:border-[#2979FF] hover:bg-blue-50/30 transition-all group cursor-pointer"
                >
                  <Upload className="w-7 h-7 text-gray-400 group-hover:text-[#2979FF] mb-2 transition-colors" />
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Add new portfolio work</p>
                  <p className="text-xs text-gray-400 mt-0.5">Upload video or paste YouTube / Vimeo link</p>
                </button>
              </motion.div>
            )}

            {/* ── Services ── */}
            {editorTab === 'services' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {editorServices.map((svc, i) => (
                  <motion.div key={svc.tier} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className={`relative rounded-2xl border p-5 flex flex-col ${
                      svc.highlight ? 'border-[#2979FF]/40 bg-[#EFF6FF]' : 'border-gray-200 bg-white'
                    }`}
                  >
                    {svc.highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#2979FF] text-white text-[11px] font-semibold rounded-full">
                        Most Popular
                      </span>
                    )}
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{svc.tier}</p>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{svc.name}</h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-bold">${svc.price}</span>
                      <span className="text-xs text-gray-500">/ project</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-4">
                      <Clock className="w-3.5 h-3.5 text-[#2979FF]" />
                      <span className="font-medium">{svc.delivery}</span>
                    </div>
                    <ul className="space-y-1.5 mb-5 flex-1">
                      {svc.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-700">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" size="sm" className="w-full rounded-xl border-gray-200 text-xs gap-1.5">
                      <Edit className="w-3.5 h-3.5" />Edit Package
                    </Button>
                  </motion.div>
                ))}

                <button className="border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:border-[#2979FF] hover:bg-blue-50/20 transition-all group cursor-pointer min-h-[200px]">
                  <Plus className="w-8 h-8 text-gray-400 group-hover:text-[#2979FF] transition-colors" />
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Add custom package</p>
                </button>
              </motion.div>
            )}

            {/* ── Reviews ── */}
            {editorTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-5 mb-2">
                  <div className="text-center pr-5 border-r border-gray-100">
                    <p className="text-4xl font-bold text-gray-900">4.9</p>
                    <div className="flex gap-0.5 justify-center mt-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">127 reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[['Communication', 98], ['Quality', 99], ['Value', 95], ['Timeliness', 97]].map(([l, p]) => (
                      <div key={l} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-24">{l}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${p}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-6 text-right">{p}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                {editorReviews.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-white rounded-2xl border border-gray-100 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={r.avatar} />
                        <AvatarFallback>{r.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{r.name}</span>
                          <span className="text-xs text-gray-400">· {r.company}</span>
                          <span className="text-xs text-gray-400 ml-auto">{r.date}</span>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />)}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{r.text}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── About ── */}
            {editorTab === 'about' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">About Me</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">I'm a San Francisco-based video editor with 8+ years crafting stories for brands, agencies, and creators worldwide. My approach blends cinematic visual language with data-informed content strategy.</p>
                    <p className="text-sm text-gray-700 leading-relaxed mt-3">Before going freelance, I was lead editor at a production house working on campaigns for Google, Airbnb, and Stripe.</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4 text-sm">Skills</h3>
                    <div className="space-y-3">
                      {editorSkills.map(skill => (
                        <div key={skill.name}>
                          <div className="flex justify-between mb-1.5">
                            <span className="text-sm text-gray-700">{skill.name}</span>
                            <span className="text-sm font-semibold text-[#2979FF]">{skill.level}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${skill.level}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                              className="h-full bg-gradient-to-r from-[#2979FF] to-[#9333ea] rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quick Stats</h3>
                    {[['Response rate', '98%'], ['On-time delivery', '97%'], ['Repeat clients', '73%'], ['Languages', 'EN, ZH']].map(([l, v]) => (
                      <div key={l} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                        <span className="text-gray-500">{l}</span>
                        <span className="font-semibold text-gray-900">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-[#9333ea]" />
                      <p className="font-semibold text-sm text-gray-900">Verified by EditMe</p>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">Portfolio verified, identity confirmed. Top 5% of all editors on platform.</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-semibold text-sm text-gray-900 mb-3">Badges</h3>
                    {[['🏆', 'Top Rated', '6-month streak'], ['⚡', 'Fast Responder', 'Avg. 1.8h reply'], ['🎯', 'Project Master', '67 completed']].map(([icon, label, desc]) => (
                      <div key={label} className="flex items-center gap-2.5 py-2 hover:bg-gray-50 rounded-xl px-2 -mx-2 transition-colors">
                        <span className="text-lg">{icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{label}</p>
                          <p className="text-[11px] text-gray-500">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════
            CLIENT PROFILE
        ═══════════════════════════════════ */}
        {!isEditor && (
          <>
            {/* Header */}
            <div className="relative -mt-12 flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300&h=300&fit=crop" alt="Tech Corp" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">Tech Corp</h1>
                  <CheckCircle className="w-5 h-5 fill-[#2979FF] text-white" />
                  <Badge className="bg-[#EFF6FF] text-[#2979FF] border-[#BFDBFE] text-xs">Verified Client</Badge>
                </div>
                <p className="text-gray-500 text-sm mb-1.5">Technology company specializing in innovative digital products</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />San Francisco, CA</span>
                  <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /><a href="#" className="text-[#2979FF]">techcorp.com</a></span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />51-200 employees</span>
                </div>
              </div>
              <div className="flex gap-2 sm:pb-1">
                <Button size="sm" variant="outline" className="rounded-xl border-gray-200 gap-1.5 h-9 text-xs">
                  <Edit className="w-3.5 h-3.5" />Edit Profile
                </Button>
                <Button size="sm" className="bg-[#2979FF] hover:bg-[#1565C0] rounded-xl h-9 gap-1.5 text-xs shadow-sm">
                  <Plus className="w-3.5 h-3.5" />New Project
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Projects Posted', value: '12', icon: Briefcase, color: 'text-[#2979FF]', bg: 'bg-blue-50' },
                { label: 'Editors Hired', value: '18', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Total Spent', value: '$12K', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Avg Rating Given', value: '4.7', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-[18px] h-[18px] ${color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
                    <p className="text-[11px] text-gray-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Client tabs */}
            <div className="flex gap-1 border-b border-gray-200 mb-6">
              {(['projects', 'editors', 'reviews', 'settings'] as ClientTab[]).map(tab => (
                <button key={tab} onClick={() => setClientTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                    clientTab === tab ? 'border-[#2979FF] text-[#2979FF]' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ── Client: Active Projects ── */}
            {clientTab === 'projects' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {mockProjects.map((proj, i) => {
                  const statusColors: Record<string, string> = {
                    'in-progress': 'bg-blue-100 text-blue-700',
                    review: 'bg-amber-100 text-amber-700',
                    secured: 'bg-purple-100 text-purple-700',
                    completed: 'bg-emerald-100 text-emerald-700',
                  };
                  return (
                    <motion.div key={proj.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:border-gray-200 hover:shadow-md transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{proj.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${statusColors[proj.status]}`}>
                            {proj.status.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-2">{proj.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Avatar className="h-4 w-4"><AvatarImage src={proj.freelancer.avatar} /><AvatarFallback>{proj.freelancer.name[0]}</AvatarFallback></Avatar>
                            {proj.freelancer.name}
                          </span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(proj.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${proj.budget.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-gray-900 mb-1">{proj.progress}%</div>
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2979FF] rounded-full" style={{ width: `${proj.progress}%` }} />
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-xl border-gray-200 text-xs h-8 flex-shrink-0">
                        View
                      </Button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ── Client: Hired Editors ── */}
            {clientTab === 'editors' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hiredEditors.map((editor, i) => (
                  <motion.div key={editor.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-gray-200 hover:shadow-md transition-all"
                  >
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm flex-shrink-0">
                      <AvatarImage src={editor.avatar} />
                      <AvatarFallback>{editor.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{editor.name}</h3>
                      <p className="text-xs text-gray-500">{editor.category}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold">{editor.rating}</span>
                        <span className="text-xs text-gray-400">({editor.reviews})</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Button size="sm" className="bg-[#2979FF] hover:bg-[#1565C0] rounded-xl h-7 px-3 text-[11px]">Hire Again</Button>
                      <Button size="sm" variant="outline" className="rounded-xl h-7 px-3 text-[11px] border-gray-200 gap-1">
                        <MessageSquare className="w-3 h-3" />Message
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── Client: Reviews Given ── */}
            {clientTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {clientReviewsGiven.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-white rounded-2xl border border-gray-100 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={r.avatar} />
                        <AvatarFallback>{r.editor[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{r.editor}</span>
                          <span className="text-xs text-gray-400">· {r.project}</span>
                          <span className="text-xs text-gray-400 ml-auto">{r.date}</span>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />)}
                        </div>
                        <p className="text-sm text-gray-700">{r.text}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── Client: Settings ── */}
            {clientTab === 'settings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 text-sm flex items-center gap-2"><Settings className="w-4 h-4" />Account Settings</h3>
                  <div className="space-y-4">
                    {[['Company Name', 'Tech Corp'], ['Email', 'admin@techcorp.com'], ['Phone', '+1 (415) 555-0192'], ['Country', 'United States']].map(([label, value]) => (
                      <div key={label}>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                        <input defaultValue={value} className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2979FF]/20" />
                      </div>
                    ))}
                    <Button className="bg-[#2979FF] hover:bg-[#1565C0] rounded-xl h-9 w-full shadow-sm">Save Changes</Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">Payment Methods</h3>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-3">
                      <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">VISA</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                        <p className="text-xs text-gray-500">Expires 09/28</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border-none text-xs">Default</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full rounded-xl border-gray-200 text-xs gap-1.5">
                      <Plus className="w-3.5 h-3.5" />Add payment method
                    </Button>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">Notifications</h3>
                    {[['New messages', true], ['Project updates', true], ['Payment receipts', true], ['Marketing emails', false]].map(([label, enabled]) => (
                      <div key={String(label)} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-700">{String(label)}</span>
                        <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${enabled ? 'bg-[#2979FF]' : 'bg-gray-200'} relative flex-shrink-0`}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}

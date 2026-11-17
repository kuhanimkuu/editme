import { useState } from 'react';
import {
  Search, Star, Heart, Play, CheckCircle,
  SlidersHorizontal, Clock,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { mockFreelancers } from '../data/mockData';
import { motion } from 'motion/react';
import { HiringWizard } from '../components/HiringWizard';
import { useUser } from '../context/UserContext';

const categories = ['All', 'Video Editor', 'Motion Designer', 'Animator', 'Colorist', 'VFX Artist', 'YouTube Editor'];
const softwareOptions = ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Final Cut Pro', 'Cinema 4D', 'Blender'];

const extendedEditors = [
  ...mockFreelancers,
  {
    id: '7',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    category: 'YouTube Editor',
    rating: 4.8,
    reviews: 211,
    hourlyRate: 65,
    bio: 'YouTube growth specialist with viral content expertise',
    skills: ['Premiere Pro', 'Thumbnail Design', 'YouTube SEO'],
    portfolio: [
      'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&h=400&fit=crop',
    ],
    availability: 'available' as const,
  },
  {
    id: '8',
    name: 'James Park',
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop',
    category: 'VFX Artist',
    rating: 5.0,
    reviews: 44,
    hourlyRate: 120,
    bio: 'Hollywood VFX pipeline veteran — compositing & photoreal CG',
    skills: ['Nuke', 'Houdini', 'After Effects'],
    portfolio: [
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&h=400&fit=crop',
    ],
    availability: 'busy' as const,
  },
  {
    id: '9',
    name: 'Lena Kovač',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    category: 'Motion Designer',
    rating: 4.9,
    reviews: 98,
    hourlyRate: 88,
    bio: 'Brand animation & UI motion for top-tier tech companies',
    skills: ['After Effects', 'Figma', 'Lottie'],
    portfolio: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&h=400&fit=crop',
    ],
    availability: 'available' as const,
  },
];

const availabilityDot = { available: 'bg-emerald-500', busy: 'bg-amber-500', offline: 'bg-gray-400' };
const availabilityLabel = { available: 'Available', busy: 'Busy', offline: 'Offline' };

type Editor = typeof extendedEditors[number];

export function Discover() {
  const { userRole } = useUser();
  const isClient = userRole === 'client';

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [savedEditors, setSavedEditors] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [wizardEditor, setWizardEditor] = useState<Editor | null>(null);

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedEditors(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = selectedCategory === 'All'
    ? extendedEditors
    : extendedEditors.filter(e => e.category === selectedCategory);

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)]">

      {/* ── Filter sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ width: showFilters ? 256 : 0, opacity: showFilters ? 1 : 0 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="flex-shrink-0 overflow-hidden border-r border-gray-100 bg-white hidden lg:block"
      >
        <div className="w-64 h-full overflow-y-auto">
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Filters</span>
              <button className="text-xs text-[#2979FF] hover:underline">Reset all</button>
            </div>

            {/* Specialization */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Specialization</p>
              <div className="space-y-0.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      selectedCategory === cat ? 'bg-[#EFF6FF] text-[#2979FF]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Rate */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Hourly Rate</p>
              <div className="flex gap-2">
                <Input placeholder="$0" className="h-8 rounded-lg text-xs bg-gray-50 border-transparent flex-1" />
                <Input placeholder="$200" className="h-8 rounded-lg text-xs bg-gray-50 border-transparent flex-1" />
              </div>
            </div>

            {/* Rating */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Min. Rating</p>
              <div className="space-y-1.5">
                {[5, 4, 3].map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="rating" className="accent-[#2979FF]" />
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{r}+</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Availability</p>
              <div className="space-y-1.5">
                {(['available', 'busy'] as const).map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[#2979FF]" />
                    <span className={`w-2 h-2 rounded-full ${availabilityDot[s]}`} />
                    <span className="text-xs text-gray-600">{availabilityLabel[s]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Software */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Software</p>
              <div className="space-y-1.5">
                {softwareOptions.map(sw => (
                  <label key={sw} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[#2979FF]" />
                    <span className="text-xs text-gray-600">{sw}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Delivery */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Delivery</p>
              <div className="space-y-1.5">
                {['Express (24h)', '3-day', '7-day', 'Any'].map(d => (
                  <label key={d} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="delivery" className="accent-[#2979FF]" />
                    <span className="text-xs text-gray-600">{d}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Sticky toolbar */}
        <div className="sticky top-16 z-20 bg-[#F7F8FA] border-b border-gray-100 px-5 py-2.5 flex items-center gap-3">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex-shrink-0 ${
              showFilters
                ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2979FF]'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {showFilters ? 'Hide filters' : 'Filters'}
          </button>

          <div className="w-px h-5 bg-gray-200 hidden lg:block flex-shrink-0" />

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#2979FF] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#2979FF] hover:text-[#2979FF]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-shrink-0 hidden sm:block w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-8 h-8 bg-white border-gray-200 rounded-xl text-xs shadow-sm"
            />
          </div>

          <span className="text-xs text-gray-400 flex-shrink-0 hidden md:block">{filtered.length} results</span>
        </div>

        {/* Editor cards grid */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* Editor mode banner */}
          {!isClient && (
            <div className="mb-5 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#9333ea]/10 flex items-center justify-center flex-shrink-0 text-base">🎨</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">You're browsing as an Editor</p>
                <p className="text-xs text-gray-600">Discover top editors for inspiration, or switch to Client mode to hire.</p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-none text-xs">Editor Mode</Badge>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((editor, i) => (
              <motion.div
                key={editor.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.035 }}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/80 transition-all duration-300"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={editor.portfolio[0]}
                    alt={`${editor.name}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-300" />

                  {/* Play */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-[#2979FF] fill-[#2979FF] ml-0.5" />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="absolute top-2.5 left-2.5">
                    <Badge className="bg-black/55 text-white border-none text-[11px] backdrop-blur-sm">
                      {editor.category}
                    </Badge>
                  </div>

                  {/* Save */}
                  <button
                    onClick={e => toggleSave(editor.id, e)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  >
                    <Heart className={`w-3.5 h-3.5 ${savedEditors.has(editor.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                  </button>

                  {/* Availability */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                    <span className={`w-2 h-2 rounded-full ${availabilityDot[editor.availability]}`} />
                    <span className="text-white text-[11px] font-medium drop-shadow">{availabilityLabel[editor.availability]}</span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-3.5">
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                        <AvatarImage src={editor.avatar} />
                        <AvatarFallback>{editor.name[0]}</AvatarFallback>
                      </Avatar>
                      <CheckCircle className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 fill-[#2979FF] text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[13.5px] text-gray-900 truncate">{editor.name}</h3>
                      <p className="text-[11.5px] text-gray-500 truncate leading-snug">{editor.bio}</p>
                    </div>
                  </div>

                  {/* Rating + delivery */}
                  <div className="flex items-center gap-3 mb-2.5 text-[12px]">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-gray-900">{editor.rating}</span>
                      <span className="text-gray-400">({editor.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Fast delivery</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {editor.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-full text-[11px] text-gray-600 font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-[17px] font-bold text-gray-900">${editor.hourlyRate}</span>
                      <span className="text-[11px] text-gray-500">/hr</span>
                    </div>
                    {isClient ? (
                      <Button
                        size="sm"
                        onClick={() => setWizardEditor(editor)}
                        className="bg-[#2979FF] hover:bg-[#1565C0] text-white rounded-xl h-8 px-3.5 text-xs font-medium shadow-sm"
                      >
                        Hire Now
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => toggleSave(editor.id, e)}
                        className={`rounded-xl h-8 px-3.5 text-xs font-medium border-gray-200 gap-1 ${
                          savedEditors.has(editor.id) ? 'text-red-500 border-red-200 bg-red-50' : ''
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${savedEditors.has(editor.id) ? 'fill-red-500' : ''}`} />
                        {savedEditors.has(editor.id) ? 'Saved' : 'Save'}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <Search className="w-7 h-7 text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No editors found</h3>
              <p className="text-sm text-gray-500 mb-4">Try adjusting your filters</p>
              <Button variant="outline" className="rounded-xl text-sm" onClick={() => setSelectedCategory('All')}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hiring wizard */}
      <HiringWizard
        editor={wizardEditor}
        isOpen={!!wizardEditor}
        onClose={() => setWizardEditor(null)}
      />
    </div>
  );
}

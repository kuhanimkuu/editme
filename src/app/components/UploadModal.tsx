import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Upload, X, Play, CheckCircle, Tag } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = ['Video Editing', 'Motion Graphics', 'Color Grading', 'VFX', 'YouTube', 'Wedding', 'Commercial', 'Documentary'];

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploaded, setUploaded] = useState(false);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 6) {
      setTags(prev => [...prev, t]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const handlePublish = () => {
    setUploaded(true);
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setTags([]);
    setTagInput('');
    setVideoUrl('');
    setUploaded(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl gap-0">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              {uploaded ? 'Work published!' : 'Add Portfolio Work'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
          {!uploaded ? (
            <div className="space-y-4">
              {/* Upload area */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#2979FF] hover:bg-blue-50/20 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-[#EFF6FF] flex items-center justify-center mx-auto mb-3 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#2979FF] transition-colors" />
                </div>
                <p className="text-sm font-medium text-gray-700">Drag & drop your video file</p>
                <p className="text-xs text-gray-400 mt-0.5">MP4, MOV, AVI · up to 2 GB</p>
                <p className="text-xs text-gray-400 mt-2">— or —</p>
                <Button size="sm" variant="outline" className="mt-2 rounded-xl text-xs border-gray-200">
                  Browse files
                </Button>
              </div>

              {/* Video URL alternative */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Or paste a link
                </label>
                <div className="relative">
                  <Play className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="YouTube or Vimeo URL"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    className="pl-9 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Title *
                </label>
                <Input
                  placeholder="e.g. Cinematic brand film for Acme Co."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Describe the project, your role, tools used, and any results..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2979FF]/20 focus:border-[#2979FF] resize-none placeholder:text-gray-400"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        category === c
                          ? 'bg-[#2979FF] text-white border-[#2979FF]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#2979FF] hover:text-[#2979FF]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Tags <span className="text-gray-400 font-normal normal-case">(up to 6)</span>
                </label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {tags.map(t => (
                    <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                      {t}
                      <button onClick={() => removeTag(t)} className="text-gray-400 hover:text-gray-700">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTag()}
                      className="pl-8 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm h-9"
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={addTag} className="rounded-xl border-gray-200 h-9">Add</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">"{title || 'Your work'}" is live!</h3>
              <p className="text-sm text-gray-600">Your portfolio piece is now visible to clients browsing EditMe.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {!uploaded ? (
            <>
              <Button variant="outline" onClick={handleClose} className="rounded-xl border-gray-200">Cancel</Button>
              <Button
                onClick={handlePublish}
                disabled={!title.trim()}
                className="flex-1 bg-[#2979FF] hover:bg-[#1565C0] rounded-xl shadow-sm"
              >
                Publish to Portfolio
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full bg-[#2979FF] hover:bg-[#1565C0] rounded-xl">Done</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

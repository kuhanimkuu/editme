import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Upload, X, Play, Tag } from 'lucide-react';
import { Spinner } from './common';
import { parseVideoUrl } from './editor-parts';
import { supabase, type EditorCategory } from '../../lib/supabase';
import { categories, categoryLabels } from '../../lib/format';
import { errorMessage, must } from '../../lib/errors';
import { MB, uploadPath } from '../../lib/storage';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  editorId: string;
  defaultCategory?: EditorCategory;
}

const ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm';

/** Adds a portfolio piece: an uploaded file (≤ 50 MB) or a video link. */
export function UploadModal({ isOpen, onClose, onAdded, editorId, defaultCategory }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EditorCategory | null>(defaultCategory ?? null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = videoUrl.trim();
  const urlOk = !url || (/^https:\/\//.test(url) && url.length <= 500);
  const canPublish = !!title.trim() && (!!file || (!!url && urlOk)) && !busy;

  const addTag = () => {
    const t = tagInput.trim().slice(0, 30);
    if (t && !tags.includes(t) && tags.length < 10) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const reset = () => {
    setFile(null); setVideoUrl(''); setTitle(''); setDescription(''); setCategory(defaultCategory ?? null);
    setTags([]); setTagInput(''); setError(null);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const pick = (f: File | null) => {
    setError(null);
    if (f && f.size > 50 * MB) return setError('Files can be up to 50 MB. For longer videos, paste a YouTube or Vimeo link instead.');
    if (f && !ACCEPT.split(',').includes(f.type)) return setError('Use a JPG, PNG, WebP, MP4, MOV or WebM file.');
    setFile(f);
  };

  const publish = async () => {
    setBusy(true);
    setError(null);
    try {
      let media_path: string | null = null;
      if (file) {
        media_path = uploadPath(editorId, file);
        const up = await supabase.storage.from('portfolio').upload(media_path, file, { contentType: file.type });
        if (up.error) throw up.error;
      }
      must(await supabase.from('portfolio_items').insert({
        editor_id: editorId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        tags,
        video_url: file ? null : url,
        media_path,
      }));
      toast.success(`"${title.trim()}" is on your portfolio`);
      reset();
      onAdded();
      onClose();
    } catch (e) {
      setError(await errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const ref = parseVideoUrl(url);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl gap-0">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Add portfolio work</DialogTitle>
            <DialogDescription>Clients see this on your profile and Discover card.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-4">
          <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#2979FF] hover:bg-blue-50/20 transition-all cursor-pointer group block">
            <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-[#EFF6FF] flex items-center justify-center mx-auto mb-3 transition-colors">
              <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#2979FF] transition-colors" />
            </div>
            <p className="text-sm font-medium text-gray-700 truncate">{file ? file.name : 'Choose a video or image'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{file ? `${(file.size / MB).toFixed(1)} MB` : 'MP4, MOV, WebM, JPG, PNG · up to 50 MB'}</p>
            <input type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          </label>
          {file && <button onClick={() => setFile(null)} className="text-xs text-gray-500 hover:text-gray-900 -mt-2">Remove file</button>}

          {!file && (
            <div>
              <label htmlFor="pf-url" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Or paste a link</label>
              <div className="relative">
                <Play className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="pf-url" placeholder="https://youtube.com/... or https://vimeo.com/..." value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)} aria-invalid={!urlOk}
                  className="pl-9 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm" />
              </div>
              {!urlOk && <p className="text-xs text-red-600 mt-1">Use a full https:// link</p>}
              {url && urlOk && !ref && <p className="text-xs text-gray-400 mt-1">Links other than YouTube or Vimeo open in a new tab.</p>}
            </div>
          )}

          <div>
            <label htmlFor="pf-title" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Title *</label>
            <Input id="pf-title" maxLength={120} placeholder="e.g. Brand film for a coffee roaster" value={title}
              onChange={(e) => setTitle(e.target.value)} className="rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm" />
          </div>

          <div>
            <label htmlFor="pf-desc" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
            <textarea id="pf-desc" rows={3} maxLength={1000} placeholder="The brief, your role, tools, results..."
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2979FF]/20 focus:border-[#2979FF] resize-none placeholder:text-gray-400" />
          </div>

          <div>
            <p className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={category === c}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    category === c ? 'bg-[#2979FF] text-white border-[#2979FF]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#2979FF] hover:text-[#2979FF]'}`}>
                  {categoryLabels[c]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="pf-tag" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Tags <span className="text-gray-400 font-normal normal-case">(up to 10)</span>
            </label>
            {tags.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                    {t}
                    <button onClick={() => setTags((prev) => prev.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="text-gray-400 hover:text-gray-700"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input id="pf-tag" placeholder="Add a tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  className="pl-8 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm h-9" />
              </div>
              <Button size="sm" variant="outline" onClick={addTag} className="rounded-xl border-gray-200 h-9">Add</Button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <Button variant="outline" onClick={close} disabled={busy} className="rounded-xl border-gray-200">Cancel</Button>
          <Button onClick={publish} disabled={!canPublish} className="flex-1 bg-[#2979FF] hover:bg-[#1565C0] rounded-xl shadow-sm">
            {busy ? <Spinner className="text-white" /> : 'Add to portfolio'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

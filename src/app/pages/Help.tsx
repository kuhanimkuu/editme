import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Search, LifeBuoy } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

type Faq = { q: string; a: string };

// Answers describe what the app actually does (see How it works).
const sections: { title: string; faqs: Faq[] }[] = [
  {
    title: 'Getting started',
    faqs: [
      { q: 'Is EditMe for clients or editors?', a: 'Both. Anyone can hire. To offer work, switch to Editor mode in the sidebar and set up your editor profile. You can switch between the two at any time.' },
      { q: 'What does "Sample" mean on a profile?', a: 'Sample profiles show what EditMe looks like while it grows. They are not real editors, have no ratings and cannot be hired. Real editors always appear first, and samples disappear as real editors join each category.' },
      { q: "I didn't get the confirmation email.", a: 'Check your spam folder and wait a minute. If it still hasn\'t arrived, try signing up again with the same email; we\'ll send a new link.' },
    ],
  },
  {
    title: 'Hiring and payments',
    faqs: [
      { q: 'When do I pay?', a: "When you hire. You pick one of the editor's packages, describe the project and pay the package price into escrow. The price can't change after that." },
      { q: 'Who holds my money?', a: 'EditMe holds it in escrow. It is released to the editor only when you approve the delivery, or when EditMe staff decide a dispute in their favour.' },
      { q: 'Can I get a refund?', a: "Yes, in full, if the editor declines your project or if you cancel before they accept it. After work has started, use \"Report a problem\" on the project and EditMe will decide." },
      { q: 'How do revisions work?', a: 'Each package includes a number of revisions (or unlimited). When work is delivered you can approve it or request changes; each request uses one revision.' },
      { q: 'How do I share footage with the editor?', a: 'Once the project is paid for, use its chat: attach files up to 25 MB, or share a link (Google Drive, Dropbox, WeTransfer) for bigger footage.' },
    ],
  },
  {
    title: 'For editors',
    faqs: [
      { q: 'How do I get my first client?', a: 'Add a clear headline, your skills and at least three portfolio pieces. Clients filter by specialization, software and price, and hire from portfolios.' },
      { q: 'Do I start work before being paid?', a: 'No. You only see project requests that are already paid into escrow. Accept the ones you want; declining refunds the client.' },
      { q: 'When do I get paid?', a: 'When the client approves your delivery, the payment goes to your wallet. Withdraw it from the Wallet page.' },
      { q: 'Can I change my prices?', a: 'Yes, under Profile → Services. New prices apply to new hires; projects already hired keep the price they were hired at.' },
      { q: 'How do I pause new work?', a: 'Edit your profile and set your availability to Busy, or turn off "Show me on Discover". Current projects carry on.' },
    ],
  },
  {
    title: 'Account and security',
    faqs: [
      { q: 'How do I turn on two-step sign-in?', a: 'Settings → Security → Two-step sign-in. Scan the QR code with an authenticator app and enter the code it shows. After that, signing in needs your password and a code.' },
      { q: 'I forgot my password.', a: 'Use "Forgot password?" on the sign-in page. We email you a link to choose a new one.' },
      { q: 'How do I delete my account?', a: 'Settings → Delete account. Projects with money in escrow and any wallet balance must be settled first. Finished projects stay on record for the other side, without your name.' },
    ],
  },
];

export function Help() {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const shown = useMemo(() => sections
    .map((s) => ({ ...s, faqs: s.faqs.filter((f) => !query || `${f.q} ${f.a}`.toLowerCase().includes(query)) }))
    .filter((s) => s.faqs.length), [query]);

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2979FF] flex items-center justify-center mx-auto mb-3"><LifeBuoy className="w-6 h-6" /></div>
        <h1 className="text-4xl font-bold mb-2">Help & FAQ</h1>
        <p className="text-gray-600">Answers to common questions. New here? Start with <Link to="/how-it-works" className="text-[#2979FF] hover:underline">How it works</Link>.</p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions..." aria-label="Search questions" className="pl-9 h-11 rounded-xl bg-white" />
      </div>

      {shown.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-10">No answers match "{q}".</p>
      ) : shown.map((s) => (
        <section key={s.title} className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">{s.title}</h2>
          <Accordion type="multiple" className="bg-white rounded-2xl border border-gray-100 px-5">
            {s.faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left text-sm font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}

      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-6 text-center">
        <h2 className="font-semibold text-gray-900 mb-1">A problem with a project?</h2>
        <p className="text-sm text-gray-600 mb-4">Open the project and choose "Report a problem". The money stays safe in escrow while EditMe looks into it.</p>
        <Button asChild variant="outline" className="rounded-xl"><Link to="/projects">Go to projects</Link></Button>
      </div>
    </div>
  );
}

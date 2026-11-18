import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Search, Shield, MessageSquare, CheckCircle, RotateCcw, AlertTriangle, Palette, Upload, Wallet, Star, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/UserContext';
import { supabase } from '../../lib/supabase';
import { money } from '../../lib/format';
import { useAsync } from '../../lib/useAsync';

function Step({ n, icon: Icon, title, children }: { n: number; icon: typeof Search; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2979FF] flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5" /></div>
        <div className="w-px flex-1 bg-gray-200 mt-2" />
      </div>
      <div className="pb-6">
        <p className="text-xs font-semibold text-[#2979FF] mb-0.5">Step {n}</p>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function Rule({ icon: Icon, title, children }: { icon: typeof Search; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#9333ea] flex items-center justify-center mb-3"><Icon className="w-[18px] h-[18px]" /></div>
      <h3 className="font-semibold text-gray-900 mb-1 text-sm">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </div>
  );
}

/** How hiring, escrow, delivery and payouts work, with the live fee and minimums. */
export function HowItWorks() {
  const { user } = useAuth();
  const config = useAsync(async () => (await supabase.from('app_config').select('platform_fee_bps, min_withdrawal_cents').maybeSingle()).data, []);
  const feePct = (config.data?.platform_fee_bps ?? 0) / 100;
  const minWithdrawal = config.data?.min_withdrawal_cents ?? 1000;

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">How EditMe works</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Hire video editors, animators and colorists for a fixed price. Your money is held in escrow and only reaches the editor when you approve their work.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
        <section>
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">👔 If you're hiring</h2>
          <Step n={1} icon={Search} title="Find an editor">Browse by specialization, price, rating and software. Watch their portfolio and read reviews from finished projects.</Step>
          <Step n={2} icon={Shield} title="Pick a package and pay into escrow">Each editor offers fixed-price packages with a delivery time and a number of revisions. You pay when you hire; EditMe holds the money.</Step>
          <Step n={3} icon={MessageSquare} title="Work together">The editor accepts (or declines, and you're refunded). Share footage and notes in the project chat and follow progress.</Step>
          <Step n={4} icon={CheckCircle} title="Approve and pay">When the work is delivered, approve it to release the payment, or ask for changes within your plan's revisions. Then leave a review.</Step>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">🎨 If you're an editor</h2>
          <Step n={1} icon={Palette} title="Set up your profile">Choose your specialization, add a headline and skills. You get three starter packages to adjust: prices, delivery times, revisions.</Step>
          <Step n={2} icon={Upload} title="Show your work">Upload videos and stills or link YouTube and Vimeo. Clients hire from portfolios.</Step>
          <Step n={3} icon={Lock} title="Accept paid projects only">Every request you see is already paid for and held in escrow, so you never start work on a promise.</Step>
          <Step n={4} icon={Wallet} title="Deliver and get paid">Deliver files or links. When the client approves, the payment moves to your wallet and you can withdraw it.</Step>
        </section>
      </div>

      <h2 className="text-xl font-bold mb-5">The rules that protect both sides</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        <Rule icon={Shield} title="Escrow">
          The price is fixed when you hire and held by EditMe. Nobody can change it afterwards, and it's released only by your approval or a dispute decision.
        </Rule>
        <Rule icon={RotateCcw} title="Refunds">
          If the editor declines, or you cancel before they accept, you get the full amount back. Once work has started, problems go through a dispute.
        </Rule>
        <Rule icon={AlertTriangle} title="Disputes">
          Either side can report a problem while work is in progress or in review. The project pauses, the money stays in escrow, and EditMe staff decide: pay the editor or refund the client.
        </Rule>
        <Rule icon={CheckCircle} title="Revisions">
          Each package includes a set number of change requests (or unlimited). Asking for changes sends the project back to the editor.
        </Rule>
        <Rule icon={Star} title="Honest reviews">
          Only the client of a completed project can review it, once. Ratings can't be bought or edited by editors.
        </Rule>
        <Rule icon={Wallet} title="Fees and payouts">
          {feePct > 0 ? `EditMe keeps ${feePct}% of each payment to editors.` : 'EditMe currently charges no platform fee.'}{' '}
          Editors can withdraw from {money(minWithdrawal)}.
        </Rule>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-[#9333ea] via-[#ec4899] to-[#f97316] text-white p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Ready when you are</h2>
        <p className="opacity-90 mb-5">Profiles marked "Sample" show how EditMe looks; real editors always come first.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-xl bg-white text-gray-900 hover:bg-white/90"><Link to="/">Find an editor</Link></Button>
          <Button asChild variant="outline" className="rounded-xl bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white">
            <Link to={user ? '/profile' : '/sign-up?as=editor'}>Offer your services</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

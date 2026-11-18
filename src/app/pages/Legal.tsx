import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { FileText, Shield, Wallet, Flag } from 'lucide-react';
import { LEGAL } from '../../lib/legal';

/*
 * EditMe's legal documents. They describe what the app actually does
 * (escrow, refunds, disputes, deletion), so change them together with the
 * code. Facts like the company name and contact email live in lib/legal.ts.
 */

const op = LEGAL.operator;

function Contact() {
  return LEGAL.contactEmail
    ? <a href={`mailto:${LEGAL.contactEmail}`} className="text-[#2979FF] hover:underline">{LEGAL.contactEmail}</a>
    : <>the contact details on our <Link to="/help" className="text-[#2979FF] hover:underline">Help page</Link></>;
}

function L({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="text-[#2979FF] hover:underline">{children}</Link>;
}

type Section = { id: string; title: string; body: ReactNode };
type Doc = { path: string; title: string; short: string; icon: typeof FileText; summary: string[]; sections: Section[] };

/* ─────────────────────────── Terms of Service ─────────────────────────── */

const terms: Doc = {
  path: '/terms',
  title: 'Terms of Service',
  short: 'Terms',
  icon: FileText,
  summary: [
    `EditMe is a marketplace. Editors work for clients directly; ${op} runs the platform and holds payments in escrow.`,
    `You must be ${LEGAL.minimumAge} or older and keep your account secure.`,
    'Clients pay up front into escrow. Editors are paid when the client approves the work, or when we decide a dispute in their favour.',
    'Once the client approves and the payment is released, the client owns the delivered work (unless both sides agreed otherwise in writing).',
    'Keep work and payments on EditMe, follow the Acceptable Use Policy, and only upload work you have the right to use.',
  ],
  sections: [
    {
      id: 'about', title: 'About these terms',
      body: <>
        <p>These Terms of Service ("Terms") are an agreement between you and {op} ("EditMe", "we", "us") and apply whenever you use the EditMe website and services ("EditMe"). By creating an account or using EditMe you agree to these Terms, our <L to="/privacy">Privacy Policy</L>, our <L to="/refunds">Payments, Escrow and Refunds Policy</L> and our <L to="/acceptable-use">Acceptable Use Policy</L>, which form part of these Terms.</p>
        <p>If you use EditMe for a business, you agree to these Terms on its behalf and confirm you are allowed to.</p>
      </>,
    },
    {
      id: 'role', title: 'What EditMe does',
      body: <>
        <p>EditMe lets people and businesses ("clients") find and hire freelance video editors, colorists, motion designers, animators, VFX artists and similar creators ("editors").</p>
        <p>When a client hires an editor, the contract for the work is between the client and the editor. {op} is not a party to it and does not employ editors. We provide the platform, hold the client's payment in escrow, release or refund it under these Terms, and decide disputes as described below.</p>
        <p>We don't check every profile, portfolio or claim. Editors marked as verified have been checked by our staff in the way described on their profile. Profiles marked <strong>Sample</strong> are examples of what EditMe looks like; they are not real people and cannot be hired.</p>
      </>,
    },
    {
      id: 'accounts', title: 'Your account',
      body: <>
        <ul>
          <li>You must be at least {LEGAL.minimumAge} years old and able to make a binding contract.</li>
          <li>Give accurate information and keep it up to date. One person, one account, unless we agree otherwise.</li>
          <li>Keep your password private and turn on two-step sign-in if you handle client work or money. You are responsible for what happens under your account; tell us straight away if you think someone else has used it.</li>
          <li>You can use EditMe as a client, an editor, or both, and switch at any time.</li>
        </ul>
      </>,
    },
    {
      id: 'hiring', title: 'Hiring and doing the work',
      body: <>
        <ol>
          <li><strong>Packages.</strong> Editors offer packages with a price, delivery time and number of revisions. When a client hires, the package details and price are fixed for that project and later price changes don't affect it.</li>
          <li><strong>Payment first.</strong> The client pays the full package price into escrow when hiring. Editors only see a project once it is paid for.</li>
          <li><strong>Accepting.</strong> The editor accepts or declines the project. If they decline, or the client cancels before they accept, the client gets a full refund.</li>
          <li><strong>Delivery and revisions.</strong> The editor delivers through EditMe. The client then approves the delivery or requests changes, using the revisions included in the package.</li>
          <li><strong>Approval.</strong> When the client approves, the payment is released to the editor's EditMe wallet, less any platform fee.</li>
          <li><strong>Problems.</strong> Once work has started, either side can report a problem, which opens a dispute (see below).</li>
        </ol>
        <p>Clients must give editors what they need to do the work (footage, instructions, feedback) and respond within a reasonable time. Editors must deliver what the package describes, on time, and in a professional standard, and must tell the client early if they can't.</p>
      </>,
    },
    {
      id: 'payments', title: 'Payments, fees and escrow',
      body: <>
        <p>Payments, refunds, withdrawals and fees are covered in detail in the <L to="/refunds">Payments, Escrow and Refunds Policy</L>. In short:</p>
        <ul>
          <li>Prices are shown before you pay. Clients pay the package price; any platform fee is taken from the editor's payment, and the current fee is shown on <L to="/how-it-works">How it works</L> and before an editor accepts work.</li>
          <li>We hold client payments in escrow until they are released to the editor or refunded. Escrowed money earns no interest for either side.</li>
          <li>Payments are processed by our payment provider. You may also have to accept the provider's terms.</li>
          <li>Editors are responsible for their own taxes on what they earn, and clients for any taxes on what they buy, unless the law says we must collect them.</li>
        </ul>
      </>,
    },
    {
      id: 'off-platform', title: 'Keeping work on EditMe',
      body: <>
        <p>Escrow, reviews and disputes only protect work that is hired and paid for through EditMe. While you have a project on EditMe, and for 12 months after you first meet someone through EditMe, don't ask for or accept payment for work with that person outside EditMe in order to avoid our fees. Sharing large files through links (for example Google Drive or WeTransfer) is fine.</p>
      </>,
    },
    {
      id: 'disputes', title: 'Disputes between clients and editors',
      body: <>
        <p>If something goes wrong after work has started, use "Report a problem" on the project. The payment stays in escrow while EditMe staff look at the project, its messages, deliveries and history, and may ask both sides for more information.</p>
        <p>We then either release the payment to the editor or refund the client, and tell both sides why. We make these decisions in good faith based on what's on EditMe. Our decision settles the payment on EditMe; it does not stop either of you from taking legal action against the other.</p>
      </>,
    },
    {
      id: 'content', title: 'Your content',
      body: <>
        <p>"Content" means anything you upload or write on EditMe: profiles, portfolios, briefs, footage, deliveries, messages and reviews. You keep ownership of your content.</p>
        <p>You give {op} a worldwide, non-exclusive, royalty-free licence to host, store, copy, display and transmit your content only as needed to run, show and improve EditMe, including showing editors' public profiles and portfolios to visitors and showing project files to the other person on that project. This licence ends when your content is deleted, except for copies we must keep (see the <L to="/privacy">Privacy Policy</L>) and content already shared with another person on a project.</p>
        <p>You promise that you have the rights to everything you upload, including footage, music, fonts and images, and that it follows the <L to="/acceptable-use">Acceptable Use Policy</L>.</p>
      </>,
    },
    {
      id: 'ownership', title: 'Who owns the finished work',
      body: <>
        <p>Unless the client and editor agree otherwise in writing in the project chat:</p>
        <ul>
          <li>When the payment for a project is released to the editor, the editor assigns to the client all their rights in the final delivered work, to the extent the law allows. Until then, the editor keeps those rights.</li>
          <li>Materials the client supplied (footage, logos, brand assets) stay the client's.</li>
          <li>Editors keep ownership of their own pre-existing tools, presets, templates and general know-how, and give the client a permanent licence to use any that are built into the delivered work.</li>
          <li>Third-party items in the work (stock footage, music, fonts) stay under their own licences. Editors must tell clients about any licence limits.</li>
          <li>Editors may show the finished work in their portfolio unless the client asks them not to in writing before approval.</li>
        </ul>
      </>,
    },
    {
      id: 'reviews', title: 'Reviews',
      body: <p>After a project is completed, the client can leave one review. Reviews must be honest and about that project. Don't offer or accept anything in exchange for a review, review yourself, or threaten a bad review to get something. We may remove reviews that break these Terms.</p>,
    },
    {
      id: 'our-rights', title: 'EditMe\'s name and software',
      body: <p>EditMe's name, logo, design and software belong to {op} or its licensors. You may use EditMe as offered, but not copy, resell, reverse-engineer or scrape it, or use automated tools to access it, except as the law allows.</p>,
    },
    {
      id: 'suspension', title: 'Suspending or closing accounts',
      body: <>
        <p>You can delete your account at any time in Settings, once no money is in escrow, your wallet is empty and no refund or withdrawal is in progress.</p>
        <p>We may limit, suspend or close an account, remove content or hold a payment if we reasonably believe someone has broken these Terms, the law, or puts others at risk (for example fraud, chargebacks or abuse). Where we can, we'll tell you why and let you respond. Money that belongs to you will be paid out or refunded, less amounts you owe, unless the law or a court order requires us to keep it.</p>
      </>,
    },
    {
      id: 'availability', title: 'Changes and availability',
      body: <p>We work to keep EditMe running and your data safe, but EditMe is provided "as is" and "as available". We may change, add or remove features and may need to pause EditMe for maintenance or reasons outside our control. We'll give notice of major changes where we reasonably can.</p>,
    },
    {
      id: 'liability', title: 'Responsibility and liability',
      body: <>
        <p>Nothing in these Terms limits liability that can't be limited by law, such as for fraud, or for death or personal injury caused by negligence, or your rights as a consumer.</p>
        <p>Subject to that:</p>
        <ul>
          <li>Editors are responsible for their work and clients for their briefs and materials. {op} is not responsible for the quality, legality or timing of work, or for what clients and editors say or do, except for our own obligations to hold and pay out money under these Terms.</li>
          <li>We are not liable for indirect or consequential loss, or for loss of profit, revenue, data or goodwill.</li>
          <li>Our total liability to you in any 12 months is limited to the greater of (a) the fees EditMe received from your projects in that period and (b) 100 US dollars, plus any of your money we are holding.</li>
        </ul>
        <p>You agree to cover {op}'s reasonable losses and costs caused by your content, your breach of these Terms, or your dealings with another user, except where we caused them.</p>
      </>,
    },
    {
      id: 'law', title: 'Governing law and complaints',
      body: <>
        <p>These Terms are governed by the laws of {LEGAL.governingLaw}, and the courts of {LEGAL.governingLaw} have jurisdiction. If you are a consumer living elsewhere, you keep the protection of your local consumer laws and may bring claims in your local courts.</p>
        <p>If you have a complaint about EditMe, contact us first through <Contact /> and we'll try to resolve it.</p>
      </>,
    },
    {
      id: 'changes', title: 'Changes to these terms',
      body: <p>We may update these Terms. If a change is significant we'll tell you by email or on EditMe at least 14 days before it takes effect, unless it's needed sooner for legal or security reasons. Projects already hired continue under the Terms in force when they were hired. If you don't agree with a change you can delete your account; continuing to use EditMe after the change means you accept it.</p>,
    },
    {
      id: 'general', title: 'General',
      body: <p>If any part of these Terms can't be enforced, the rest still applies. If we don't enforce a right straight away, we can still enforce it later. You may not transfer your account or these Terms to someone else without our agreement; we may transfer them as part of a reorganisation or sale of our business, and will tell you if we do. These Terms, with the policies they mention, are the whole agreement between you and {op} about EditMe.</p>,
    },
  ],
};

/* ─────────────────────────── Privacy Policy ─────────────────────────── */

const privacy: Doc = {
  path: '/privacy',
  title: 'Privacy Policy',
  short: 'Privacy',
  icon: Shield,
  summary: [
    'We collect what EditMe needs to work: your account, your profile, your projects and messages, and payment records.',
    'Editor profiles, portfolios and reviews are public. Messages and project files are only seen by the people on that project, and by our staff when needed for support, disputes or safety.',
    'No ads, no tracking cookies, no selling your data.',
    'Your data is stored in the EU (Frankfurt) with our hosting providers.',
    'You can see, correct, download and delete your data. Delete your account in Settings.',
  ],
  sections: [
    {
      id: 'who', title: 'Who we are',
      body: <p>{op === 'EditMe' ? 'We run EditMe and are' : `${op} runs EditMe and is`} responsible ("data controller") for the personal data described here.{LEGAL.address ? ` Our address is ${LEGAL.address}.` : ''} For anything about your data, contact us through <Contact />. This policy applies to the EditMe website and services.</p>,
    },
    {
      id: 'collect', title: 'What we collect',
      body: <>
        <p><strong>You give us:</strong></p>
        <ul>
          <li><strong>Account:</strong> email address, password (stored only as a secure hash; we can't read it), name, and whether you mainly hire or work as an editor.</li>
          <li><strong>If you continue with Google:</strong> Google shares your name, email address and profile photo with us. We never get your Google password or anything else from your Google account.</li>
          <li><strong>Profile:</strong> anything you add, such as photo, username, bio, location, website and company name. Editors also add a headline, specialization, skills, software, rates, packages, availability and portfolio (uploads and video links).</li>
          <li><strong>Projects:</strong> briefs, the package and price, deadlines, progress, deliveries, revision requests, problem reports and reviews.</li>
          <li><strong>Messages:</strong> chat messages and files shared in a project's chat.</li>
          <li><strong>Money:</strong> payments, refunds, wallet balance, withdrawals and payout details. Card and bank details are handled by our payment provider; we don't store full card numbers.</li>
          <li><strong>Support:</strong> what you tell us when you contact us.</li>
        </ul>
        <p><strong>Collected as you use EditMe:</strong></p>
        <ul>
          <li>Editors you save, profiles you view (editors only see view counts, never who viewed), and your notifications.</li>
          <li>Two-step sign-in settings, if you turn them on.</li>
          <li>Technical data: IP address, browser and device type, and sign-in and error logs, kept by our hosting providers for security and to keep EditMe working.</li>
        </ul>
        <p>We don't ask for sensitive data such as health, religion or ethnicity. Please don't put it in your profile or messages.</p>
      </>,
    },
    {
      id: 'use', title: 'How we use it, and why we\'re allowed to',
      body: <>
        <ul>
          <li><strong>To provide EditMe</strong> (accounts, profiles, Discover, hiring, chat, escrow, payouts, notifications): because it's needed for our contract with you.</li>
          <li><strong>To keep EditMe safe</strong> (preventing fraud and abuse, securing accounts, deciding disputes, enforcing our Terms): because of our legitimate interest in a safe, trustworthy marketplace.</li>
          <li><strong>To keep records</strong> (payments, refunds, tax and accounting): because the law requires it.</li>
          <li><strong>To improve EditMe</strong> using totals and patterns, not individual tracking: legitimate interest.</li>
          <li><strong>To email you</strong> about your account and projects (confirmations, password resets, project updates). We'll only send marketing emails if you agree, and you can stop them at any time.</li>
        </ul>
        <p>We don't use your data for advertising, don't sell it, and don't make decisions about you based only on automated processing that have legal or similarly significant effects.</p>
      </>,
    },
    {
      id: 'share', title: 'Who can see your data',
      body: <>
        <ul>
          <li><strong>Everyone:</strong> editor profiles (name, photo, headline, bio, skills, rates, packages, availability, portfolio) and the reviews editors receive.</li>
          <li><strong>The other person on a project:</strong> your name and photo, the project details, messages, files and deliveries for that project.</li>
          <li><strong>EditMe staff:</strong> only when needed for support, a dispute, a problem report or safety, and under confidentiality.</li>
          <li><strong>Service providers</strong> who process data for us under contract: Supabase (database, sign-in, file storage and emails; data stored in Frankfurt, Germany), Vercel (website hosting), our payment provider (payments and payouts), and, if we add one, an email delivery provider. Google Fonts serves the site's fonts, and YouTube and Vimeo receive data when you play a video embedded from them (we use YouTube's privacy-enhanced mode).</li>
          <li><strong>Authorities,</strong> when the law requires it, or to protect people from harm or fraud.</li>
          <li><strong>A buyer,</strong> if EditMe is sold or reorganised, who must keep protecting your data under this policy.</li>
        </ul>
      </>,
    },
    {
      id: 'transfers', title: 'International transfers',
      body: <p>EditMe's database and files are stored in the European Union. Some providers (for example Vercel and our payment provider) may process data in other countries, including the United States. When data leaves your country we use providers that protect it with safeguards the law recognises, such as standard contractual clauses.</p>,
    },
    {
      id: 'keep', title: 'How long we keep it',
      body: <>
        <ul>
          <li><strong>Your account and profile:</strong> until you delete your account.</li>
          <li><strong>When you delete your account:</strong> your profile, photo, portfolio, saved editors and notifications are deleted. Projects, messages and reviews you were part of stay on record for the other person, with your name removed, because they are their records too.</li>
          <li><strong>Payment records:</strong> as long as tax and accounting laws require, usually at least 5 years, even after you delete your account.</li>
          <li><strong>Technical logs:</strong> kept by our hosting providers for a short time, usually days to weeks.</li>
        </ul>
      </>,
    },
    {
      id: 'rights', title: 'Your rights',
      body: <>
        <p>Depending on where you live (including under Kenya's Data Protection Act 2019 and the EU and UK GDPR), you have the right to:</p>
        <ul>
          <li>see the personal data we hold about you and get a copy;</li>
          <li>correct it (most of it you can edit yourself in Profile and Settings);</li>
          <li>delete it (Settings → Delete account), subject to the records we must keep;</li>
          <li>get it in a portable format;</li>
          <li>object to or ask us to restrict some uses; and</li>
          <li>withdraw consent you've given, at any time.</li>
        </ul>
        <p>To use these rights, contact us through <Contact />. We'll reply within one month and may need to confirm it's you. You can also complain to {LEGAL.regulator} or the data protection authority where you live.</p>
      </>,
    },
    {
      id: 'storage', title: 'Cookies and local storage',
      body: <>
        <p>EditMe does not use advertising or tracking cookies, so there is no cookie banner. We use your browser's storage only for things EditMe needs to work:</p>
        <ul>
          <li>keeping you signed in (your sign-in session);</li>
          <li>remembering whether you last used EditMe as a client or an editor; and</li>
          <li>small display preferences, such as whether the Discover filters are open.</li>
        </ul>
        <p>Signing out removes your session. Clearing your browser's site data removes the rest. Embedded YouTube or Vimeo videos may set their own storage when you play them.</p>
      </>,
    },
    {
      id: 'security', title: 'Security',
      body: <p>We protect your data with encrypted connections (HTTPS), access rules in the database that limit each person to their own data, private storage for project files, optional two-step sign-in, and limited staff access. No system is perfectly secure; if a breach affects your data we'll tell you and the regulator as the law requires.</p>,
    },
    {
      id: 'children', title: 'Children',
      body: <p>EditMe is for people aged {LEGAL.minimumAge} and over. We don't knowingly collect data from children. If you think a child has an account, contact us and we'll delete it.</p>,
    },
    {
      id: 'changes', title: 'Changes to this policy',
      body: <p>We'll update this policy when what we do with data changes, and tell you about significant changes by email or on EditMe before they take effect.</p>,
    },
  ],
};

/* ─────────────────────── Payments, escrow and refunds ─────────────────────── */

const refunds: Doc = {
  path: '/refunds',
  title: 'Payments, Escrow and Refunds Policy',
  short: 'Payments & refunds',
  icon: Wallet,
  summary: [
    'Clients pay the full package price into escrow when they hire.',
    'Full refund if the editor declines or the client cancels before the editor accepts.',
    'After work starts, money only moves when the client approves, or when EditMe decides a reported problem.',
    'Editors withdraw approved earnings from their wallet.',
  ],
  sections: [
    {
      id: 'paying', title: 'Paying for a project',
      body: <>
        <p>When you hire an editor you pay the full price of the package you chose. The price, currency and anything else you'll be charged are shown before you pay. Payments are processed by our payment provider; we don't see or store your full card details.</p>
        <p>Your payment is held in escrow by {op}. It is not paid to the editor until it is released under this policy.</p>
      </>,
    },
    {
      id: 'refunds', title: 'Refunds',
      body: <>
        <table>
          <thead><tr><th>What happens</th><th>Refund</th></tr></thead>
          <tbody>
            <tr><td>The editor declines the project</td><td>Full refund, automatically</td></tr>
            <tr><td>You cancel before the editor accepts</td><td>Full refund, automatically</td></tr>
            <tr><td>Work has started and something goes wrong</td><td>Report a problem. EditMe decides: full refund, or payment to the editor</td></tr>
            <tr><td>You approved the delivery</td><td>No refund: approving releases the payment to the editor</td></tr>
          </tbody>
        </table>
        <p>Refunds go back to the original payment method. They are started straight away, but your bank or card provider may take up to 10 working days to show them. The payment provider's own fees may not be refundable where the provider doesn't return them to us; if so, we'll show this before you pay.</p>
      </>,
    },
    {
      id: 'approval', title: 'Approving work',
      body: <p>Check deliveries carefully before approving. Approving tells us the work is complete and releases the payment to the editor; it can't be undone. If the delivery isn't right, request changes (using the package's revisions) or report a problem instead.</p>,
    },
    {
      id: 'disputes', title: 'Reported problems (disputes)',
      body: <>
        <p>Either side can report a problem while work is in progress or in review. Explain what's wrong; the money stays in escrow. EditMe staff review the brief, package, messages, deliveries and project history, may ask both sides for information, and then either refund the client or pay the editor. We aim to decide within 10 working days of having what we need.</p>
        <p>We consider whether the delivery matches the package and brief, whether deadlines and revisions were respected, and how both sides communicated. Please keep project communication on EditMe so we can see it.</p>
      </>,
    },
    {
      id: 'chargebacks', title: 'Chargebacks',
      body: <p>Please report a problem on EditMe before asking your bank to reverse a payment. If you start a chargeback for money that has already been released or refunded, we may suspend your account while it's resolved and recover the amount from you.</p>,
    },
    {
      id: 'editors', title: 'For editors: earnings and withdrawals',
      body: <>
        <ul>
          <li>When a payment is released, the price minus EditMe's platform fee is added to your wallet. The current fee is shown on <L to="/how-it-works">How it works</L>; the fee that applies is the one in force when the client hired you.</li>
          <li>You can withdraw your available balance to your payout method once it reaches the minimum shown in your Wallet. Withdrawals are usually processed within a few working days; your bank may take longer.</li>
          <li>Payout providers may charge their own fees, which we'll show before you withdraw.</li>
          <li>We may hold a payout while we look into a dispute, a chargeback or suspected fraud, and will tell you why.</li>
          <li>You are responsible for taxes on your earnings.</li>
        </ul>
      </>,
    },
    {
      id: 'contact', title: 'Questions',
      body: <p>For anything about a payment, open the project and use "Report a problem", or contact us through <Contact />.</p>,
    },
  ],
};

/* ─────────────────────────── Acceptable use ─────────────────────────── */

const acceptableUse: Doc = {
  path: '/acceptable-use',
  title: 'Acceptable Use Policy',
  short: 'Acceptable use',
  icon: Flag,
  summary: [
    'Be honest and professional; treat people with respect.',
    'Only upload work you have the right to use.',
    'No illegal, sexual, hateful or violent content, no scams, and no spam.',
    'Report problems to us; we may remove content or close accounts that break these rules.',
  ],
  sections: [
    {
      id: 'people', title: 'Treat people well',
      body: <ul>
        <li>No harassment, threats, bullying, or discrimination based on race, ethnicity, nationality, religion, gender, sexual orientation, disability or age.</li>
        <li>Don't share someone else's personal information without their permission.</li>
        <li>Don't impersonate anyone, or misrepresent who you are, your skills or your past work.</li>
      </ul>,
    },
    {
      id: 'content', title: 'Content that isn\'t allowed',
      body: <>
        <p>You may not upload, request or create through EditMe anything that:</p>
        <ul>
          <li>is illegal, or promotes or helps illegal activity;</li>
          <li>sexually exploits or endangers children, in any form (we report it to the authorities);</li>
          <li>is pornographic or sexually explicit;</li>
          <li>promotes terrorism or violent extremism, or glorifies violence;</li>
          <li>is hate speech;</li>
          <li>is deliberately deceptive, such as deepfakes or edited footage of real people meant to mislead, or election misinformation;</li>
          <li>includes another person's likeness or voice in a way they haven't agreed to; or</li>
          <li>contains malware or anything designed to harm devices or accounts.</li>
        </ul>
      </>,
    },
    {
      id: 'ip', title: 'Respect copyright',
      body: <>
        <p>Only upload footage, music, fonts, images and portfolio pieces you own or have permission to use, and say so if a portfolio piece was a team project. Editors must not use unlicensed stock, music or plug-ins in client work.</p>
        <p><strong>Copyright complaints.</strong> If you believe content on EditMe infringes your copyright, contact us through <Contact /> with: the content's location on EditMe, the work you own, your contact details, and a statement that you believe in good faith the use isn't authorised and that your notice is accurate. We'll remove infringing content and may close the accounts of repeat infringers. If your content was removed and you believe that was a mistake, you can reply with an explanation.</p>
      </>,
    },
    {
      id: 'platform', title: 'Fair use of the platform',
      body: <ul>
        <li>No fake accounts, fake reviews, or trading reviews.</li>
        <li>No taking payments outside EditMe to avoid fees (see the <L to="/terms">Terms</L>).</li>
        <li>No spam, unsolicited advertising, or mass messaging.</li>
        <li>No scams, phishing, or asking for passwords, codes or payment details.</li>
        <li>No scraping, automated access, overloading, or trying to get around security or access rules.</li>
      </ul>,
    },
    {
      id: 'report', title: 'Reporting and enforcement',
      body: <p>For a problem with a project, use "Report a problem" on it. For anything else, contact us through <Contact />. We may remove content, limit features, hold payments while we investigate, or suspend or close accounts that break this policy, depending on how serious it is. Where the law requires it, we report illegal content to the authorities.</p>,
    },
  ],
};

export const legalDocs = [terms, privacy, refunds, acceptableUse];

function LegalNav() {
  return (
    <nav aria-label="Legal" className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
      {legalDocs.map((d) => (
        <NavLink key={d.path} to={d.path}
          className={({ isActive }) => `flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-xl text-sm transition-colors ${
            isActive ? 'bg-[#EFF6FF] text-[#2979FF] font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
          <d.icon className="w-4 h-4 flex-shrink-0" />{d.short}
        </NavLink>
      ))}
    </nav>
  );
}

function LegalDoc({ doc }: { doc: Doc }) {
  const { hash } = useLocation();
  useEffect(() => {
    const previous = document.title;
    document.title = `${doc.title} · EditMe`;
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
    return () => { document.title = previous; };
  }, [doc, hash]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 lg:grid lg:grid-cols-[200px_1fr] lg:gap-10">
      <aside className="mb-6 lg:mb-0 lg:sticky lg:top-24 lg:self-start">
        <p className="hidden lg:block text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Legal</p>
        <LegalNav />
      </aside>

      <article className="min-w-0 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{doc.title}</h1>
        <p className="text-sm text-gray-500 mt-2">In effect from {LEGAL.effective}</p>

        <div className="mt-6 rounded-2xl bg-[#EFF6FF] border border-blue-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">The short version</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {doc.summary.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <p className="text-xs text-gray-500 mt-3">This summary is here to help; the full text below is what applies.</p>
        </div>

        <details className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 text-sm">
          <summary className="cursor-pointer font-medium text-gray-700">Contents</summary>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            {doc.sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="text-[#2979FF] hover:underline">{s.title}</a></li>)}
          </ol>
        </details>

        <div className="legal-body mt-8 space-y-8">
          {doc.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{i + 1}. {s.title}</h2>
              <div className="space-y-3 text-[15px] leading-relaxed text-gray-700">{s.body}</div>
            </section>
          ))}
        </div>

        <p className="mt-12 pt-6 border-t border-gray-100 text-sm text-gray-500">
          Questions about this page? Contact us through <Contact />.
        </p>
      </article>
    </div>
  );
}

export const Terms = () => <LegalDoc doc={terms} />;
export const Privacy = () => <LegalDoc doc={privacy} />;
export const Refunds = () => <LegalDoc doc={refunds} />;
export const AcceptableUse = () => <LegalDoc doc={acceptableUse} />;

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';

const MEMBERS = [
  {
    id: 'M-10482',
    name: 'Mara Ellison',
    type: 'Primary member',
    status: 'Active',
    joined: 'Mar 12, 2019',
    phone: '(415) 555-0198',
    email: 'mara.ellison@example.test',
    accounts: [
      { name: 'Everyday Checking', number: '•••• 4821', type: 'Checking', balance: '$8,420.16', available: '$8,120.16' },
      { name: 'Rainy Day Savings', number: '•••• 1137', type: 'Savings', balance: '$14,805.42', available: '$14,805.42' },
      { name: 'Travel Rewards', number: '•••• 9004', type: 'Credit', balance: '$1,240.38', available: '$8,759.62' },
    ],
  },
  {
    id: 'M-20871',
    name: 'Jon Bell',
    type: 'Primary member',
    status: 'Active',
    joined: 'Oct 04, 2021',
    phone: '(628) 555-0142',
    email: 'jon.bell@example.test',
    accounts: [
      { name: 'Everyday Checking', number: '•••• 3810', type: 'Checking', balance: '$2,105.80', available: '$2,105.80' },
      { name: 'Home Improvement', number: '•••• 7612', type: 'Loan', balance: '$18,450.00', available: '$18,450.00' },
    ],
  },
  {
    id: 'M-31706',
    name: 'Priya Nair',
    type: 'Primary member',
    status: 'Review',
    joined: 'Jun 27, 2023',
    phone: '(510) 555-0127',
    email: 'priya.nair@example.test',
    accounts: [
      { name: 'Everyday Checking', number: '•••• 6654', type: 'Checking', balance: '$6,730.22', available: '$6,730.22' },
    ],
  },
];

const CREDENTIALS = { username: 'memberops', password: 'northstar' };

function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('lookup');
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState(MEMBERS);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  function handleLogin(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get('username') !== CREDENTIALS.username || data.get('password') !== CREDENTIALS.password) {
      setLoginError('Invalid operator credentials. Try the demo credentials shown below.');
      return;
    }
    setLoginError('');
    setSession({ username: CREDENTIALS.username });
  }

  function searchMembers(event) {
    event.preventDefault();
    const normalized = query.trim().toLowerCase();
    const results = members.filter((member) =>
      member.id.toLowerCase().includes(normalized) || member.name.toLowerCase().includes(normalized),
    );
    setSuccess('');
    if (!normalized || results.length === 0) {
      setLookupError('Member Not Found: enter a valid member ID or full name.');
      return;
    }
    setLookupError('');
    setMembers(results);
  }

  function resetSearch() {
    setQuery('');
    setLookupError('');
    setMembers(MEMBERS);
  }

  function openMember(member) {
    setSelectedMember(member);
    setView('details');
    setSuccess('');
  }

  function createAccount(event) {
    event.preventDefault();
    setFormError('');
    setSuccess('');
    const data = new FormData(event.currentTarget);
    const name = data.get('accountName').trim();
    const type = data.get('accountType');
    if (!selectedMember) {
      setFormError('Member Not Found: return to lookup and select a member before creating an account.');
      return;
    }
    if (!name) {
      setFormError('Account name is required.');
      return;
    }
    if (selectedMember.accounts.some((account) => account.name.toLowerCase() === name.toLowerCase())) {
      setFormError('Duplicate Account Name: this member already has an account with that name.');
      return;
    }
    const account = { name, type, number: '•••• 0000', balance: '$0.00', available: '$0.00' };
    const updatedMember = { ...selectedMember, accounts: [...selectedMember.accounts, account] };
    setSelectedMember(updatedMember);
    setMembers((current) => current.map((member) => member.id === updatedMember.id ? updatedMember : member));
    setSuccess(`${name} was created for ${updatedMember.name}.`);
    event.currentTarget.reset();
    setView('details');
  }

  if (!session) return <LoginScreen onSubmit={handleLogin} error={loginError} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><span className="brand-mark"><Banknote size={19} /></span><span>northstar<span className="brand-dot">.</span></span></div>
        <div className="institution"><span>OPERATIONS CONSOLE</span><strong>Member Services</strong></div>
        <nav aria-label="Primary navigation">
          <button className={view === 'lookup' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('lookup'); setSuccess(''); }}><Search size={17} /> Member lookup</button>
          <button className={view === 'details' ? 'nav-item active' : 'nav-item'} onClick={() => selectedMember && setView('details')} disabled={!selectedMember}><UserRound size={17} /> Member details</button>
          <button className={view === 'create' ? 'nav-item active' : 'nav-item'} onClick={() => selectedMember && setView('create')} disabled={!selectedMember}><Plus size={17} /> New account</button>
        </nav>
        <div className="sidebar-footer"><div className="secure-note"><ShieldCheck size={16} /><span>Local training environment<br /><small>No live member data</small></span></div><button className="sign-out" onClick={() => { setSession(null); setSelectedMember(null); }}><LogOut size={15} /> Sign out</button></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div><span className="breadcrumb">Member Services <ChevronRight size={13} /> {view === 'lookup' ? 'Lookup' : view === 'details' ? 'Member details' : 'New account'}</span><h1>{view === 'lookup' ? 'Find a member' : view === 'details' ? selectedMember?.name : 'Create an account'}</h1></div><div className="operator"><span className="operator-avatar">MO</span><span><strong>Member Ops</strong><small>Signed in as {session.username}</small></span></div></header>
        {success && <div className="banner success" role="status"><Check size={18} /><span>{success}</span><button aria-label="Dismiss success message" onClick={() => setSuccess('')}><X size={16} /></button></div>}
        {view === 'lookup' && <LookupView query={query} setQuery={setQuery} onSearch={searchMembers} onReset={resetSearch} error={lookupError} members={members} onSelect={openMember} />}
        {view === 'details' && selectedMember && <DetailsView member={selectedMember} onBack={() => setView('lookup')} onCreate={() => { setFormError(''); setView('create'); }} />}
        {view === 'create' && selectedMember && <CreateView member={selectedMember} onSubmit={createAccount} onBack={() => setView('details')} error={formError} />}
      </main>
    </div>
  );
}

function LoginScreen({ onSubmit, error }) {
  return <main className="login-screen"><div className="login-art"><div className="art-grid" /><div className="art-copy"><span className="eyebrow">NORTHSTAR CREDIT UNION</span><h1>Clear answers for every member conversation.</h1><p>A contained operations console for practicing safe, repeatable service workflows.</p><div className="art-rule" /><span className="art-meta">TRAINING INSTANCE / 01</span></div></div><section className="login-panel"><div className="login-brand"><span className="brand-mark"><Banknote size={19} /></span><span>northstar<span className="brand-dot">.</span></span></div><div className="login-heading"><span className="eyebrow">OPERATOR ACCESS</span><h2>Welcome back.</h2><p>Sign in to access the member services console.</p></div>{error && <div className="banner error" role="alert"><CircleAlert size={18} /><span>{error}</span></div>}<form className="login-form" onSubmit={onSubmit}><label htmlFor="username">Operator ID<input id="username" name="username" autoComplete="username" placeholder="Enter your operator ID" /></label><label htmlFor="password">Passphrase<input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your passphrase" /></label><button className="primary-button" type="submit">Sign in <ArrowRight size={17} /></button></form><div className="demo-credentials"><span>DEMO ACCESS</span><code>memberops</code><code>northstar</code></div><p className="login-footnote"><ShieldCheck size={14} /> Protected local demo environment</p></section></main>;
}

function LookupView({ query, setQuery, onSearch, onReset, error, members, onSelect }) {
  return <section className="content-section"><div className="section-intro"><div><span className="eyebrow">DIRECTORY / 01</span><h2>Search the member directory</h2><p>Use a member ID or name to open the servicing record.</p></div><span className="record-count">{members.length} records</span></div><form className="lookup-form" onSubmit={onSearch}><label htmlFor="member-search"><span className="sr-only">Member ID or name</span><Search size={18} /><input id="member-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try M-10482 or Mara Ellison" /></label><button className="primary-button" type="submit">Search <ArrowRight size={17} /></button><button className="text-button" type="button" onClick={onReset}>Clear</button></form>{error && <div className="banner error" role="alert"><CircleAlert size={18} /><span>{error}</span></div>}<div className="results-heading"><span>MEMBER RECORDS</span><span>STATUS</span></div><div className="member-list">{members.map((member) => <button className="member-row" key={member.id} onClick={() => onSelect(member)}><span className="member-avatar">{member.name.split(' ').map((part) => part[0]).join('')}</span><span className="member-summary"><strong>{member.name}</strong><small>{member.id} <i /> {member.email}</small></span><span className={member.status === 'Active' ? 'status active-status' : 'status review-status'}><span />{member.status}</span><ArrowRight size={17} /></button>)}</div><div className="legacy-callout"><div className="callout-icon"><ClipboardList size={19} /></div><div><strong>Legacy core connection ready</strong><p>Results are rendered from a stable local fixture with table nesting and repeatable error states for automation discovery.</p></div><span className="callout-code">LOCAL / CORE-01</span></div></section>;
}

function DetailsView({ member, onBack, onCreate }) {
  return <section className="content-section"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to lookup</button><div className="member-header"><div className="large-avatar">{member.name.split(' ').map((part) => part[0]).join('')}</div><div><span className="eyebrow">MEMBER RECORD / {member.id}</span><h2>{member.name}</h2><p>{member.type} <span className="separator">|</span> Joined {member.joined}</p></div><span className="status active-status"><span />{member.status}</span></div><div className="profile-strip"><div><span>PHONE</span><strong>{member.phone}</strong></div><div><span>EMAIL</span><strong>{member.email}</strong></div><div><span>MEMBER ID</span><strong>{member.id}</strong></div></div><div className="accounts-heading"><div><span className="eyebrow">ACCOUNT PORTFOLIO</span><h3>Accounts & balances</h3></div><button className="primary-button compact" onClick={onCreate}><Plus size={16} /> New account</button></div><div className="legacy-table-wrap"><table className="accounts-table"><thead><tr><th>ACCOUNT NAME</th><th>ACCOUNT TYPE</th><th>ACCOUNT NUMBER</th><th>CURRENT BALANCE</th><th>AVAILABLE</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{member.accounts.map((account) => <tr key={`${account.name}-${account.number}`}><td><strong>{account.name}</strong></td><td><span className="type-tag">{account.type}</span></td><td>{account.number}</td><td><strong>{account.balance}</strong></td><td>{account.available}</td><td><button className="icon-button" aria-label={`Open ${account.name}`}><ChevronRight size={16} /></button></td></tr>)}</tbody></table></div><div className="iframe-note"><span className="signal-dot" /><span>Core system status: <strong>Connected</strong></span><span className="divider" /><span>Last refreshed: just now</span></div></section>;
}

function CreateView({ member, onSubmit, onBack, error }) {
  return <section className="content-section narrow-section"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to {member.name}</button><div className="section-intro"><div><span className="eyebrow">ACCOUNT SERVICING / 03</span><h2>Create a new account</h2><p>Add a sub-account to the selected member profile.</p></div><span className="member-chip"><UserRound size={14} /> {member.id}</span></div>{error && <div className="banner error" role="alert"><CircleAlert size={18} /><span>{error}</span></div>}<form className="account-form" onSubmit={onSubmit}><div className="form-context"><span className="context-label">CREATING FOR</span><strong>{member.name}</strong><span>{member.id} · {member.accounts.length} existing accounts</span></div><label htmlFor="account-name">Account name<input id="account-name" name="accountName" placeholder="e.g. Emergency Fund" /></label><label htmlFor="account-type">Account type<select id="account-type" name="accountType" defaultValue="Savings"><option>Checking</option><option>Savings</option><option>Money Market</option><option>Credit</option></select></label><div className="form-note"><CircleAlert size={16} /><span>New accounts begin with a $0.00 balance in this training instance.</span></div><div className="form-actions"><button className="text-button" type="button" onClick={onBack}>Cancel</button><button className="primary-button" type="submit"><Check size={17} /> Create account</button></div></form></section>;
}

export default App;

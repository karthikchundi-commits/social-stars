'use client';

import { useEffect, useState } from 'react';
import {
  Plus, Pencil, Trash2, Check, X, Users, Tag, Percent,
  CreditCard, ChevronDown, ChevronUp, Save, AlertCircle,
  MapPin, Globe,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description?: string;
  pricePerMonth: number;
  features: string[];
  isActive: boolean;
  _count?: { subscriptions: number };
}

interface FamilyRow {
  therapistFamilyId: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  linkedAt: string;
  subscription: {
    id: string;
    planId: string | null;
    discountPercent: number;
    customPrice: number | null;
    status: string;
    notes: string | null;
    plan: Plan | null;
  } | null;
}

interface GroupDiscount {
  id: string;
  name: string;
  minFamilies: number;
  discountPercent: number;
  isActive: boolean;
  plan: { id: string; name: string } | null;
}

interface Profile {
  name: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
}

export default function TherapistBillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [groupDiscounts, setGroupDiscounts] = useState<GroupDiscount[]>([]);
  const [activeFamilyCount, setActiveFamilyCount] = useState(0);
  const [applicableGroupDiscount, setApplicableGroupDiscount] = useState<GroupDiscount | null>(null);
  const [profile, setProfile] = useState<Profile>({ name: '' });
  const [tab, setTab] = useState<'plans' | 'families' | 'groups' | 'profile'>('plans');
  const [loading, setLoading] = useState(true);

  // Plan form
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planFeatures, setPlanFeatures] = useState('');
  const [planSaving, setPlanSaving] = useState(false);

  // Group discount form
  const [showGdForm, setShowGdForm] = useState(false);
  const [gdName, setGdName] = useState('');
  const [gdMin, setGdMin] = useState('');
  const [gdPercent, setGdPercent] = useState('');
  const [gdPlanId, setGdPlanId] = useState('');
  const [gdSaving, setGdSaving] = useState(false);

  // Profile form
  const [profileCity, setProfileCity] = useState('');
  const [profileState, setProfileState] = useState('');
  const [profileCountry, setProfileCountry] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Inline family subscription editing
  const [editingFamily, setEditingFamily] = useState<string | null>(null);
  const [familyPlanId, setFamilyPlanId] = useState('');
  const [familyDiscount, setFamilyDiscount] = useState('');
  const [familyCustomPrice, setFamilyCustomPrice] = useState('');
  const [familyNotes, setFamilyNotes] = useState('');
  const [familyStatus, setFamilyStatus] = useState('active');
  const [familySaving, setFamilySaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [plansRes, familiesRes, gdRes, profileRes] = await Promise.all([
      fetch('/api/therapist/billing/plans'),
      fetch('/api/therapist/billing/subscriptions'),
      fetch('/api/therapist/billing/group-discounts'),
      fetch('/api/therapist/profile'),
    ]);
    const [plansData, familiesData, gdData, profileData] = await Promise.all([
      plansRes.json(), familiesRes.json(), gdRes.json(), profileRes.json(),
    ]);

    setPlans((plansData.plans ?? []).map((p: any) => ({
      ...p, features: JSON.parse(p.features ?? '[]'),
    })));
    setFamilies(familiesData.families ?? []);
    setActiveFamilyCount(familiesData.activeFamilyCount ?? 0);
    setApplicableGroupDiscount(familiesData.applicableGroupDiscount ?? null);
    setGroupDiscounts(gdData.discounts ?? []);

    if (profileData.profile) {
      const p = profileData.profile;
      setProfile(p);
      setProfileCity(p.city ?? '');
      setProfileState(p.state ?? '');
      setProfileCountry(p.country ?? '');
      setProfileBio(p.bio ?? '');
    }
    setLoading(false);
  };

  /* ── Plan CRUD ─── */
  const openNewPlan = () => {
    setEditingPlan(null);
    setPlanName(''); setPlanDesc(''); setPlanPrice(''); setPlanFeatures('');
    setShowPlanForm(true);
  };
  const openEditPlan = (p: Plan) => {
    setEditingPlan(p);
    setPlanName(p.name);
    setPlanDesc(p.description ?? '');
    setPlanPrice(String(p.pricePerMonth));
    setPlanFeatures(p.features.join('\n'));
    setShowPlanForm(true);
  };
  const savePlan = async () => {
    setPlanSaving(true);
    const body = {
      ...(editingPlan && { id: editingPlan.id }),
      name: planName,
      description: planDesc,
      pricePerMonth: parseFloat(planPrice) || 0,
      features: planFeatures.split('\n').map((f) => f.trim()).filter(Boolean),
    };
    await fetch('/api/therapist/billing/plans', {
      method: editingPlan ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setPlanSaving(false);
    setShowPlanForm(false);
    fetchAll();
  };
  const deletePlan = async (id: string) => {
    if (!confirm('Delete this plan? Families on it will lose their assignment.')) return;
    await fetch('/api/therapist/billing/plans', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchAll();
  };
  const togglePlanActive = async (p: Plan) => {
    await fetch('/api/therapist/billing/plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
    });
    fetchAll();
  };

  /* ── Family subscription ─── */
  const openEditFamily = (f: FamilyRow) => {
    setEditingFamily(f.parentId);
    setFamilyPlanId(f.subscription?.planId ?? '');
    setFamilyDiscount(String(f.subscription?.discountPercent ?? 0));
    setFamilyCustomPrice(f.subscription?.customPrice != null ? String(f.subscription.customPrice) : '');
    setFamilyNotes(f.subscription?.notes ?? '');
    setFamilyStatus(f.subscription?.status ?? 'active');
  };
  const saveFamilySubscription = async (parentId: string) => {
    setFamilySaving(true);
    await fetch('/api/therapist/billing/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId,
        planId: familyPlanId || null,
        discountPercent: parseFloat(familyDiscount) || 0,
        customPrice: familyCustomPrice ? parseFloat(familyCustomPrice) : null,
        notes: familyNotes || null,
        status: familyStatus,
      }),
    });
    setFamilySaving(false);
    setEditingFamily(null);
    fetchAll();
  };

  /* ── Group discounts ─── */
  const saveGroupDiscount = async () => {
    setGdSaving(true);
    await fetch('/api/therapist/billing/group-discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: gdName,
        minFamilies: parseInt(gdMin),
        discountPercent: parseFloat(gdPercent),
        planId: gdPlanId || null,
      }),
    });
    setGdSaving(false);
    setShowGdForm(false);
    setGdName(''); setGdMin(''); setGdPercent(''); setGdPlanId('');
    fetchAll();
  };
  const deleteGroupDiscount = async (id: string) => {
    await fetch('/api/therapist/billing/group-discounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchAll();
  };
  const toggleGdActive = async (gd: GroupDiscount) => {
    await fetch('/api/therapist/billing/group-discounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: gd.id, isActive: !gd.isActive }),
    });
    fetchAll();
  };

  /* ── Profile ─── */
  const saveProfile = async () => {
    setProfileSaving(true);
    await fetch('/api/therapist/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: profileCity, state: profileState, country: profileCountry, bio: profileBio }),
    });
    setProfileSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
    fetchAll();
  };

  const effectivePrice = (f: FamilyRow) => {
    if (!f.subscription) return null;
    const base = f.subscription.customPrice ?? f.subscription.plan?.pricePerMonth ?? 0;
    return base * (1 - (f.subscription.discountPercent ?? 0) / 100);
  };

  if (loading) return <div className="p-8 text-purple-600 font-bold text-xl">Loading...</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-purple-600 mb-1">Billing & Plans</h1>
          <p className="text-gray-500">Design subscription plans, set discounts, and manage family billing.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{plans.filter(p => p.isActive).length}</div>
            <div className="text-xs text-gray-500 mt-1">Active Plans</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{activeFamilyCount}</div>
            <div className="text-xs text-gray-500 mt-1">Enrolled Families</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              ${families.reduce((s, f) => s + (effectivePrice(f) ?? 0), 0).toFixed(0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Monthly Revenue</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            {applicableGroupDiscount ? (
              <>
                <div className="text-3xl font-bold text-orange-500">{applicableGroupDiscount.discountPercent}%</div>
                <div className="text-xs text-gray-500 mt-1">Group Discount Active</div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-300">—</div>
                <div className="text-xs text-gray-500 mt-1">No Group Discount</div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 mb-8 w-fit">
          {(['plans', 'families', 'groups', 'profile'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                tab === t ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'groups' ? 'Group Discounts' : t === 'profile' ? 'My Profile' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── PLANS TAB ── */}
        {tab === 'plans' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Subscription Plans</h2>
              <button
                onClick={openNewPlan}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700 transition-all"
              >
                <Plus className="w-4 h-4" /> New Plan
              </button>
            </div>

            {showPlanForm && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-purple-700 mb-4">{editingPlan ? 'Edit Plan' : 'New Plan'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Plan Name *</label>
                    <input value={planName} onChange={(e) => setPlanName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      placeholder="e.g. Basic, Standard, Premium" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Price / month ($)</label>
                    <input type="number" min="0" value={planPrice} onChange={(e) => setPlanPrice(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      placeholder="0" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Description</label>
                    <input value={planDesc} onChange={(e) => setPlanDesc(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      placeholder="Brief description shown to parents" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Features (one per line)</label>
                    <textarea value={planFeatures} onChange={(e) => setPlanFeatures(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      placeholder={"Weekly therapy session\nAll 50+ activities\nProgress reports"} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={savePlan} disabled={!planName || planSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 hover:bg-purple-700 transition-all">
                    <Save className="w-4 h-4" /> {planSaving ? 'Saving...' : 'Save Plan'}
                  </button>
                  <button onClick={() => setShowPlanForm(false)}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {plans.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No plans yet. Create your first plan.</p>
                </div>
              )}
              {plans.map((plan) => (
                <div key={plan.id} className={`bg-white rounded-2xl border-2 p-5 ${plan.isActive ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-60'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-gray-900 text-lg">{plan.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-gray-400">{plan._count?.subscriptions ?? 0} families</span>
                      </div>
                      {plan.description && <p className="text-sm text-gray-500 mb-2">{plan.description}</p>}
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-3xl font-extrabold text-gray-900">${plan.pricePerMonth}</span>
                        <span className="text-gray-400 text-sm">/mo</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {plan.features.map((f, i) => (
                          <span key={i} className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg">
                            <Check className="w-3 h-3" /> {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => togglePlanActive(plan)} title={plan.isActive ? 'Deactivate' : 'Activate'}
                        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-all">
                        {plan.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEditPlan(plan)}
                        className="p-2 rounded-xl border border-gray-200 hover:bg-purple-50 text-gray-500 hover:text-purple-600 transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deletePlan(plan.id)}
                        className="p-2 rounded-xl border border-gray-200 hover:bg-red-50 text-gray-500 hover:text-red-600 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FAMILIES TAB ── */}
        {tab === 'families' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Family Subscriptions</h2>
              <span className="text-sm text-gray-500">{activeFamilyCount} enrolled</span>
            </div>

            {applicableGroupDiscount && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
                <Tag className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div>
                  <span className="font-bold text-orange-700">Group Discount Active: </span>
                  <span className="text-orange-600">{applicableGroupDiscount.name} — {applicableGroupDiscount.discountPercent}% off for {activeFamilyCount}+ families</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {families.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No families enrolled yet.</p>
                </div>
              )}
              {families.map((f) => (
                <div key={f.parentId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-gray-900">{f.parentName ?? 'Parent'}</span>
                          <span className="text-xs text-gray-400">{f.parentEmail}</span>
                          {f.subscription ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              f.subscription.status === 'active' ? 'bg-green-100 text-green-700' :
                              f.subscription.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>{f.subscription.status}</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500">No plan</span>
                          )}
                        </div>
                        {f.subscription?.plan && (
                          <div className="mt-1 flex items-center gap-3 text-sm">
                            <span className="text-purple-600 font-semibold">{f.subscription.plan.name}</span>
                            {f.subscription.discountPercent > 0 && (
                              <span className="text-orange-600 font-semibold">{f.subscription.discountPercent}% off</span>
                            )}
                            <span className="text-gray-900 font-bold">
                              ${effectivePrice(f)?.toFixed(2)}/mo
                              {f.subscription.discountPercent > 0 && (
                                <span className="text-gray-400 line-through ml-1 font-normal text-xs">
                                  ${(f.subscription.customPrice ?? f.subscription.plan.pricePerMonth).toFixed(2)}
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => editingFamily === f.parentId ? setEditingFamily(null) : openEditFamily(f)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        {editingFamily === f.parentId ? 'Cancel' : 'Edit'}
                        {editingFamily === f.parentId ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {editingFamily === f.parentId && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-1 block">Assign Plan</label>
                          <select value={familyPlanId} onChange={(e) => setFamilyPlanId(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white">
                            <option value="">— No plan —</option>
                            {plans.filter(p => p.isActive).map((p) => (
                              <option key={p.id} value={p.id}>{p.name} (${p.pricePerMonth}/mo)</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-1 block">Discount %</label>
                          <input type="number" min="0" max="100" value={familyDiscount} onChange={(e) => setFamilyDiscount(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                            placeholder="0" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-1 block">Custom Price (optional)</label>
                          <input type="number" min="0" value={familyCustomPrice} onChange={(e) => setFamilyCustomPrice(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                            placeholder="Override plan price" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-1 block">Status</label>
                          <select value={familyStatus} onChange={(e) => setFamilyStatus(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white">
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-gray-600 mb-1 block">Notes</label>
                          <input value={familyNotes} onChange={(e) => setFamilyNotes(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                            placeholder="Internal notes about this family's billing..." />
                        </div>
                      </div>
                      <button
                        onClick={() => saveFamilySubscription(f.parentId)}
                        disabled={familySaving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 hover:bg-purple-700 transition-all"
                      >
                        <Save className="w-4 h-4" /> {familySaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GROUP DISCOUNTS TAB ── */}
        {tab === 'groups' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Group Discount Rules</h2>
              <button
                onClick={() => setShowGdForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Rule
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Group discounts automatically apply when you have enrolled the minimum number of families.
                Currently you have <strong>{activeFamilyCount} families</strong> enrolled.
                {applicableGroupDiscount
                  ? ` The "${applicableGroupDiscount.name}" discount (${applicableGroupDiscount.discountPercent}%) is active.`
                  : ' No group discount is currently active.'}
              </p>
            </div>

            {showGdForm && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-purple-700 mb-4">New Group Discount Rule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Rule Name *</label>
                    <input value={gdName} onChange={(e) => setGdName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      placeholder="e.g. School Group Discount" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Apply to Plan (optional)</label>
                    <select value={gdPlanId} onChange={(e) => setGdPlanId(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white">
                      <option value="">All plans</option>
                      {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Minimum Families *</label>
                    <input type="number" min="1" value={gdMin} onChange={(e) => setGdMin(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      placeholder="e.g. 5" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Discount % *</label>
                    <input type="number" min="1" max="100" value={gdPercent} onChange={(e) => setGdPercent(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      placeholder="e.g. 15" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveGroupDiscount} disabled={!gdName || !gdMin || !gdPercent || gdSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 hover:bg-purple-700 transition-all">
                    <Save className="w-4 h-4" /> {gdSaving ? 'Saving...' : 'Save Rule'}
                  </button>
                  <button onClick={() => setShowGdForm(false)}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {groupDiscounts.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Percent className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No group discount rules yet.</p>
                </div>
              )}
              {groupDiscounts.map((gd) => (
                <div key={gd.id} className={`bg-white rounded-2xl border-2 p-5 flex items-center justify-between gap-4 ${
                  gd.isActive && activeFamilyCount >= gd.minFamilies
                    ? 'border-orange-300 bg-orange-50'
                    : gd.isActive ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-60'
                }`}>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-gray-900">{gd.name}</span>
                      {gd.isActive && activeFamilyCount >= gd.minFamilies && (
                        <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">ACTIVE NOW</span>
                      )}
                      {!gd.isActive && (
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Disabled</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      <strong>{gd.discountPercent}% off</strong> when ≥ <strong>{gd.minFamilies} families</strong> enrolled
                      {gd.plan && <> · {gd.plan.name} plan only</>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleGdActive(gd)} title={gd.isActive ? 'Disable' : 'Enable'}
                      className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-all">
                      {gd.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteGroupDiscount(gd.id)}
                      className="p-2 rounded-xl border border-gray-200 hover:bg-red-50 text-gray-500 hover:text-red-600 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-5">Your Public Profile</h2>
            <p className="text-sm text-gray-500 mb-6">
              This information is shown to parents when they search for therapists. Adding your location helps families find you nearby.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> City
                  </label>
                  <input value={profileCity} onChange={(e) => setProfileCity(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="e.g. Austin" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">State / Region</label>
                  <input value={profileState} onChange={(e) => setProfileState(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="e.g. Texas" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Country
                </label>
                <input value={profileCountry} onChange={(e) => setProfileCountry(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="e.g. United States" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Bio / Specialization</label>
                <textarea value={profileBio} onChange={(e) => setProfileBio(e.target.value)} rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="Briefly describe your specialization, experience, and approach..." />
              </div>
              <button onClick={saveProfile} disabled={profileSaving}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 hover:bg-purple-700 transition-all">
                <Save className="w-4 h-4" />
                {profileSaving ? 'Saving...' : profileSaved ? '✓ Saved!' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

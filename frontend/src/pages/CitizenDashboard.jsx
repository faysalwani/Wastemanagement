import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  MapPin,
  Recycle,
  Gift,
  Award,
  ArrowRight,
  Repeat,
  Sprout,
  Clock,
  ChevronRight,
  ScanLine,
  Package,
  Trash2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CitizenDashboard() {
  const { user } = useAuth() || {};
  const [summary, setSummary] = useState(null);
  const [myDiversion, setMyDiversion] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, divRes, reqRes] = await Promise.all([
        api.get('/credits/citizen-summary').catch(() => ({ data: { success: false } })),
        api.get('/credits/my-diversion').catch(() => ({ data: { success: false } })),
        api.get('/collection-requests/my').catch(() => ({ data: { success: false } })),
      ]);

      if (sumRes.data?.success) setSummary(sumRes.data.data);
      if (divRes.data?.success) setMyDiversion(divRes.data.data);
      if (reqRes.data?.success && Array.isArray(reqRes.data.data)) {
        setMyRequests(reqRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load citizen dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const citizenUser = summary?.user || user;
  const pointsBalance = citizenUser?.ecoCredits ?? 0;
  const personalDivertedKg = myDiversion?.totalDivertedKg ?? summary?.personalDivertedKg ?? 0;
  const wardSmartBins = summary?.wardSmartBins || [];
  const recentTransactions = summary?.recentTransactions || [];
  const latestPickup = myRequests.length > 0 ? myRequests[0] : null;

  const formatStatusLabel = (status) => {
    switch (status) {
      case 'REQUESTED':
        return 'Submitted';
      case 'ASSIGNED':
      case 'ACCEPTED':
      case 'SCHEDULED':
        return 'Scheduled';
      case 'IN_PROGRESS':
        return 'On the way';
      case 'COMPLETED':
      case 'COLLECTED':
        return 'Collected';
      case 'CANCELLED':
      case 'REJECTED':
        return 'Cancelled';
      default:
        return status || 'Submitted';
    }
  };

  const primaryActions = [
    {
      title: 'Request a pickup',
      desc: 'Arrange doorstep collection or check collection days.',
      icon: Truck,
      link: '/collection',
    },
    {
      title: 'Report dumping',
      desc: 'Report an illegal dumping site in your area.',
      icon: MapPin,
      link: '/reports',
    },
    {
      title: 'Reuse and recycle',
      desc: 'Share reusable items, compost organics or find recyclers.',
      icon: Recycle,
      link: '/exchange',
    },
    {
      title: 'My rewards',
      desc: 'View your points balance and redeem household items.',
      icon: Gift,
      link: '/marketplace',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Clean Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#21834A]">
            {citizenUser?.wardName ? `Area: ${citizenUser.wardName}` : 'Citizen Portal'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26372B] tracking-tight mt-0.5">
            Hello, {citizenUser?.name?.split(' ')[0] || 'Citizen'}
          </h1>
          <p className="text-sm sm:text-base text-[#526356] mt-1">
            What would you like to do with your waste today?
          </p>
        </div>

        {/* Prominent Points Pill */}
        <Link
          to="/wallet"
          className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-[#DCE6DF] hover:border-[#21834A] transition-colors self-start sm:self-auto"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E5F4E8] text-[#21834A] flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[#526356] block leading-none">My Reward Points</span>
            <span className="text-lg font-extrabold text-[#26372B]">
              {pointsBalance.toLocaleString()} pts
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#526356] ml-1" />
        </Link>
      </div>

      {/* Primary Action 1: Scan Waste */}
      <div className="space-y-4">
        <Link
          to="/scan"
          className="group block w-full rounded-2xl bg-[#21834A] hover:bg-[#1B6E3E] text-white p-6 sm:p-7 shadow-sm transition-colors"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <ScanLine className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Scan your waste
                </h2>
                <p className="text-sm sm:text-base text-white/90 mt-0.5">
                  Take a photo to learn how to reuse, compost, recycle or dispose of an item.
                </p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-white flex-shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Primary Actions 2-5: 2x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {primaryActions.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.link}
                className="group p-6 rounded-2xl bg-white border border-[#DCE6DF] hover:border-[#21834A] transition-all flex flex-col justify-between gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E5F4E8] text-[#21834A] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#26372B] group-hover:text-[#21834A] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#526356] mt-1">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Shortcut Strip for Reuse, Compost & Recycling Options */}
      <div className="p-5 rounded-2xl bg-white border border-[#DCE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-[#26372B]">
            Explore reuse & recycling options
          </h2>
          <p className="text-xs text-[#526356] mt-0.5">
            Choose the best option for clean household materials and organic scraps.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/exchange"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8FAF8] hover:bg-[#E5F4E8] text-xs font-semibold text-[#26372B] border border-[#DCE6DF] transition-colors"
          >
            <Repeat className="w-3.5 h-3.5 text-[#21834A]" />
            <span>Share Items</span>
          </Link>
          <Link
            to="/compost"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8FAF8] hover:bg-[#E5F4E8] text-xs font-semibold text-[#26372B] border border-[#DCE6DF] transition-colors"
          >
            <Sprout className="w-3.5 h-3.5 text-[#21834A]" />
            <span>Compost Guide</span>
          </Link>
          <Link
            to="/recyclers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8FAF8] hover:bg-[#E5F4E8] text-xs font-semibold text-[#26372B] border border-[#DCE6DF] transition-colors"
          >
            <Recycle className="w-3.5 h-3.5 text-[#21834A]" />
            <span>Recycling Centres</span>
          </Link>
        </div>
      </div>

      {/* Personalized Status Section: Latest Pickup & Rewards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Upcoming / Recent Pickup Request */}
        <div className="p-6 rounded-2xl bg-white border border-[#DCE6DF] flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#26372B] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#21834A]" />
                <span>Your Pickup Status</span>
              </h2>
              <Link
                to="/collection"
                className="text-xs font-semibold text-[#21834A] hover:underline"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-[#526356] py-3">Checking your pickup requests...</p>
            ) : latestPickup ? (
              <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#DCE6DF] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#26372B]">
                    {latestPickup.wasteCategory?.replace(/_/g, ' ') || 'Household Waste'} Pickup
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E5F4E8] text-[#21834A]">
                    {formatStatusLabel(latestPickup.status)}
                  </span>
                </div>
                <p className="text-xs text-[#526356]">
                  {latestPickup.address || citizenUser?.wardName}
                </p>
                <p className="text-xs text-[#526356] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Requested on{' '}
                    {new Date(latestPickup.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#DCE6DF] text-sm text-[#526356]">
                You have no active pickup requests right now.
              </div>
            )}
          </div>

          <Link
            to="/collection"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#21834A] hover:underline"
          >
            <span>Arrange a pickup or view collection schedule</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 2: Rewards & Recent Points */}
        <div className="p-6 rounded-2xl bg-white border border-[#DCE6DF] flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#26372B] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#21834A]" />
                <span>Rewards & Points</span>
              </h2>
              <Link
                to="/wallet"
                className="text-xs font-semibold text-[#21834A] hover:underline"
              >
                Points history
              </Link>
            </div>

            {recentTransactions.length > 0 ? (
              <div className="divide-y divide-[#DCE6DF]">
                {recentTransactions.slice(0, 2).map((tx) => (
                  <div
                    key={tx._id}
                    className="py-2.5 flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-medium text-[#26372B] block">
                        {tx.description || tx.activityType?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-[#526356]">
                        {new Date(tx.timestamp || tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="font-bold text-[#21834A]">
                      +{tx.creditsEarned} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#DCE6DF] text-sm text-[#526356]">
                Earn points when you scan waste, compost at home, share items or report dumping.
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 pt-1">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#21834A] hover:underline"
            >
              <span>Browse rewards</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#526356] hover:text-[#26372B]"
            >
              <Package className="w-4 h-4" />
              <span>My orders</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure for Additional Details (Impact & Nearby Bins) */}
      <details className="group rounded-2xl bg-white border border-[#DCE6DF] p-5">
        <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-bold text-[#26372B]">
          <span>View your community impact & nearby public bins</span>
          <ChevronRight className="w-4 h-4 text-[#526356] group-open:rotate-90 transition-transform" />
        </summary>

        <div className="pt-5 mt-4 border-t border-[#DCE6DF] space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#DCE6DF]">
              <span className="text-xs text-[#526356] block">Waste Kept Out of Landfill</span>
              <span className="text-xl font-extrabold text-[#21834A] mt-1 block">
                {personalDivertedKg} kg
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#DCE6DF]">
              <span className="text-xs text-[#526356] block">Shared Items Active</span>
              <span className="text-xl font-extrabold text-[#26372B] mt-1 block">
                {summary?.activeListingsCount || 0}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#DCE6DF]">
              <span className="text-xs text-[#526356] block">Public Bins in Your Area</span>
              <span className="text-xl font-extrabold text-[#26372B] mt-1 block">
                {wardSmartBins.length}
              </span>
            </div>
          </div>

          {wardSmartBins.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#26372B] flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-[#21834A]" />
                  <span>Nearby Public Smart Bins ({citizenUser?.wardName})</span>
                </h3>
                <Link
                  to="/smart-bins"
                  className="text-xs font-semibold text-[#21834A] hover:underline"
                >
                  Open bin map
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {wardSmartBins.slice(0, 3).map((bin) => (
                  <div
                    key={bin.binId}
                    className="p-3.5 rounded-xl bg-[#F8FAF8] border border-[#DCE6DF] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#26372B]">{bin.name}</div>
                      <div className="text-xs text-[#526356]">{bin.wardName}</div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        bin.currentFillPercent >= 80
                          ? 'bg-rose-100 text-rose-800'
                          : bin.currentFillPercent >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#E5F4E8] text-[#21834A]'
                      }`}
                    >
                      {bin.currentFillPercent}% full
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

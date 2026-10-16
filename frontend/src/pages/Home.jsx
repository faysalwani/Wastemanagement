import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Truck,
  MapPin,
  Recycle,
  Gift,
  ArrowRight,
  Repeat,
  Sprout,
  Trash2,
  Award,
  ScanLine,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, isAuthenticated } = useAuth() || {};

  const primaryCards = [
    {
      title: 'Request a pickup',
      desc: 'Arrange waste collection or check your local schedule.',
      icon: Truck,
      link: '/collection',
    },
    {
      title: 'Report dumping',
      desc: 'Help keep public spaces and neighbourhoods clean.',
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
      desc: 'View your points balance and redeem useful household items.',
      icon: Gift,
      link: '/marketplace',
    },
  ];

  const reuseOptions = [
    {
      title: 'Share & Reuse Items',
      desc: 'Pass on clean boxes, jars or reusable materials to neighbours.',
      icon: Repeat,
      link: '/exchange',
    },
    {
      title: 'Compost at Home',
      desc: 'Simple step-by-step guidance to turn kitchen scraps into compost.',
      icon: Sprout,
      link: '/compost',
    },
    {
      title: 'Find Recycling Centres',
      desc: 'Locate verified drop-off points for paper, plastic, metal and e-waste.',
      icon: Recycle,
      link: '/recyclers',
    },
    {
      title: 'Public Smart Bins',
      desc: 'Check fill levels of community bins in your area before visiting.',
      icon: Trash2,
      link: '/smart-bins',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      {/* Main Hero & Primary Task Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#26372B] tracking-tight">
            A cleaner community starts with you.
          </h1>
          <p className="text-base sm:text-lg text-[#526356] max-w-2xl">
            Find the right way to reuse, recycle or dispose of your waste.
          </p>
        </div>

        {/* Primary Full-Width CTA: Scan Your Waste */}
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
                  Take a photo to discover what to do next.
                </p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-white flex-shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* 2x2 Primary Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {primaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.link}
                className="group p-6 rounded-2xl bg-white border border-[#DCE6DF] hover:border-[#21834A] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E5F4E8] text-[#21834A] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#26372B] group-hover:text-[#21834A] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-[#526356] mt-1 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Personalized Bar for Signed-In Users or Simple Account Prompt for Guests */}
      {isAuthenticated ? (
        <section className="p-6 rounded-2xl bg-white border border-[#DCE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E5F4E8] text-[#21834A] flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#26372B]">
                Welcome back, {user?.name?.split(' ')[0] || 'Citizen'}
              </h2>
              <p className="text-sm text-[#526356]">
                You currently have{' '}
                <strong className="text-[#21834A]">{user?.ecoCredits || 0} reward points</strong>
                {user?.wardName ? ` • Area: ${user.wardName}` : ''}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/citizen"
              className="px-4 py-2.5 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors"
            >
              Go to My Dashboard
            </Link>
          </div>
        </section>
      ) : (
        <section className="p-6 rounded-2xl bg-[#E5F4E8]/70 border border-[#C5E6CD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#26372B]">
              Track your pickups and earn community rewards
            </h2>
            <p className="text-sm text-[#526356] mt-0.5">
              Create a free citizen account to request doorstep collection, report dumping and earn points.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F8FAF8] text-[#26372B] border border-[#DCE6DF] text-sm font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>
        </section>
      )}

      {/* Secondary Section: More Ways to Reuse & Recycle */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#26372B]">
            Reuse, compost and recycle locally
          </h2>
          <p className="text-sm text-[#526356]">
            Practical options to keep useful materials out of landfills.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reuseOptions.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.link}
                className="group p-5 rounded-2xl bg-white border border-[#DCE6DF] hover:border-[#21834A] transition-all flex flex-col justify-between gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-[#E5F4E8] text-[#21834A] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#26372B] group-hover:text-[#21834A]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#526356] mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

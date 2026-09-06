import React, { useState, useEffect } from 'react';
import { 
  Repeat, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  CheckCircle, 
  Clock, 
  User, 
  Sparkles, 
  X, 
  Upload, 
  AlertCircle,
  Package,
  Award
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'ALL', label: 'All Resources' },
  { id: 'ORGANIC_COMPOSTABLE', label: 'Organic / Compost' },
  { id: 'SCRAP_PAPER_CARDBOARD', label: 'Cardboard & Boxes' },
  { id: 'REUSABLE_CONTAINER', label: 'Glass Jars & Bottles' },
  { id: 'SCRAP_METAL_GLASS', label: 'Scrap Metal' },
  { id: 'OTHER', label: 'Other Reusables' },
];

const SRINAGAR_WARDS = [
  'All Wards',
  'Lal Chowk',
  'Rajbagh',
  'Hazratbal',
  'Bemina',
  'Nishat',
  'Soura',
  'Batamaloo',
  'Khanyar',
  'Dalgate',
  'Karan Nagar',
];

export default function Exchange() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedWard, setSelectedWard] = useState('All Wards');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [claimModalListing, setClaimModalListing] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Subtab State: MARKETPLACE or MY_LISTINGS
  const [viewMode, setViewMode] = useState('MARKETPLACE');
  const [myListings, setMyListings] = useState([]);
  const [myCounts, setMyCounts] = useState({ total: 0, available: 0, reserved: 0, completed: 0, cancelled: 0 });
  const [loadingMy, setLoadingMy] = useState(false);

  // Form State for creating a listing
  const [formData, setFormData] = useState({
    title: '',
    category: 'ORGANIC_COMPOSTABLE',
    description: '',
    quantity: '',
    quantityUnit: 'KG',
    wardName: 'Rajbagh',
    address: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { user, isAuthenticated, refreshUser } = useAuth() || {};

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedWard !== 'All Wards') params.wardName = selectedWard;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/exchange/listings', { params });
      if (res.data.success) {
        setListings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch exchange listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyListings = async () => {
    if (!isAuthenticated) return;
    setLoadingMy(true);
    try {
      const res = await api.get('/exchange/my-listings');
      if (res.data.success) {
        setMyListings(res.data.data);
        setMyCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Failed to fetch my listings:', err);
    } finally {
      setLoadingMy(false);
    }
  };

  const handleCancelListing = async (listingId) => {
    try {
      const res = await api.patch(`/exchange/listings/${listingId}/cancel`);
      if (res.data.success) {
        setActionSuccess('Resource listing cancelled.');
        fetchMyListings();
        fetchListings();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Failed to cancel listing.');
    }
  };

  useEffect(() => {
    fetchListings();
    if (isAuthenticated) fetchMyListings();
  }, [selectedCategory, selectedWard, isAuthenticated]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('category', formData.category);
    data.append('description', formData.description);
    data.append('quantity', formData.quantity);
    data.append('quantityUnit', formData.quantityUnit);
    data.append('wardName', formData.wardName);
    data.append('address', formData.address);
    if (photoFile) {
      data.append('photo', photoFile);
    }

    try {
      const res = await api.post('/exchange/listings', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setActionSuccess('Resource listing successfully posted to marketplace!');
        setFormData({
          title: '',
          category: 'ORGANIC_COMPOSTABLE',
          description: '',
          quantity: '',
          quantityUnit: 'KG',
          wardName: user?.wardName || 'Rajbagh',
          address: '',
        });
        setPhotoFile(null);
        fetchListings();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      setActionError(
        err.response?.data?.error?.message ||
        'Failed to create listing. Please verify inputs.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaim = async () => {
    if (!claimModalListing) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await api.post(`/exchange/listings/${claimModalListing._id}/claim`);
      if (res.data.success) {
        setClaimModalListing(null);
        setActionSuccess('Resource successfully claimed! Contact details updated.');
        fetchListings();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      setActionError(
        err.response?.data?.error?.message ||
        'Failed to claim resource. Another citizen may have already claimed it.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (listingId) => {
    try {
      const res = await api.post(`/exchange/listings/${listingId}/complete`);
      if (res.data.success) {
        setActionSuccess('Transaction completed! +25 Eco-Credits awarded to owner.');
        if (refreshUser) refreshUser();
        fetchListings();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Error completing listing.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-2">
            <Repeat className="w-3.5 h-3.5 text-blue-600" />
            Circular Economy Marketplace
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            P2P Resource & Bio-Waste Exchange
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Connect directly with Srinagar gardeners, composters, and recyclers to divert clean resources from landfills.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => {
              setActionError(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-eco-600 hover:bg-eco-700 text-white text-xs font-semibold shadow-md shadow-eco-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>List a Resource</span>
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Subtab Toggle Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setViewMode('MARKETPLACE')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            viewMode === 'MARKETPLACE'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Repeat className="w-4 h-4 text-blue-400" />
          <span>Explore Marketplace ({listings.length})</span>
        </button>

        {isAuthenticated && (
          <button
            onClick={() => {
              setViewMode('MY_LISTINGS');
              fetchMyListings();
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'MY_LISTINGS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span>My Listings ({myCounts.total})</span>
          </button>
        )}
      </div>

      {/* VIEW 1: MARKETPLACE */}
      {viewMode === 'MARKETPLACE' && (
        <div className="space-y-8">
          {/* Filter and Search Controls */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search & Ward Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vegetable scraps, cardboard cartons, glass jars..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-eco-500/20 focus:border-eco-500"
                />
              </form>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none"
                >
                  {SRINAGAR_WARDS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 mx-auto border-4 border-eco-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-xs text-slate-500">Loading marketplace listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No resources found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active listings match your current filters. Be the first to offer reusable items in your locality!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((item) => {
                const isOwner = user && item.ownerId?._id === user.id;
                const isClaimant = user && item.claimedById?._id === user.id;

                return (
                  <div
                    key={item._id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Image or Category Header */}
                      <div className="h-40 bg-slate-100 border-b border-slate-100 relative overflow-hidden flex items-center justify-center">
                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-400">
                            <Repeat className="w-8 h-8 text-slate-300" />
                            <span className="text-[10px] font-medium uppercase tracking-wider">
                              Resource Listing
                            </span>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-2xs ${
                            item.status === 'AVAILABLE'
                              ? 'bg-emerald-500 text-white'
                              : item.status === 'RESERVED'
                              ? 'bg-amber-500 text-white'
                              : item.status === 'COMPLETED'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-400 text-white'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        {/* Quantity Pill */}
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold">
                          {item.quantity} {item.quantityUnit}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-eco-700 uppercase tracking-wider">
                            {item.category.replace(/_/g, ' ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.wardName}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                          {item.title}
                        </h3>

                        {item.description && (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {item.ownerId?.name || 'Community Member'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="p-5 pt-0">
                      {item.status === 'AVAILABLE' && (
                        <button
                          onClick={() => {
                            if (!isAuthenticated) {
                              window.location.href = '/login';
                              return;
                            }
                            setActionError(null);
                            setClaimModalListing(item);
                          }}
                          disabled={isOwner}
                          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isOwner ? 'Own Listing' : 'Claim Resource'}
                        </button>
                      )}

                      {item.status === 'RESERVED' && (
                        <div className="space-y-2">
                          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 text-center font-medium">
                            Reserved by {item.claimedById?.name || 'Citizen'}
                          </div>
                          {(isOwner || isClaimant || user?.role === 'ADMIN') && (
                            <button
                              onClick={() => handleComplete(item._id)}
                              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                            >
                              Mark Handover Completed (+25 pts)
                            </button>
                          )}
                        </div>
                      )}

                      {item.status === 'COMPLETED' && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-center gap-1.5 font-bold">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>Successfully Diverted! (+25 Credits)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MY LISTINGS */}
      {viewMode === 'MY_LISTINGS' && (
        <div className="space-y-6">
          {/* KPI Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Posted</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{myCounts.total}</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Available</span>
              <div className="text-2xl font-extrabold text-emerald-900 mt-1">{myCounts.available}</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Reserved</span>
              <div className="text-2xl font-extrabold text-amber-900 mt-1">{myCounts.reserved}</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 shadow-xs">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Completed</span>
              <div className="text-2xl font-extrabold text-blue-900 mt-1">{myCounts.completed}</div>
            </div>
          </div>

          {loadingMy ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading your listings...</div>
          ) : myListings.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">You haven't posted any resource listings yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Have clean packaging boxes, glass jars, or garden mulch? List it here for neighbors and earn +25 Eco-Credits.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-eco-600 text-white text-xs font-bold shadow-xs hover:bg-eco-700"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Listing</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-eco-700 text-xs uppercase tracking-wider">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        item.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'RESERVED'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600">{item.quantity} {item.quantityUnit} • {item.wardName}</p>

                    {item.status === 'RESERVED' && item.claimedById && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                        <div className="font-bold">Reserved by: {item.claimedById.name}</div>
                        <div>Phone: {item.claimedById.phone || 'Not shared'}</div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 pt-0 space-y-2">
                    {item.status === 'AVAILABLE' && (
                      <button
                        onClick={() => handleCancelListing(item._id)}
                        className="w-full py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        Cancel Listing
                      </button>
                    )}

                    {item.status === 'RESERVED' && (
                      <button
                        onClick={() => handleComplete(item._id)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Mark Handover Completed (+25 pts)
                      </button>
                    )}

                    {item.status === 'COMPLETED' && (
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs text-center font-bold">
                        +25 Eco-Credits Awarded
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Claim Confirmation Modal */}
      {claimModalListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Confirm Resource Claim</h3>
              <button
                onClick={() => setClaimModalListing(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to reserve <strong>"{claimModalListing.title}"</strong> ({claimModalListing.quantity} {claimModalListing.quantityUnit}) from <strong>{claimModalListing.ownerId?.name}</strong>?
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div><strong>Pickup Location:</strong> {claimModalListing.wardName}</div>
              <div><strong>Contact:</strong> {claimModalListing.ownerId?.phone || claimModalListing.ownerId?.email}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClaimModalListing(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleClaim}
                className="px-5 py-2 rounded-xl bg-eco-600 hover:bg-eco-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60"
              >
                {submitting ? 'Reserving...' : 'Confirm Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Repeat className="w-4 h-4 text-eco-600" />
                <span>List Reusable or Bio-Waste Resource</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Listing Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5 kg Clean Fruit & Vegetable Peels"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-eco-500/20 focus:border-eco-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="ORGANIC_COMPOSTABLE">Organic / Compostable</option>
                    <option value="SCRAP_PAPER_CARDBOARD">Cardboard & Packaging</option>
                    <option value="REUSABLE_CONTAINER">Glass Jars & Containers</option>
                    <option value="SCRAP_METAL_GLASS">Scrap Metal & Cans</option>
                    <option value="OTHER">Other Reusable Items</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity & Unit *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="5"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-2/3 px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                    <select
                      value={formData.quantityUnit}
                      onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                      className="w-1/3 px-2 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      <option value="KG">kg</option>
                      <option value="UNITS">Units</option>
                      <option value="BAGS">Bags</option>
                      <option value="LITERS">Liters</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Srinagar Ward *
                  </label>
                  <select
                    value={formData.wardName}
                    onChange={(e) => setFormData({ ...formData, wardName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    {SRINAGAR_WARDS.filter((w) => w !== 'All Wards').map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pickup Street / Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="Near Zero Bridge"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe material condition, freshness, or packaging..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Photograph (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-eco-600 hover:bg-eco-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60"
                >
                  {submitting ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { apiUrl } from '@/utils/api';

export default function LeadForm({ buttonText = 'Request Expert Consultation', propertyId }: { buttonText?: string; propertyId?: string }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({
    type: 'idle',
    message: '',
  });

  const handleChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitState({ type: 'idle', message: '' });

    try {
      const response = await fetch(apiUrl('/api/contacts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          requirementText: formData.message.trim(),
          source: 'NAV_CONTACT',
          notes: propertyId ? `PROPERTY_ID: ${propertyId}` : undefined,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to submit your request.');
      }

      setFormData({
        fullName: '',
        email: '',
        phone: '',
        message: '',
      });
      setSubmitState({
        type: 'success',
        message: 'Your enquiry has been sent. We will contact you shortly.',
      });
    } catch (error) {
      setSubmitState({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 w-full text-left">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Full Name</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">person</span>
          <input 
            type="text" 
            value={formData.fullName}
            onChange={handleChange('fullName')}
            placeholder="Name" 
            required
            className="w-full bg-surface border border-surface-container rounded-xl px-12 py-3 text-on-surface placeholder-outline/50 outline-none focus:border-primary transition-all font-medium"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline opacity-50 ml-1">Email Address</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 group-focus-within:text-primary transition-colors">mail</span>
          <input 
            type="email" 
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="Email" 
            className="w-full bg-surface border border-surface-container rounded-2xl px-12 py-4 text-on-surface placeholder-outline/30 outline-none focus:border-primary transition-all font-bold shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline opacity-50 ml-1">Phone Number</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 group-focus-within:text-primary transition-colors">call</span>
          <input 
            type="tel" 
            value={formData.phone}
            onChange={handleChange('phone')}
            placeholder="Phone Number" 
            required
            className="w-full bg-surface border border-surface-container rounded-2xl px-12 py-4 text-on-surface placeholder-outline/30 outline-none focus:border-primary transition-all font-bold shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Your Message</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-4 text-primary/40">chat_bubble</span>
          <textarea 
            value={formData.message}
            onChange={handleChange('message')}
            placeholder="I am interested in..." 
            rows={4}
            required
            className="w-full bg-surface border border-surface-container rounded-xl px-12 py-3 text-on-surface placeholder-outline/50 outline-none focus:border-primary transition-all font-medium resize-none"
          />
        </div>
      </div>

      {submitState.type !== 'idle' && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            submitState.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {submitState.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Submitting...' : buttonText}
      </button>
    </form>
  );
}

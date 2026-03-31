'use client';

import React, { useState } from 'react';

export default function LeadForm() {
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

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

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
      const response = await fetch(`${apiBaseUrl}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.fullName.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim(),
          requirementText: formData.message.trim(),
          source: 'website-form',
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
    <form onSubmit={handleSubmit} className="space-y-6 w-full text-left">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Full Name</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">person</span>
          <input 
            type="text" 
            value={formData.fullName}
            onChange={handleChange('fullName')}
            placeholder="John Doe" 
            required
            className="w-full bg-surface border border-surface-container rounded-xl px-12 py-3 text-on-surface placeholder-outline/50 outline-none focus:border-primary transition-all font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Email Address</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">mail</span>
            <input 
              type="email" 
              value={formData.email}
              onChange={handleChange('email')}
              placeholder="john@example.com" 
              className="w-full bg-surface border border-surface-container rounded-xl px-12 py-3 text-on-surface placeholder-outline/50 outline-none focus:border-primary transition-all font-medium"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Phone Number</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">call</span>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={handleChange('phone')}
              placeholder="+91 98765 43210" 
              required
              className="w-full bg-surface border border-surface-container rounded-xl px-12 py-3 text-on-surface placeholder-outline/50 outline-none focus:border-primary transition-all font-medium"
            />
          </div>
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
        {isSubmitting ? 'Submitting...' : 'Request Expert Consultation'}
      </button>
    </form>
  );
}

'use client';

import React, { useState } from 'react';
import { apiUrl } from '@/utils/api';

interface InquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'CONTACT' | 'LISTING';
}

export default function InquiryModal({ isOpen, onClose, type }: InquiryModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        message: ''
    });

    if (!isOpen) return null;

    const content = {
        CONTACT: {
            title: 'Contact Our Experts',
            subtitle: 'Have questions? Our team is ready to guide you through your real estate journey.',
            placeholder: 'How can we help? (e.g. I want to schedule a site visit in Chennai)',
            source: 'NAV_CONTACT'
        },
        LISTING: {
            title: 'List Your Property',
            subtitle: 'Share your property details with us. We will help you find the right buyer.',
            placeholder: 'Property Details (e.g. 3BHK Villa in ECR, 2400 sqft, ocean view...)',
            source: 'NAV_LISTING_REQUEST'
        }
    }[type];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const endpoint = type === 'CONTACT' ? '/api/contacts' : '/api/listing-requests';
        try {
            await fetch(apiUrl(endpoint), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: formData.name,
                    phone: formData.phone,
                    requirementText: formData.message,
                    source: content.source
                })
            });
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                onClose();
            }, 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
            
            <div className="relative bg-surface w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-surface-container overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-500">
                <div className="absolute top-6 right-6">
                    <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-all text-outline hover:text-primary">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-12">
                    {isSuccess ? (
                        <div className="text-center py-10 space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 border border-green-100 mb-6">
                                <span className="material-symbols-outlined text-4xl">check_circle</span>
                            </div>
                            <h2 className="text-3xl font-black font-headline text-primary uppercase tracking-tighter">Thank You!</h2>
                            <p className="text-outline text-lg font-medium">Our team will reach out to you shortly.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-10 text-center">
                                <h1 className="text-4xl font-extrabold font-headline text-primary mb-3 tracking-tighter uppercase">{content.title}</h1>
                                <p className="text-outline/60 text-sm font-medium">{content.subtitle}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Full Name</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 text-sm">person</span>
                                        <input 
                                            required
                                            type="text"
                                            placeholder="Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full pl-12 pr-6 py-4 bg-background border border-surface-container rounded-2xl focus:border-secondary transition-all text-sm font-bold shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Phone Number</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 text-sm">call</span>
                                        <input 
                                            required
                                            type="tel"
                                            placeholder="Phone Number"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="w-full pl-12 pr-6 py-4 bg-background border border-surface-container rounded-2xl focus:border-secondary transition-all text-sm font-bold shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Message</label>
                                    <textarea 
                                        required
                                        placeholder={content.placeholder}
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        className="w-full px-6 py-4 bg-background border border-surface-container rounded-2xl focus:border-secondary transition-all text-sm font-bold shadow-inner min-h-[120px] resize-none"
                                    />
                                </div>

                                <button 
                                    disabled={isSubmitting}
                                    type="submit"
                                    className={`w-full py-5 bg-primary text-white font-extrabold rounded-2xl flex items-center justify-center gap-4 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-secondary">send</span>
                                            <span className="uppercase tracking-[0.2em] text-xs">Submit Request</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

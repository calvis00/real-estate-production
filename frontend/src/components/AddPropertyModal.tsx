'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PROPERTY_TEMPLATES } from '@/utils/templates';
import { apiUrl } from '@/utils/api';

interface AddPropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
    initialData?: any; // For Edit Mode
}

export default function AddPropertyModal({ isOpen, onClose, onRefresh, initialData }: AddPropertyModalProps) {
    const [step, setStep] = useState<'template' | 'editor'>('template');
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    const [formData, setFormData] = useState<any>({});
    const [files, setFiles] = useState<{ file: File; preview: string; type: string }[]>([]);
    const [existingMedia, setExistingMedia] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData(initialData);
                setExistingMedia([
                    ...(initialData.images || []).map((url: string) => ({ url, type: 'image' })),
                    ...(initialData.videos || []).map((url: string) => ({ url, type: 'video' }))
                ]);
                setStep('editor');
            } else {
                setStep('template');
                setFormData({
                    type: 'RESIDENTIAL_BUY',
                    category: 'APARTMENT',
                    city: 'Chennai',
                    locality: 'OMR',
                    bedrooms: 0,
                    bathrooms: 0,
                    areaSqft: 1000,
                    price: 0,
                    tags: []
                });
                setExistingMedia([]);
            }
            setMode('edit');
            setFiles([]);
            setError(null);
        }
    }, [isOpen, initialData]);

    // Handle Text Selection for Bold/Italic Toolbar
    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setToolbarPos({
                top: rect.top - 50 + window.scrollY,
                left: rect.left + rect.width / 2
            });
            setShowToolbar(true);
        } else {
            setShowToolbar(false);
        }
    };

    const applyFormat = (command: string) => {
        document.execCommand(command, false);
        setShowToolbar(false);
    };

    const handleSelectTemplate = (templateId: string) => {
        const template = PROPERTY_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            const templateDefaults = {
                city: 'Chennai',
                locality: 'OMR',
                price: 0,
                areaSqft: 1000,
            };

            setFormData({
                ...templateDefaults,
                ...template.defaultData
            });
            setStep('editor');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                preview: URL.createObjectURL(file),
                type: file.type
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...files];
        URL.revokeObjectURL(newFiles[index].preview);
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    const handleSubmit = async (overrideStatus?: string) => {
        setIsPublishing(true);
        setError(null);

        const description = editorRef.current?.innerHTML || '';
        const data = new FormData();
        
        Object.keys(formData).forEach(key => {
            if (['description', 'images', 'videos', 'id', 'status', 'createdAt', 'updatedAt'].includes(key)) return;
            if (key === 'tags' && Array.isArray(formData[key])) {
                data.append(key, formData[key].join(','));
            } else if (formData[key] !== undefined && formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        // Set status if provided (e.g. DRAFT)
        if (overrideStatus) {
            data.append('status', overrideStatus);
        } else if (!initialData) {
            data.append('status', 'ACTIVE'); // Default for new properties
        }

        data.append('description', description);
        files.forEach(f => data.append('assets', f.file));

        try {
            const url = initialData 
                ? apiUrl(`/api/properties/${initialData.id}`)
                : apiUrl('/api/properties');
            
            const res = await fetch(url, {
                method: initialData ? 'PUT' : 'POST',
                body: data,
                credentials: 'include'
            });

            if (res.ok) {
                onRefresh();
                onClose();
            } else {
                const errData = await res.json();
                if (errData.errors && Array.isArray(errData.errors)) {
                    const fields = errData.errors.map((e: any) => e.path.join('.')).join(', ');
                    setError(`Validation failed for: ${fields}`);
                } else {
                    setError(errData.message || 'Action failed');
                }
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsPublishing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            
            {/* FLOATING FORMATTING TOOLBAR */}
            {showToolbar && (
                <div 
                    className="fixed z-[110] bg-primary text-white px-2 py-1.5 rounded-lg shadow-2xl flex items-center gap-1 -translate-x-1/2 animate-in zoom-in-95"
                    style={{ top: toolbarPos.top, left: toolbarPos.left }}
                >
                    <button 
                        onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }}
                        className="p-1.5 hover:bg-white/20 rounded transition-colors"
                        title="Bold (Ctrl+B)"
                    >
                        <span className="material-symbols-outlined text-base">format_bold</span>
                    </button>
                    <button 
                        onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }}
                        className="p-1.5 hover:bg-white/20 rounded transition-colors"
                        title="Italic (Ctrl+I)"
                    >
                        <span className="material-symbols-outlined text-base">format_italic</span>
                    </button>
                    <div className="w-px h-4 bg-white/20 mx-1" />
                    <button 
                        onMouseDown={(e) => { e.preventDefault(); applyFormat('insertUnorderedList'); }}
                        className="p-1.5 hover:bg-white/20 rounded transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">format_list_bulleted</span>
                    </button>
                </div>
            )}

            {/* STICKY HEADER */}
            <div className="bg-surface/80 backdrop-blur-md border-b border-surface-container sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-all group">
                            <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">close</span>
                        </button>
                        <div className="h-6 w-px bg-surface-container" />
                        
                        {step === 'editor' && (
                            <div className="flex bg-surface-container/50 rounded-full p-1 border border-surface-container">
                                <button 
                                    onClick={() => setMode('edit')}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'edit' ? 'bg-primary text-white shadow-sm' : 'text-outline hover:text-primary'}`}
                                >
                                    Write
                                </button>
                                <button 
                                    onClick={() => setMode('preview')}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'preview' ? 'bg-primary text-white shadow-sm' : 'text-outline hover:text-primary'}`}
                                >
                                    Preview
                                </button>
                            </div>
                        )}
                    </div>

                    {step === 'editor' && (
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold text-outline uppercase tracking-widest opacity-40">Auto-saved</span>
                            
                            {!initialData && (
                                <button 
                                    onClick={() => handleSubmit('DRAFT')}
                                    disabled={isPublishing}
                                    className="px-6 py-2.5 rounded-full font-bold text-xs border border-surface-container hover:bg-surface-container transition-all flex items-center gap-2 text-outline hover:text-primary"
                                >
                                    <span className="material-symbols-outlined text-sm">archive</span>
                                    Save as Draft
                                </button>
                            )}

                            <button 
                                onClick={() => handleSubmit()}
                                disabled={isPublishing}
                                className={`bg-primary text-white px-8 py-2.5 rounded-full font-bold text-sm shadow-xl hover:shadow-primary/20 transition-all flex items-center gap-2 ${isPublishing ? 'opacity-50 cursor-wait' : 'active:scale-95'}`}
                            >
                                {isPublishing ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                )}
                                {isPublishing ? 'Pending...' : initialData ? 'Update' : 'Publish'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scroll-smooth bg-background">
                {step === 'template' ? (
                    /* STEP 1: TEMPLATE PICKER */
                    <div className="max-w-6xl mx-auto px-6 py-20 text-center">
                        <h1 className="text-5xl font-black font-headline text-primary mb-4 tracking-tighter uppercase">Start with <span className="text-secondary">Excellence</span></h1>
                        <p className="text-outline text-lg max-w-2xl mx-auto mb-16 font-medium">Select a optimized template to pre-fill your listing with professional copywriting and smart defaults.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {PROPERTY_TEMPLATES.map((t) => (
                                <button 
                                    key={t.id}
                                    onClick={() => handleSelectTemplate(t.id)}
                                    className="group bg-surface p-10 rounded-[3rem] border border-surface-container hover:border-primary transition-all text-left shadow-sm hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden"
                                >
                                    <div className="mb-8 w-16 h-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                        <span className="material-symbols-outlined text-3xl">{t.icon}</span>
                                    </div>
                                    <h3 className="text-2xl font-black font-headline text-primary mb-3 uppercase tracking-tight">{t.name}</h3>
                                    <p className="text-outline text-sm leading-relaxed mb-8">{t.description}</p>
                                    <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                                        Select Template <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </div>
                                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 transition-transform group-hover:scale-125">
                                        <span className="material-symbols-outlined text-9xl">{t.icon}</span>
                                    </div>
                                </button>
                            ))}
                            
                            {/* Empty Canvas Option */}
                            <button 
                                onClick={() => { 
                                    setFormData({
                                        type: 'RESIDENTIAL_BUY',
                                        category: 'APARTMENT',
                                        city: 'Chennai',
                                        locality: 'OMR',
                                        bedrooms: 0,
                                        bathrooms: 0,
                                        areaSqft: 1000,
                                        price: 0,
                                        tags: []
                                    }); 
                                    setStep('editor'); 
                                }}
                                className="group bg-background p-10 rounded-[3rem] border border-dashed border-surface-container hover:border-outline transition-all text-left flex flex-col justify-center items-center gap-4 hover:bg-surface/50 shadow-sm"
                            >
                                <div className="mb-4 w-16 h-16 rounded-[1.5rem] bg-surface-container/20 flex items-center justify-center text-outline group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                    <span className="material-symbols-outlined text-3xl font-black text-outline group-hover:text-primary">edit_note</span>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-black font-headline text-outline group-hover:text-primary mb-1 uppercase tracking-tight">Blank Slate</h3>
                                    <p className="text-[10px] font-bold text-outline/60 uppercase tracking-widest">Start from scratch</p>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* STEP 2: THE EDITOR / PREVIEW */
                    <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row gap-16 relative">
                        
                        {/* MAIN EDITOR CONTENT */}
                        <div className="flex-1 space-y-12">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-sm font-bold animate-in fade-in zoom-in-95 flex items-center gap-3">
                                    <span className="material-symbols-outlined">error</span>
                                    {error}
                                </div>
                            )}

                            {mode === 'edit' ? (
                                <>
                                    {/* TITLE (Medium Style) */}
                                    <input 
                                        placeholder="Post Title (e.g. Modern Villa in ECR)" 
                                        value={formData.title || ''}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        className="w-full text-5xl font-serif border-none focus:ring-0 placeholder:text-primary/10 bg-transparent text-primary resize-none p-0 outline-none"
                                        spellCheck={false}
                                    />

                                    {/* CONTENT / STORY (ContentEditable for Rich Text) */}
                                    <div 
                                        ref={editorRef}
                                        contentEditable
                                        onMouseUp={handleMouseUp}
                                        className="w-full text-xl font-sans border-none focus:ring-0 bg-transparent text-primary/80 min-h-[400px] resize-none p-0 outline-none leading-relaxed prose prose-xl max-w-none prose-headings:font-black prose-p:my-4"
                                        dangerouslySetInnerHTML={{ __html: formData.description || '' }}
                                    />
                                </>
                            ) : (
                                /* PREVIEW VIEW */
                                <div className="animate-in fade-in zoom-in-95 duration-500">
                                    <h1 className="text-6xl font-black font-headline text-primary mb-12 tracking-tight leading-[0.9] uppercase">{formData.title}</h1>
                                    <div 
                                        className="prose prose-2xl font-serif text-primary/80 leading-relaxed mb-16"
                                        dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || formData.description || '' }}
                                    />
                                    
                                    {/* ASSET PREVIEW GRID */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {files.map((f, i) => (
                                            <div key={i} className="rounded-[2.5rem] overflow-hidden border border-surface-container bg-surface shadow-lg">
                                                {f.type.startsWith('video/') ? (
                                                    <video src={f.preview} controls className="w-full h-auto aspect-video object-cover" />
                                                ) : (
                                                    <img 
                                                        src={f.preview} 
                                                        className="w-full h-auto object-cover aspect-[4/3]" 
                                                        alt="" 
                                                        onError={(e: any) => { e.target.src = "/placeholder.png"; }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ASSETS AREA (Only in Edit Mode) */}
                            {mode === 'edit' && (
                                <div className="space-y-6 pt-12 border-t border-surface-container/30">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-outline opacity-50 flex items-center gap-3">
                                        Media & Assets
                                        <div className="h-px flex-1 bg-outline/20" />
                                    </h4>

                                    {/* Existing Media section */}
                                    {existingMedia.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8">
                                            {existingMedia.map((m, i) => (
                                                <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border border-surface-container opacity-60 hover:opacity-100 transition-all">
                                                    {m.type === 'video' ? (
                                                        <video src={m.url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img 
                                                            src={m.url} 
                                                            className="w-full h-full object-cover" 
                                                            alt="" 
                                                            onError={(e: any) => { e.target.src = "/placeholder.png"; }}
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                                        <span className="text-[8px] font-bold text-white uppercase tracking-widest bg-black/40 px-2 py-1 rounded-full">Stored</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {files.map((f, i) => (
                                            <div key={i} className="relative group bg-surface rounded-[2rem] overflow-hidden border border-surface-container animate-in zoom-in-95">
                                                {f.type.startsWith('video/') ? (
                                                    <video src={f.preview} className="w-full h-auto aspect-video object-cover" />
                                                ) : (
                                                    <img 
                                                        src={f.preview} 
                                                        className="w-full h-auto object-cover aspect-[4/3]" 
                                                        alt="" 
                                                        onError={(e: any) => { e.target.src = "/placeholder.png"; }}
                                                    />
                                                )}
                                                <button 
                                                    onClick={() => removeFile(i)}
                                                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                                                >
                                                    <span className="material-symbols-outlined text-sm font-black">close</span>
                                                </button>
                                            </div>
                                        ))}

                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="h-full min-h-[200px] rounded-[2rem] border-2 border-dashed border-surface-container hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-4 group"
                                        >
                                            <div className="w-14 h-14 rounded-full bg-surface-container/30 flex items-center justify-center text-outline group-hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black text-primary uppercase leading-tight">Add Visuals</p>
                                                <p className="text-[9px] font-bold text-outline tracking-widest mt-1 uppercase">Images or Videos</p>
                                            </div>
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            multiple 
                                            accept="image/*,video/*" 
                                            onChange={handleFileChange} 
                                            className="hidden" 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SIDEBAR SETTINGS */}
                        <div className="w-full md:w-80 space-y-8">
                            <div className="bg-surface p-8 rounded-[3rem] border border-surface-container shadow-sm space-y-8 sticky top-32">
                                <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-surface-container pb-4">Specifications</h3>
                                
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-outline">Total Price (INR)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-xs">₹</span>
                                                <input 
                                                    type="number"
                                                    value={formData.price || ''}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setFormData({...formData, price: val});
                                                    }}
                                                    placeholder="0"
                                                    className="w-full bg-background border border-surface-container rounded-2xl py-4 pl-8 pr-4 text-sm font-black focus:border-primary transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-outline">Rate / Sqft</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 font-black text-xs">₹</span>
                                                <input 
                                                    type="text"
                                                    readOnly
                                                    value={formData.price && formData.areaSqft ? Math.round(Number(formData.price) / Number(formData.areaSqft)).toLocaleString() : '—'}
                                                    placeholder="0"
                                                    className="w-full bg-surface-container/20 border border-surface-container rounded-2xl py-4 pl-8 pr-4 text-sm font-black text-outline/60 cursor-not-allowed transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-outline">BHK</label>
                                            <input 
                                                type="number"
                                                value={formData.bedrooms || ''}
                                                onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                                                className="w-full bg-background border border-surface-container rounded-2xl py-4 px-4 text-sm font-black focus:border-primary transition-all shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-outline">Bath</label>
                                            <input 
                                                type="number"
                                                value={formData.bathrooms || ''}
                                                onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                                                className="w-full bg-background border border-surface-container rounded-2xl py-4 px-4 text-sm font-black focus:border-primary transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-outline">Area (Sqft)</label>
                                        <input 
                                            type="number"
                                            placeholder="1,200"
                                            value={formData.areaSqft || ''}
                                            onChange={(e) => {
                                                const area = Number(e.target.value);
                                                setFormData({...formData, areaSqft: area});
                                            }}
                                            className="w-full bg-background border border-surface-container rounded-2xl py-4 px-4 text-sm font-black focus:border-primary transition-all shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-outline">Location</label>
                                        <div className="space-y-3">
                                            <input 
                                                placeholder="City (e.g. Chennai)"
                                                value={formData.city || ''}
                                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                                                className="w-full bg-background border border-surface-container rounded-2xl py-4 px-4 text-xs font-black focus:border-primary transition-all shadow-inner uppercase tracking-wider"
                                            />
                                            <input 
                                                placeholder="Locality (e.g. Adyar)"
                                                value={formData.locality || ''}
                                                onChange={(e) => setFormData({...formData, locality: e.target.value})}
                                                className="w-full bg-background border border-surface-container rounded-2xl py-4 px-4 text-xs font-black focus:border-primary transition-all shadow-inner uppercase tracking-wider"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-outline">Market Type</label>
                                        <select 
                                            value={formData.type || 'RESIDENTIAL_BUY'}
                                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                                            className="w-full bg-background border border-surface-container rounded-2xl py-4 px-4 text-xs font-black focus:border-primary transition-all shadow-inner appearance-none uppercase"
                                        >
                                            <option value="RESIDENTIAL_BUY">For Sale</option>
                                            <option value="RESIDENTIAL_RENT">To Rent</option>
                                            <option value="PLOT">Plot/Land</option>
                                            <option value="COMMERCIAL">Commercial</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-outline">Category</label>
                                        <select 
                                            value={formData.category || 'APARTMENT'}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            className="w-full bg-background border border-surface-container rounded-2xl py-4 px-4 text-xs font-black focus:border-primary transition-all shadow-inner appearance-none uppercase"
                                        >
                                            <option value="APARTMENT">Apartment</option>
                                            <option value="VILLA">Villa</option>
                                            <option value="INDEPENDENT_HOUSE">Ind. House</option>
                                            <option value="LAND">Land/Site</option>
                                            <option value="OFFICE">Office</option>
                                            <option value="PLOT">Plot</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

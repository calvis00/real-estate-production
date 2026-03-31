'use client';

import React from 'react';
import { ModalProvider, useModal } from '@/context/ModalContext';
import InquiryModal from './InquiryModal';

function GlobalInquiryModal() {
  const { isOpen, closeModal, type } = useModal();
  return <InquiryModal isOpen={isOpen} onClose={closeModal} type={type} />;
}

export default function GlobalModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      {children}
      <GlobalInquiryModal />
    </ModalProvider>
  );
}

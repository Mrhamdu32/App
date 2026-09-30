'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ 
  defaultText, 
  loadingText, 
  baseClass 
}: { 
  defaultText: string; 
  loadingText: string; 
  baseClass: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending} 
      className={`${baseClass} ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {pending ? loadingText : defaultText}
    </button>
  );
}
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { registerUser, loginUser } from '../core/services/auth.service';
import { UserProfile } from '../types';
// Import your supabase client instance here if you intend to use it:
import { supabase } from '../utils/supabaseClient'; 

interface Props {
  onAuthSuccess: (user: UserProfile) => void;
  lang: 'en' | 'am'; // Strict single-language routing context
}

/**
 * Authentication Engine Hook
 * Manages operational pipelines for profile registration, login verification,
 * input field binding validations, and active session persistence layers.
 */
export function useAuth({ onAuthSuccess, lang }: Props) {
  // --- VISUAL ROUTING STATES ---
  const [isRegistering, setIsRegistering] = useState(false);

  // --- CONTROLLED CORE FORM STATES ---
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState(''); 
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');

  // --- PASSWORD UPDATE STATES (FIXED: Added missing states) ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // --- STATUS & PROXIMAL FEEDBACK STATES ---
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Completely flushes multi-input field values upon 
   * state transitions or transaction completions.
   */
  const resetFormFields = () => {
    setIdentifier('');
    setFullName('');
    setPassword('');
    setBusinessName('');
    setLocation('');
    setEmail('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Reset notifications on workflow toggle
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setChangePasswordError('');
  }, [isRegistering]);

  /**
   * Orchestrates form payload serialization and communicates with downstream services.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // --- FORM FIELD VALIDATION GATES ---
    if (!identifier || !password || (isRegistering && !fullName)) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);

      if (isRegistering) {
        // --- REGISTRATION EXECUTION ENGINE ---
        const newUser: UserProfile = {
          id: `usr-${Date.now()}`,
          identifier,
          full_name: fullName.trim(),
          email: email.trim() || null,
          password,
          role: 'admin', // Registrants default to Business Owners ('admin')
          shop_id: '',  
          businessName: businessName.trim(), 
          location: location.trim(),         
          approved: false, 
          createdBy: undefined 
        };

        // Persist multi-table structural data down to database layer
        await registerUser(newUser);

        setSuccessMsg('Registration submitted! Awaiting administrator approval.');

        // Trap pending state configuration profile inside client session storage
        localStorage.setItem('debter_v1_current_user', JSON.stringify(newUser));
        
        resetFormFields();
        onAuthSuccess(newUser);

      } else {
        // --- AUTHENTICATION LOGIN ENGINE ---
        const data = await loginUser(identifier.trim(), password);

        const user: UserProfile = {
          id: data.id,
          identifier: data.identifier,
          full_name: data.full_name, 
          email: data.email || null,
          password: data.password,
          role: data.role,
          shop_id: data.shop_id || '', 
          businessName: data.businessName,
          approved: !!data.approved,
          createdBy: data.createdBy,
          must_change_password: !!data.must_change_password
        };

        // If user must change password, toggle the state indicator
        if (user.must_change_password) {
          setMustChangePassword(true);
        }

        // Cache authentic profile parameters
        localStorage.setItem('debter_v1_current_user', JSON.stringify(user));
        onAuthSuccess(user);
      }
    } catch (err) {
      console.error("Authentication lifecycle fault encountered:", err);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected authentication error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Verifies if an identifier matches an existing registration record.
   */
  const verifyUserExists = async (inputIdentifier: string): Promise<boolean> => {
    if (!inputIdentifier || inputIdentifier.trim() === '') {
      console.log("[AuthEngine] Rejecting verification: Identifier is empty.");
      return false;
    }
    const cleanId = inputIdentifier.trim();

    try {
      const client = typeof supabase !== 'undefined' ? supabase : (window as any).supabase;
      
      if (client) {
        const { data, error } = await client
          .from('users')
          .select('id, identifier, email, must_change_password')
          .or(`identifier.eq.${cleanId},email.eq.${cleanId}`)
          .maybeSingle();

        if (!error && data && data.must_change_password === true) {
          return true;
        }
      }
    } catch (dbError) {
      console.error("[AuthEngine] Uncaught exception during database lookup:", dbError);
    }

    // Fallback Check
    try {
      const mockDbUser = localStorage.getItem('debter_v1_current_user');
      if (mockDbUser) {
        const parsed = JSON.parse(mockDbUser);
        const storedIdentifier = (parsed.identifier || '').toString().trim();
        const storedEmail = (parsed.email || '').toString().trim();

        if ((cleanId === storedIdentifier || cleanId === storedEmail) && parsed.must_change_password === true) {
          return true;
        }
      }
    } catch (storageError) {
      console.warn("[AuthEngine] Local context parsing exception:", storageError);
    }
    
    return false; 
  };

 // Inside src/hooks/useAuth.ts -> handleChangePasswordSubmit
const handleChangePasswordSubmit = async (e: React.FormEvent, t?:any) => {
  e.preventDefault(); 
  setChangePasswordError('');
  // Make sure to clear any lingering success messages at the start of a new attempt
  if (setSuccessMsg) setSuccessMsg(''); 

  if (!newPassword || !confirmPassword) {
    setChangePasswordError('Please fill in all password fields.');
    return;
  }

  if (newPassword !== confirmPassword) {
    setChangePasswordError('Passwords do not match.');
    return;
  }

  setChangePasswordLoading(true);
  try {
    const client = typeof supabase !== 'undefined' ? supabase : (window as any).supabase;
    if (!client) throw new Error("Database client unavailable.");

    // Update your users table matching the current identifier
    const { error } = await client
      .from('users')
      .update({ 
        password: newPassword, 
        must_change_password: false 
      })
      .eq('identifier', identifier.trim()); // Matches phone or email string

    if (error) throw error;
    
    // Close the modal state and clear sensitive field variables
    setMustChangePassword(false);
    resetFormFields();

    // Set the state success message instead of a breaking browser alert
    if (setSuccessMsg) {
      setSuccessMsg(t?.successAlert);
    }
  } catch (err: any) {
    setChangePasswordError(err.message || 'Failed to update password.');
  } finally {
    setChangePasswordLoading(false);
  }
};

 return {
    state: {
      isRegistering,
      identifier,
      fullName, 
      password,
      email,
      businessName,
      location, 
      errorMsg,
      successMsg,
      loading,
      newPassword,
      confirmPassword,
      changePasswordError,
      changePasswordLoading,
      mustChangePassword
    },
    actions: {
      setIsRegistering,
      setIdentifier,
      setFullName, 
      setPassword,
      setEmail,
      setBusinessName,
      setLocation, 
      // 🔥 FIXED: Added these state setters so Auth.tsx can safely call them
      setNewPassword,
      setConfirmPassword,
      setMustChangePassword,
      setChangePasswordError,
      handleSubmit,
      verifyUserExists,
      updatePassword: handleChangePasswordSubmit
    }
  };
}

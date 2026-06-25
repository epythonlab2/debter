// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { registerUser, loginUser } from '../core/services/auth.service';
import { UserProfile } from '../types';
import { supabase } from '../utils/supabaseClient'; 

interface Props {
  onAuthSuccess: (user: UserProfile) => void;
  lang: 'en' | 'am'; // Strict single-language routing context
}

/**
 * Authentication & Administrative Engine Hook
 * Manages operational pipelines for profile registration, login verification,
 * data synchronization, and security profile structural modifications.
 */
export function useAuth({ onAuthSuccess, lang }: Props) {
  // --- SESSION PROFILE STATE ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const persisted = localStorage.getItem('debter_v1_current_user');
      return persisted ? JSON.parse(persisted) : null;
    } catch {
      return null;
    }
  });

  // --- VISUAL ROUTING STATES ---
  const [isRegistering, setIsRegistering] = useState(false);

  // --- CONTROLLED CORE FORM STATES ---
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState(''); 
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');

  // --- PASSWORD UPDATE STATES ---
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

  // Reset notification frames cleanly on workflow context toggle
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setChangePasswordError('');
  }, [isRegistering]);

  /**
   * Orchestrates credentials validation, payload construction, 
   * and upstream/downstream authentication pipelines.
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
          approved: true, 
          createdBy: undefined 
        };

        // Persist multi-table structural data down to database layer
        await registerUser(newUser);

        // Define localized feedback depending on language routing context
        const message = lang === 'am' 
          ? 'ምዝገባው ተጠናቋል። እባክዎ ለመግባት የይለፍ ቃልዎን ያስገቡ።' 
          : 'Registration successful! Please login with your password.';
          
        setSuccessMsg(message);

      } else {
        // --- AUTHENTICATION LOGIN ENGINE ---
        const data = await loginUser(identifier.trim(), password, lang);
        
        const user: UserProfile = {
          id: data.id,
          identifier: data.identifier,
          full_name: data.full_name, 
          email: data.email || null,
          password: data.password,
          role: data.role,
          shop_id: data.shop_id || '', 
          businessName: data.businessName,
          location: data.location || '',
          approved: !!data.approved,
          createdBy: data.createdBy,
          must_change_password: !!data.must_change_password
        };

        if (user.must_change_password) {
          setMustChangePassword(true);
        }

        localStorage.setItem('debter_v1_current_user', JSON.stringify(user));
        setCurrentUser(user);
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

  /**
   * Handles immediate force-change password actions required at first login.
   */
  const handleChangePasswordSubmit = async (e: React.FormEvent, t?: any) => {
    e.preventDefault(); 
    setChangePasswordError('');
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

      const { error } = await client
        .from('users')
        .update({ 
          password: newPassword, 
          must_change_password: false 
        })
        .eq('identifier', identifier.trim());

      if (error) throw error;
      
      setMustChangePassword(false);
      resetFormFields();

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
      currentUser,
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
      setNewPassword,
      setConfirmPassword,
      setMustChangePassword,
      setChangePasswordError,
      handleSubmit,
      verifyUserExists,
      resetFormFields,
      updatePassword: handleChangePasswordSubmit,
      
    }
  };
}

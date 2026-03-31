'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUnifiedAccount } from '@/lib/actions/unified-signup';
import { getErrorMessage } from '@/lib/auth-errors';
import { UnifiedSignupInputSchema, type UnifiedSignupInput } from '@/lib/schemas/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Eye, EyeOff, AlertCircle, Check, Plus, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { logger } from '@/lib/logger';
const log = logger.scope('auth/unified-signup-form');

/**
 * Parse optional numeric input - returns undefined for empty/invalid values
 */
function parseOptionalNumber(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

export function UnifiedSignupForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const form = useForm<UnifiedSignupInput>({
    resolver: zodResolver(UnifiedSignupInputSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      professionalTitle: '',
      bio: '',
      currentEmployer: '',
      location: '',
      linkedInProfile: '',
      education: [],
      credentials: [],
      organizationAffiliations: [],
      specializations: [],
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;

  // Watch fields for dynamic UI (education, credentials available if needed)
  const organizationAffiliations = watch('organizationAffiliations') || [];
  const specializations = watch('specializations') || [];

  // Inline input states for Step 2
  const [showAffiliationInput, setShowAffiliationInput] = useState(false);
  const [affiliationInput, setAffiliationInput] = useState('');
  const [showSpecializationInput, setShowSpecializationInput] = useState(false);
  const [specializationInput, setSpecializationInput] = useState('');

  const totalSteps = 2;
  const progress = (step / totalSteps) * 100;

  // Step validation
  function validateCurrentStep(): boolean {
    if (step === 1) {
      const email = watch('email');
      const password = watch('password');
      const confirmPassword = watch('confirmPassword');
      const name = watch('name');

      if (!email || !password || !confirmPassword || !name) {
        setError('Please fill in all required fields');
        return false;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
    }

    setError(null);
    return true;
  }

  function handleNext(e?: React.MouseEvent<HTMLButtonElement>) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    log.debug('🔵 handleNext called', { currentStep: step });
    if (!validateCurrentStep()) return;
    if (step < totalSteps) {
      setStep(step + 1);
      setError(null);
    }
  }

  function handlePrevious(e?: React.MouseEvent<HTMLButtonElement>) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    log.debug('🔵 handlePrevious called', { currentStep: step });
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  }

  // Prevent Enter from auto-submitting form
  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    log.debug('⌨️ KeyDown on form', {
      key: e.key,
      target: (e.target as HTMLElement).tagName,
      targetType: (e.target as HTMLElement).getAttribute('type'),
      isButton: (e.target as HTMLElement).tagName === 'BUTTON'
    });

    if (e.key === 'Enter' && e.target !== e.currentTarget) {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'BUTTON' || target.getAttribute('type') !== 'submit') {
        log.debug('⌨️ Preventing default Enter behavior');
        e.preventDefault();
      }
    }
  }

  async function onSubmit(values: UnifiedSignupInput) {
    // Prevent duplicate submissions
    if (loading) {
      log.debug('Form submission already in progress, ignoring duplicate submission');
      return;
    }

    log.debug('🚀 FORM SUBMITTED!', {
      step,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(0, 5).join('\n')
    });

    if (!validateCurrentStep()) return;

    setLoading(true);
    setError(null);

    try {
      log.debug('Starting unified account creation...', {
        email: values.email,
        hasName: !!values.name,
        hasPassword: !!values.password,
      });

      // Call unified account creation server action
      const result = await createUnifiedAccount(values);

      // SECURITY: Do not log result object (contains PII)
      log.debug('Account creation initiated');

      if (!result.success) {
        log.error('Account creation failed');
        setError(result.error || 'Failed to create account. Please try again.');
        return;
      }

      // Sign in with email and password
      if (result.userId) {
        log.debug('Account created successfully, signing in...');
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);

        // Send email verification
        log.debug('Sending email verification...');
        try {
          await sendEmailVerification(userCredential.user);
          log.debug('Verification email sent successfully');
        } catch (_verifyError) {
          // SECURITY: Do not log error object (may contain email)
          log.error('Failed to send verification email');
          // Don't fail the whole flow if email sending fails
        }

        log.debug('Sign-in successful, redirecting to /nucleus');
        // AuthProvider will automatically redirect to /nucleus
        router.push('/nucleus');
      } else {
        log.error('No userId received from account creation');
        setError('Account created but sign-in failed. Please try signing in manually.');
      }
    } catch (err: unknown) {
      // SECURITY: Log error type only, not full error object
      log.error('Unexpected error during sign-up');
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Helper functions for Step 2 arrays
  function saveAffiliation(e?: React.MouseEvent<HTMLButtonElement>) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    log.debug('💾 saveAffiliation called', { input: affiliationInput });
    if (affiliationInput.trim()) {
      setValue('organizationAffiliations', [...organizationAffiliations, affiliationInput.trim()]);
      setAffiliationInput('');
      setShowAffiliationInput(false);
    }
  }

  function removeAffiliation(index: number, e?: React.MouseEvent<HTMLButtonElement>) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    log.debug('🗑️ removeAffiliation called', { index });
    const updated = organizationAffiliations.filter((_, i) => i !== index);
    setValue('organizationAffiliations', updated);
  }

  function saveSpecialization(e?: React.MouseEvent<HTMLButtonElement>) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    log.debug('💾 saveSpecialization called', { input: specializationInput });
    if (specializationInput.trim()) {
      setValue('specializations', [...specializations, specializationInput.trim()]);
      setSpecializationInput('');
      setShowSpecializationInput(false);
    }
  }

  function removeSpecialization(index: number, e?: React.MouseEvent<HTMLButtonElement>) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    log.debug('🗑️ removeSpecialization called', { index });
    const updated = specializations.filter((_, i) => i !== index);
    setValue('specializations', updated);
  }

  return (
    <Card className="w-full max-w-3xl mx-auto bg-nex-dark border-cyan/30">
      <CardHeader>
        <div className="mb-4" role="region" aria-label="Form progress">
          <Progress
            value={progress}
            className="h-2 bg-nex-light"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label="Form completion progress"
          >
            <div
              className="h-full bg-gradient-to-r from-cyan to-cyan-glow transition-all duration-300"
              aria-hidden="true"
              style={{ width: `${progress}%` }}
            />
          </Progress>
          <p className="text-sm text-cyan-soft/70 mt-2" aria-live="polite" aria-atomic="true">
            Step {step} of {totalSteps}
          </p>
        </div>
        <CardTitle className="text-2xl text-white">
          {step === 1 && 'Create Your Account'}
          {step === 2 && 'Complete Your Profile'}
        </CardTitle>
        <CardDescription className="text-cyan-soft/60">
          {step === 1 && 'Enter your account credentials and basic information'}
          {step === 2 && 'Add your professional details (all optional)'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Account & Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-cyan-soft">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="off"
                  {...register('email')}
                  className="bg-nex-surface border-cyan/30 text-white"
                />
                {errors.email && (
                  <p className="text-sm text-red-400 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="name" className="text-cyan-soft">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  autoComplete="off"
                  {...register('name')}
                  className="bg-nex-surface border-cyan/30 text-white"
                />
                {errors.name && (
                  <p className="text-sm text-red-400 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-cyan-soft">
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    {...register('password')}
                    className="bg-nex-surface border-cyan/30 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-glow hover:text-cyan-soft"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-cyan-soft">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    className="bg-nex-surface border-cyan/30 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-glow hover:text-cyan-soft"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Complete Profile (All Optional) */}
          {step === 2 && (
            <div className="space-y-6">
              <Alert className="bg-cyan/10 border-cyan/30">
                <Check className="h-4 w-4 text-cyan-glow" />
                <AlertDescription className="text-cyan-soft/80">
                  All fields on this page are optional. Fill out what you're comfortable with!
                </AlertDescription>
              </Alert>

              {/* Professional Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="professionalTitle" className="text-cyan-soft">
                    Professional Title
                  </Label>
                  <Input
                    id="professionalTitle"
                    type="text"
                    placeholder="e.g., Clinical Pharmacist"
                    {...register('professionalTitle')}
                    className="bg-nex-surface border-cyan/30 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="bio" className="text-cyan-soft">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about your professional background..."
                    {...register('bio')}
                    className="bg-nex-surface border-cyan/30 text-white min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentEmployer" className="text-cyan-soft">
                      Current Employer
                    </Label>
                    <Input
                      id="currentEmployer"
                      type="text"
                      placeholder="Hospital or Organization"
                      {...register('currentEmployer')}
                      className="bg-nex-surface border-cyan/30 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-cyan-soft">
                      Location
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="City, State/Country"
                      {...register('location')}
                      className="bg-nex-surface border-cyan/30 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearsOfExperience" className="text-cyan-soft">
                      Years of Experience
                    </Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      placeholder="e.g., 5"
                      {...register('yearsOfExperience', {
                        setValueAs: parseOptionalNumber
                      })}
                      className="bg-nex-surface border-cyan/30 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="linkedInProfile" className="text-cyan-soft">
                      LinkedIn Profile
                    </Label>
                    <Input
                      id="linkedInProfile"
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      {...register('linkedInProfile')}
                      className="bg-nex-surface border-cyan/30 text-white"
                    />
                  </div>
                </div>

                {/* Organization Affiliations */}
                <div>
                  <Label className="text-cyan-soft mb-2 block">Organization Affiliations</Label>
                  {organizationAffiliations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {organizationAffiliations.map((org, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1 bg-nex-surface border border-cyan/30 rounded-md text-white text-sm"
                        >
                          <span>{org}</span>
                          <button
                            type="button"
                            onClick={(e) => removeAffiliation(index, e)}
                            className="text-cyan-glow hover:text-red-400 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {showAffiliationInput ? (
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Enter organization name"
                        aria-label="Organization name"
                        value={affiliationInput}
                        onChange={(e) => setAffiliationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveAffiliation();
                          }
                          if (e.key === 'Escape') {
                            setShowAffiliationInput(false);
                            setAffiliationInput('');
                          }
                        }}
                        className="bg-nex-surface border-cyan/30 text-white"
                        autoFocus
                      />
                      <Button type="button" size="sm" onClick={(e) => saveAffiliation(e)}>
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          log.debug('🔘 Cancel Affiliation button clicked');
                          setShowAffiliationInput(false);
                          setAffiliationInput('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        log.debug('🔘 Add Affiliation button clicked');
                        setShowAffiliationInput(true);
                      }}
                      className="border-cyan/30 text-cyan-soft"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Affiliation
                    </Button>
                  )}
                </div>

                {/* Specializations */}
                <div>
                  <Label className="text-cyan-soft mb-2 block">Specializations</Label>
                  {specializations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {specializations.map((spec, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1 bg-nex-surface border border-cyan/30 rounded-md text-white text-sm"
                        >
                          <span>{spec}</span>
                          <button
                            type="button"
                            onClick={(e) => removeSpecialization(index, e)}
                            className="text-cyan-glow hover:text-red-400 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {showSpecializationInput ? (
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Enter specialization"
                        aria-label="Specialization"
                        value={specializationInput}
                        onChange={(e) => setSpecializationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveSpecialization();
                          }
                          if (e.key === 'Escape') {
                            setShowSpecializationInput(false);
                            setSpecializationInput('');
                          }
                        }}
                        className="bg-nex-surface border-cyan/30 text-white"
                        autoFocus
                      />
                      <Button type="button" size="sm" onClick={(e) => saveSpecialization(e)}>
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          log.debug('🔘 Cancel Specialization button clicked');
                          setShowSpecializationInput(false);
                          setSpecializationInput('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        log.debug('🔘 Add Specialization button clicked');
                        setShowSpecializationInput(true);
                      }}
                      className="border-cyan/30 text-cyan-soft"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Specialization
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => handlePrevious(e)}
                  disabled={loading}
                  className="border-cyan/30 text-cyan-soft"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={(e) => handleNext(e)}
                  disabled={loading}
                  className="bg-cyan-dark hover:bg-cyan-dark/80 text-white"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-cyan-dark hover:bg-cyan-dark/80 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Sign In Link */}
          {step === 1 && (
            <div className="text-center pt-4 border-t border-cyan/20">
              <p className="text-sm text-cyan-soft/60">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-cyan-glow hover:text-cyan-soft font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

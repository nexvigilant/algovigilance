'use client';

import { useEffect, useState } from 'react';
import { type FieldValues, type Path, type Control, type ControllerRenderProps } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// ============================================================================
// Form Section Wrapper
// ============================================================================

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-light border-b border-nex-light/30 pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ============================================================================
// Contact Information Fields
// ============================================================================

interface ContactInfoFieldsProps<T extends FieldValues> {
  control: Control<T>;
  emailPlaceholder?: string;
  linkedInDescription?: string;
}

export function ContactInfoFields<T extends FieldValues>({
  control,
  emailPlaceholder = 'you@example.com',
  linkedInDescription = 'Optional but recommended',
}: ContactInfoFieldsProps<T>) {
  return (
    <FormSection title="Contact Information">
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField
          control={control}
          name={'firstName' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl>
                <Input placeholder="Your first name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={'lastName' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl>
                <Input placeholder="Your last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name={'email' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email *</FormLabel>
            <FormControl>
              <Input type="email" placeholder={emailPlaceholder} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={'linkedInProfile' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>LinkedIn Profile</FormLabel>
            <FormControl>
              <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
            </FormControl>
            <FormDescription>{linkedInDescription}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  );
}

// ============================================================================
// Motivation Text Field
// ============================================================================

interface MotivationFieldProps<T extends FieldValues> {
  control: Control<T>;
  label: string;
  placeholder: string;
  maxLength?: number;
  minLength?: number;
}

export function MotivationField<T extends FieldValues>({
  control,
  label,
  placeholder,
  maxLength = 500,
  minLength = 50,
}: MotivationFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={'motivation' as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label} *</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              className="min-h-[120px] resize-none"
              {...field}
            />
          </FormControl>
          <FormDescription>
            {field.value?.length || 0}/{maxLength} characters (minimum {minLength})
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ============================================================================
// Checkbox Group Field (for multi-select options)
// ============================================================================

interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxGroupFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description: string;
  options: CheckboxOption[];
}

export function CheckboxGroupField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  options,
}: CheckboxGroupFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem>
          <FormLabel>{label} *</FormLabel>
          <FormDescription>{description}</FormDescription>
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            {options.map((option) => (
              <FormField
                key={option.value}
                control={control}
                name={name}
                render={({ field }: { field: ControllerRenderProps<T, Path<T>> }) => {
                  const currentValue = (field.value as string[]) || [];
                  return (
                    <FormItem
                      key={option.value}
                      className="flex items-center space-x-2 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={currentValue.includes(option.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...currentValue, option.value]);
                            } else {
                              field.onChange(currentValue.filter((v) => v !== option.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        {option.label}
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ============================================================================
// Form Submit Button
// ============================================================================

interface FormSubmitButtonProps {
  isPending: boolean;
  variant?: 'cyan' | 'gold';
  loadingText?: string;
  submitText?: string;
}

export function FormSubmitButton({
  isPending,
  variant = 'cyan',
  loadingText = 'Submitting...',
  submitText = 'Submit Application',
}: FormSubmitButtonProps) {
  const colorClass =
    variant === 'gold'
      ? 'bg-gold hover:bg-gold-bright text-nex-deep'
      : 'bg-cyan hover:bg-cyan-glow text-nex-deep';

  return (
    <Button
      type="submit"
      size="lg"
      className={`w-full ${colorClass}`}
      disabled={isPending}
      aria-busy={isPending}
      aria-disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        submitText
      )}
    </Button>
  );
}

// ============================================================================
// Form Success State with Celebration Animation
// ============================================================================

interface FormSuccessStateProps {
  message: string;
  title?: string;
  variant?: 'cyan' | 'gold';
}

// Confetti particle component
function ConfettiParticle({
  delay,
  x,
  color,
}: {
  delay: number;
  x: number;
  color: string;
}) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color, left: `${x}%` }}
      initial={{ y: -10, opacity: 1, scale: 1, rotate: 0 }}
      animate={{
        y: [0, 150, 250],
        opacity: [1, 1, 0],
        scale: [1, 1.2, 0.5],
        rotate: [0, 180, 360],
        x: [0, (Math.random() - 0.5) * 100],
      }}
      transition={{
        duration: 2.5,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

export function FormSuccessState({
  message,
  title = 'Application Submitted!',
  variant = 'cyan',
}: FormSuccessStateProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const accentColor = variant === 'gold' ? '#D4AF37' : '#00D4FF';
  const confettiColors = variant === 'gold'
    ? ['#D4AF37', '#FFD700', '#B8860B', '#FFF8DC', '#DAA520']
    : ['#00D4FF', '#00BFFF', '#87CEEB', '#E0FFFF', '#00CED1'];

  return (
    <motion.div
      className="relative text-center py-12 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Confetti burst */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-x-0 top-0 h-full pointer-events-none overflow-hidden">
            {confettiColors.flatMap((color, colorIndex) =>
              Array.from({ length: 8 }).map((_, i) => (
                <ConfettiParticle
                  key={`${colorIndex}-${i}`}
                  delay={i * 0.08 + colorIndex * 0.05}
                  x={10 + (i * 10) + (colorIndex * 3)}
                  color={color}
                />
              ))
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Success icon with pulse animation */}
      <motion.div
        className="relative inline-flex items-center justify-center w-20 h-20 mb-6"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
      >
        {/* Animated rings */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ borderColor: accentColor }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: 2,
            ease: 'easeOut',
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: `${accentColor}20` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            delay: 0.3,
          }}
        >
          <CheckCircle className="h-10 w-10" style={{ color: accentColor }} />
        </motion.div>

        {/* Sparkle decorations */}
        <motion.div
          className="absolute -top-1 -right-1"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Sparkles className="h-4 w-4" style={{ color: accentColor }} />
        </motion.div>
      </motion.div>

      {/* Title with stagger animation */}
      <motion.h3
        className="text-2xl font-semibold text-white mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {title}
      </motion.h3>

      {/* Message */}
      <motion.p
        className="text-slate-dim max-w-md mx-auto text-base leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {message}
      </motion.p>

      {/* Decorative underline */}
      <motion.div
        className="mt-6 mx-auto h-1 rounded-full"
        style={{ backgroundColor: accentColor }}
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 80, opacity: 0.6 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      />
    </motion.div>
  );
}

// ============================================================================
// Form Error Alert
// ============================================================================

interface FormErrorAlertProps {
  message: string;
}

export function FormErrorAlert({ message }: FormErrorAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

// ============================================================================
// Form Footer Terms
// ============================================================================

interface FormFooterTermsProps {
  variant?: 'cyan' | 'gold';
}

export function FormFooterTerms({ variant = 'cyan' }: FormFooterTermsProps) {
  const linkClass = variant === 'gold' ? 'text-gold hover:underline' : 'text-cyan hover:underline';

  return (
    <p className="text-xs text-slate-dim text-center">
      By submitting, you agree to our{' '}
      <a href="/privacy" className={linkClass}>
        Privacy Policy
      </a>{' '}
      and{' '}
      <a href="/terms" className={linkClass}>
        Terms of Service
      </a>
      .
    </p>
  );
}

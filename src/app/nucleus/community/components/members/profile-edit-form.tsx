"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Save,
  X,
  User,
  Briefcase,
  Building2,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
} from "lucide-react";
import { VoiceLoading } from "@/components/voice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  updateProfile,
  getCurrentUserProfile,
  updateAvatar,
} from "../../actions/user/profile";
import { trackEvent } from "@/lib/analytics";
import { AvatarUploader } from "./avatar-uploader";
import { useAuth } from "@/hooks/use-auth";

const ProfileFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name too long"),
  bio: z.string().max(500, "Bio too long (max 500 characters)").optional(),
  title: z.string().max(100, "Title too long").optional(),
  organization: z.string().max(100, "Organization name too long").optional(),
  location: z.string().max(100, "Location too long").optional(),
  website: z.string().url("Invalid URL").or(z.literal("")).optional(),
  linkedIn: z.string().url("Invalid LinkedIn URL").or(z.literal("")).optional(),
  twitter: z.string().url("Invalid Twitter URL").or(z.literal("")).optional(),
});

type ProfileFormData = z.infer<typeof ProfileFormSchema>;

interface ProfileEditFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileEditForm({ onSuccess, onCancel }: ProfileEditFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileFormSchema),
  });

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    try {
      const result = await getCurrentUserProfile();
      if (result.success && result.profile) {
        reset({
          name: result.profile.name,
          bio: result.profile.bio || "",
          title: result.profile.title || "",
          organization: result.profile.organization || "",
          location: result.profile.location || "",
          website: result.profile.website || "",
          linkedIn: result.profile.linkedIn || "",
          twitter: result.profile.twitter || "",
        });
        setCurrentAvatar(result.profile.avatar || "");
      } else {
        setError(result.error || "Failed to load profile");
      }
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(data: ProfileFormData) {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateProfile(data);

      if (result.success) {
        trackEvent("profile_updated", {
          route: "/nucleus/community/settings/profile",
        });
        setSuccess(true);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.refresh();
          }
        }, 1500);
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarUpload(url: string) {
    try {
      const result = await updateAvatar(url);
      if (result.success) {
        setCurrentAvatar(url);
      } else {
        setError(result.error || "Failed to update avatar");
      }
    } catch (err) {
      setError("Failed to update avatar");
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  }

  if (isLoading) {
    return (
      <Card className="holographic-card">
        <CardContent className="p-8">
          <VoiceLoading
            context="profile"
            variant="spinner"
            message="Loading profile..."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="holographic-card">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>
          Update your public profile information
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-cyan bg-cyan/10 text-cyan">
              <AlertDescription>Profile updated successfully!</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <User className="h-5 w-5" />
              Basic Information
            </h3>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Your name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...register("bio")}
                placeholder="Tell us about yourself..."
                rows={4}
                className={errors.bio ? "border-red-500" : ""}
              />
              {errors.bio && (
                <p className="text-sm text-red-500">{errors.bio.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Max 500 characters
              </p>
            </div>

            {/* Avatar Upload */}
            {user?.uid && (
              <AvatarUploader
                currentAvatar={currentAvatar}
                userId={user.uid}
                onUploadComplete={handleAvatarUpload}
                disabled={isSaving}
              />
            )}
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Briefcase className="h-5 w-5" />
              Professional Information
            </h3>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="e.g., Clinical Research Associate"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Organization */}
            <div className="space-y-2">
              <Label htmlFor="organization" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organization
              </Label>
              <Input
                id="organization"
                {...register("organization")}
                placeholder="e.g., Acme Pharmaceuticals"
                className={errors.organization ? "border-red-500" : ""}
              />
              {errors.organization && (
                <p className="text-sm text-red-500">
                  {errors.organization.message}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="e.g., Boston, MA"
                className={errors.location ? "border-red-500" : ""}
              />
              {errors.location && (
                <p className="text-sm text-red-500">
                  {errors.location.message}
                </p>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Globe className="h-5 w-5" />
              Social Links
            </h3>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...register("website")}
                placeholder="https://yourwebsite.com"
                className={errors.website ? "border-red-500" : ""}
              />
              {errors.website && (
                <p className="text-sm text-red-500">{errors.website.message}</p>
              )}
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedIn" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Label>
              <Input
                id="linkedIn"
                {...register("linkedIn")}
                placeholder="https://linkedin.com/in/yourprofile"
                className={errors.linkedIn ? "border-red-500" : ""}
              />
              {errors.linkedIn && (
                <p className="text-sm text-red-500">
                  {errors.linkedIn.message}
                </p>
              )}
            </div>

            {/* Twitter */}
            <div className="space-y-2">
              <Label htmlFor="twitter" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter
              </Label>
              <Input
                id="twitter"
                {...register("twitter")}
                placeholder="https://twitter.com/yourhandle"
                className={errors.twitter ? "border-red-500" : ""}
              />
              {errors.twitter && (
                <p className="text-sm text-red-500">{errors.twitter.message}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !isDirty}
              className="hover:bg-cyan-dark/80 bg-cyan"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

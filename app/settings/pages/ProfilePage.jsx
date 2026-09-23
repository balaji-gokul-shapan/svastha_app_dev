"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const SignatureField = dynamic(() => import("../components/SignatureField"), {
  ssr: false,
});
import ImageCropper from "@/components/imageCropper";
import { Input } from "@/components/ui/input";
import FormField from "../components/FormField";
import {
  Camera,
  Check,
  CircleUserRound,
  Edit2,
  Eye,
  EyeOff,
  Info,
  Phone,
  UserRound,
  UserRoundKey,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordStrengthMeter } from "../components/PasswordStrengthMeter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { changePassword } from "@/lib/features/changePasswordSlice";
import { updateProfile } from "@/lib/features/registerStaffAccount";
import { useAppDispatch } from "@/lib/hooks";
import { toast } from "sonner";
import { changePasswordSchema } from "../validation/change-password-schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ProfilePage = ({
  profileImageFile,
  setProfileImageFile,
  profileInputRef,
  imagePreviewUrl,
  setImagePreviewUrl,
  name,
  username,
  password = "********",
  signature = "",
  onChange,
  phoneNumber,
}) => {
  const [imageError, setImageError] = useState("");
  const [showCropper, setShowCropper] = useState(false);

  // ---- Change Password dialog (dispatches `changePassword` thunk) ----
  const dispatch = useAppDispatch();
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const resetPasswordDialog = () => {
    setPwCurrent("");
    setPwNew("");
    setPwConfirm("");
    setFormErrors({});
    setPwSubmitting(false);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handlePasswordOpenChange = (open) => {
    setIsPasswordOpen(open);
    if (!open) {
      resetPasswordDialog();
    }
  };

  const maskedPhoneNumber = phoneNumber
    ? phoneNumber.replace(/.(?=.{4})/g, "*")
    : "";

  // ---- Inline name editing: pencil → text field → Save/Cancel ----
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const startEditingName = () => {
    setNameDraft(String(name ?? ""));
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setNameDraft("");
  };

  const saveName = async () => {
    const trimmed = nameDraft.trim();

    if (!trimmed) {
      toast.error("Name is required.");
      return;
    }

    if (isSavingName) return;

    // Unchanged value — just close the editor.
    if (trimmed === String(name ?? "").trim()) {
      cancelEditingName();
      return;
    }

    try {
      setIsSavingName(true);
      await dispatch(updateProfile({ name: trimmed })).unwrap();

      // Sync the parent's settingsFormData so the header and the Profile
      // form field both pick up the new value (this also marks the field as
      // touched, so the auth re-sync effect won't overwrite it).
      onChange?.("name", trimmed);

      toast.success("Name updated successfully.");
      cancelEditingName();
    } catch (error) {
      const message =
        typeof error === "object" && error !== null
          ? error?.message || error?.detail || "Unable to update name."
          : error || "Unable to update name.";
      toast.error(message);
    } finally {
      setIsSavingName(false);
    }
  };

  const [isEditingPhoneNumber, setIsEditingPhoneNumber] = useState(false);
  const [phoneNumberDraft, setPhoneNumberDraft] = useState("");
  const [isSavingPhoneNumber, setIsSavingPhoneNumber] = useState(false);

  // ---- Inline password editing: pencil → text field → Save/Cancel ----
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const startEditingPassword = () => {
    setPasswordDraft("");
    setIsEditingPassword(true);
  };

  const cancelEditingPassword = () => {
    setIsEditingPassword(false);
    setPasswordDraft("");
  };
  const savePassword = () => {
    const trimmed = passwordDraft.trim();

    if (!trimmed) {
      toast.error("Password is required.");
      return;
    }

    setPwNew(trimmed);
    setFormErrors({});
    cancelEditingPassword();
    setIsPasswordOpen(true);
  };

  const startEditingPhoneNumber = () => {
    setPhoneNumberDraft(String(phoneNumber ?? ""));
    setIsEditingPhoneNumber(true);
  };

  const cancelEditingPhoneNumber = () => {
    setIsEditingPhoneNumber(false);
    setPhoneNumberDraft("");
  };

  const savePhoneNumber = async () => {
    const trimmed = phoneNumberDraft.trim();

    if (!trimmed) {
      toast.error("Phone number is required.");
      return;
    }

    if (isSavingPhoneNumber) return;

    // Unchanged value — just close the editor.
    if (trimmed === String(phoneNumber ?? "").trim()) {
      cancelEditingPhoneNumber();
      return;
    }

    try {
      setIsSavingPhoneNumber(true);
      // Field name matches the backend convention used by sub-account/create.
      await dispatch(updateProfile({ phone_number: trimmed })).unwrap();

      // Sync the parent's settingsFormData so the masked display and the
      // Profile form field both pick up the new value.
      onChange?.("phoneNumber", trimmed);

      toast.success("Phone number updated successfully.");
      cancelEditingPhoneNumber();
    } catch (error) {
      const message =
        typeof error === "object" && error !== null
          ? error?.message || error?.detail || "Unable to update phone number."
          : error || "Unable to update phone number.";
      toast.error(message);
    } finally {
      setIsSavingPhoneNumber(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwSubmitting) return;

    const formValues = {
      current_password: pwCurrent,
      new_password: pwNew,
      confirm_password: pwConfirm,
    };

    const result = changePasswordSchema.safeParse(formValues);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;

      // Reduce to { fieldName: firstMessage } for inline display.
      const firstPerField = Object.fromEntries(
        Object.entries(errors)
          .map(([field, messages]) => [field, messages?.[0]])
          .filter(([, message]) => Boolean(message)),
      );

      setFormErrors(firstPerField);

      const firstError = Object.values(firstPerField).find(Boolean);
      toast.error(firstError || "Please fill all required fields.");

      return;
    }

    setFormErrors({});

    try {
      setPwSubmitting(true);
      await dispatch(
        changePassword({
          current_password: pwCurrent,
          new_password: pwNew,
          confirm_password: pwConfirm,
        }),
      ).unwrap();

      setPwSubmitting(false);
      toast.success("Password updated successfully.");
      // Briefly keep the dialog open to show the toast, then close it.
      window.setTimeout(() => {
        setIsPasswordOpen(false);
        resetPasswordDialog();
      }, 900);
    } catch (error) {
      setPwSubmitting(false);
      const message =
        typeof error === "object" && error !== null
          ? error?.message || error?.detail || "Unable to change password."
          : error || "Unable to change password.";
      toast.error(message);
    }
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();

    if (isSavingProfile) return;

    const trimmedName = String(name ?? "").trim();
    const trimmedUsername = String(username ?? "").trim();

    if (!trimmedName) {
      toast.error("Name is required.");
      return;
    }

    if (!trimmedUsername) {
      toast.error("Username is required.");
      return;
    }

    const payload = {
      name: trimmedName,
      username: trimmedUsername,
      signature: signature ?? "",
    };

    try {
      setIsSavingProfile(true);
      await dispatch(updateProfile(payload)).unwrap();
      toast.success("Profile updated successfully.");
    } catch (error) {
      const message =
        typeof error === "object" && error !== null
          ? error?.message || error?.detail || "Unable to update profile."
          : error || "Unable to update profile.";
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openProfilePicker = () => {
    profileInputRef.current?.click();
  };

  const handleProfileImageUpload = (event) => {
    const file = event.target.files?.[0];

    setImageError("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please choose a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Profile image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    // Remove previous preview URL
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);

    setProfileImageFile(file);
    setImagePreviewUrl(previewUrl);

    // Open cropper
    setShowCropper(true);

    // Allow selecting the same file again
    event.target.value = "";
  };

  const handleCroppedImage = (croppedFile) => {
    // Remove original image preview
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const croppedUrl = URL.createObjectURL(croppedFile);

    setProfileImageFile(croppedFile);
    setImagePreviewUrl(croppedUrl);
  };

  const clearProfileImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setProfileImageFile(null);
    setImagePreviewUrl("");
    setShowCropper(false);
    setImageError("");

    if (profileInputRef.current) {
      profileInputRef.current.value = "";
    }
  };

  return (
    <article className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <h3 className="text-lg font-semibold text-foreground">Profile</h3>

      <p className="mt-1 text-sm text-muted-foreground">
        Update your personal details and contact information.
      </p>

      {/* Profile Image */}
      <div className="flex flex-col items-start gap-3 p-5">
        <div className="flex w-full min-w-0 flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={openProfilePicker}
              aria-label="Upload profile image"
              className="group relative block size-24 overflow-hidden rounded-full border border-dashed border-foreground/25 bg-background transition-colors hover:border-primary/50 sm:size-28 md:size-32"
            >
              {imagePreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreviewUrl}
                  alt="Profile preview"
                  className="size-full rounded-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-muted-foreground">
                  <UserRound className="size-7 sm:size-8" />
                </span>
              )}

              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 text-background opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-5" />
              </span>
            </button>

            {profileImageFile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearProfileImage();
                }}
                aria-label="Remove selected profile image"
                className="absolute -right-1 -top-1 z-10 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          <div className="min-w-0 text-center sm:text-left">
            <h2 className="truncate font-semibold text-foreground mb-2">
              {username}
            </h2>

            {isEditingName ? (
              <span className="mt-1 inline-flex w-full min-w-0 items-center gap-1.5">
                <Input
                  autoFocus
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      saveName();
                    } else if (event.key === "Escape") {
                      event.preventDefault();
                      cancelEditingName();
                    }
                  }}
                  disabled={isSavingName}
                  aria-label="Name"
                  className="h-7 w-full min-w-0 max-w-56 text-sm"
                />

                <Button
                  type="button"
                  size="xs"
                  onClick={saveName}
                  disabled={isSavingName}
                  aria-label="Save name"
                >
                  {isSavingName ? "Saving…" : <Check className="size-4" />}
                </Button>

                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={cancelEditingName}
                  disabled={isSavingName}
                  aria-label="Cancel name edit"
                >
                  <X className="size-4" />
                </Button>
              </span>
            ) : (
              <h4 className="mt-0 truncate text-muted-foreground flex flex-row items-center ">
                <CircleUserRound className="size-4 mr-1 text-brand-blue" />
                {name}{" "}
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  className="text-xs font-medium text-primary hover:underline p-1"
                  onClick={startEditingName}
                  aria-label="Edit name"
                >
                  <Edit2 className="size-3" />
                </Button>
              </h4>
            )}
            {isEditingPhoneNumber ? (
              <span className="mt-1 inline-flex w-full min-w-0 items-center gap-1.5">
                <Input
                  autoFocus
                  value={phoneNumberDraft}
                  onChange={(event) => setPhoneNumberDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      savePhoneNumber();
                    } else if (event.key === "Escape") {
                      event.preventDefault();
                      cancelEditingPhoneNumber();
                    }
                  }}
                  disabled={isSavingPhoneNumber}
                  aria-label="Phone number"
                  className="h-7 w-full min-w-0 max-w-56 text-sm"
                />

                <Button
                  type="button"
                  size="xs"
                  onClick={savePhoneNumber}
                  disabled={isSavingPhoneNumber}
                  aria-label="Save phone number"
                  // className={"p-1"}
                >
                  {isSavingPhoneNumber ? (
                    "Saving…"
                  ) : (
                    <Check className="size-4" />
                  )}
                </Button>

                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={cancelEditingPhoneNumber}
                  disabled={isSavingPhoneNumber}
                  aria-label="Cancel phone number edit"
                  // className={"p-1"}
                >
                  <X className="size-4" />
                </Button>
              </span>
            ) : (
              <h6 className="mt-0 truncate text-muted-foreground flex flex-row items-center">
                <Phone className="size-4 mr-1 text-brand-green" />
                {maskedPhoneNumber}
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  className="text-xs font-medium text-primary hover:underline p-1"
                  onClick={startEditingPhoneNumber}
                >
                  <Edit2 className="size-3" />
                </Button>
              </h6>
            )}
            {isEditingPassword ? (
              <span className="mt-1 inline-flex w-full min-w-0 items-center gap-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  value={passwordDraft}
                  onChange={(event) => setPasswordDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      savePassword();
                    } else if (event.key === "Escape") {
                      event.preventDefault();
                      cancelEditingPassword();
                    }
                  }}
                  aria-label="Password"
                  className="h-7 w-full min-w-0 max-w-56 text-sm"
                />


                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  // className="p-1"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>

                <Button
                  type="button"
                  size="xs"
                  onClick={savePassword}
                  aria-label="Save password"
                  // className={"p-1"}
                >
                  <Check className="size-4" />
                </Button>

                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={cancelEditingPassword}
                  aria-label="Cancel password edit"
                  // className={"p-1"}
                >
                  <X className="size-4" />
                </Button>
              </span>
            ) : (
              <h6 className="mt-0 truncate text-muted-foreground flex flex-row items-center">
                <UserRoundKey className="size-4 mr-1 text-info" />
                {"********"}
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  className="text-xs font-medium text-primary hover:underline p-1"
                  onClick={startEditingPassword}
                >
                  <Edit2 className="size-3" />
                </Button>
              </h6>
            )}
          </div>
        </div>
        <p className="text-xs font-medium text-foreground flex items-center gap-2">
          {profileImageFile ? null : "Profile Photo (optional)"}
          {profileImageFile ? null : (
            <>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Click the avatar to upload · JPG, PNG, or WEBP up to 5 MB
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </p>

        {/* Hidden file input */}
        <Input
          ref={profileInputRef}
          id="profile-image-upload"
          name="profileImage"
          type="file"
          accept="image/*"
          onChange={handleProfileImageUpload}
          className="hidden"
        />

        {imageError && <p className="text-xs text-destructive">{imageError}</p>}
      </div>

      <form
        id="profile-form"
        noValidate
        onSubmit={handleSubmit}
        className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {/* <FormField
          id="name"
          label="Name"
          placeholder="Enter your name"
          value={name}
          name="name"
          onChange={(value) => onChange("name", value)}
        />

        <FormField
          id="username"
          label="Username"
          placeholder="Enter your username"
          value={username}
          name="username"
          onChange={(value) => onChange("username", value)}
        /> */}

        {/* <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <FormField
              id="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
              name="password"
              value={password}
              onChange={(value) => onChange("password", value)}
            />
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => handlePasswordOpenChange(true)}
            >
              Change Password
            </Button>
          </div>
        </div> */}
      </form>

      <SignatureField
        value={signature}
        onChange={(value) => onChange("signature", value)}
      />

      {/* Reusable Image Cropper */}
      <ImageCropper
        image={imagePreviewUrl}
        open={showCropper}
        onClose={() => setShowCropper(false)}
        onCrop={handleCroppedImage}
        aspect={1}
        cropShape="round"
        title="Adjust Profile Photo"
        description="Drag the image and adjust the zoom."
      />
      <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
        <Button
          type="button"
          className="h-10 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="profile-form"
          disabled={isSavingProfile}
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {isSavingProfile ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* ================================
          Change Password Modal
      ================================= */}
      <Dialog open={isPasswordOpen} onOpenChange={handlePasswordOpenChange}>
        <DialogContent className="w-full max-w-full sm:max-w-1/2">
          <DialogHeader className="pb-4">
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleChangePassword();
            }}
            className="space-y-4"
          >
            <FormField
              id="current-password"
              label="Current Password"
              placeholder="Enter your current password"
              value={pwCurrent}
              name="current_password"
              type={showCurrent ? "text" : "password"}
              onChange={(value) => setPwCurrent(value)}
              inputClassName={
                formErrors?.current_password ? "border-destructive" : undefined
              }
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowCurrent((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                >
                  {showCurrent ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              }
            />
            {formErrors?.current_password && (
              <p className="text-xs text-destructive">
                {formErrors.current_password}
              </p>
            )}

            <FormField
              id="new-password"
              label="New Password"
              type={showNew ? "text" : "password"}
              value={pwNew}
              onChange={(value) => setPwNew(value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              inputClassName={
                formErrors?.new_password ? "border-destructive" : undefined
              }
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNew((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              }
            />
            {/* Strength of the password being CHOSEN (not the current one). */}
            <PasswordStrengthMeter password={pwNew} />
            {formErrors?.new_password && (
              <p className="text-xs text-destructive">
                {formErrors.new_password}
              </p>
            )}

            <FormField
              id="confirm-password"
              label="Confirm New Password"
              type={showConfirm ? "text" : "password"}
              value={pwConfirm}
              onChange={(value) => setPwConfirm(value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              required
              inputClassName={
                formErrors?.confirm_password ? "border-destructive" : undefined
              }
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              }
            />
            {formErrors?.confirm_password && (
              <p className="text-xs text-destructive">
                {formErrors.confirm_password}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePasswordOpenChange(false)}
                disabled={pwSubmitting}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={pwSubmitting}>
                {pwSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </article>
  );
};

export default ProfilePage;

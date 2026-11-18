import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Field from "../components/Field.jsx";
import PasswordField from "../components/PasswordField.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { changePassword, updateProfile } from "../services/auth.service.js";
import {
  alertErrorClass,
  buttonClass,
  cardClass,
  inputClass,
  inputErrorClass,
  secondaryButtonClass,
} from "../style/classes.js";
import { formatDate, getErrorMessage, getFieldErrors, passwordChecks } from "../utils/format.js";
import { fieldProps } from "../utils/form.js";

const ProfileForm = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [company, setCompany] = useState(user.company || "");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      const response = await updateProfile({ name: name.trim(), company: company.trim() });
      updateUser(response.user);
      toast.success(response.message, "Saved");
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} space-y-5 p-4 sm:p-8`}>
      <h2 className="text-lg font-semibold">Profile details</h2>
      {error && (
        <p role="alert" className={alertErrorClass}>
          {error}
        </p>
      )}
      <Field id="profile-name" label="Full name" error={fieldErrors.name} required>
        <input
          {...fieldProps("profile-name", { error: fieldErrors.name })}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          required
          className={`${inputClass} ${fieldErrors.name ? inputErrorClass : ""}`}
        />
      </Field>
      {user.role === "employer" && (
        <Field id="profile-company" label="Company" error={fieldErrors.company} required>
          <input
            {...fieldProps("profile-company", { error: fieldErrors.company })}
            type="text"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            maxLength={100}
            required
            className={`${inputClass} ${fieldErrors.company ? inputErrorClass : ""}`}
          />
        </Field>
      )}
      <Field id="profile-email" label="Email" hint="Email cannot be changed">
        <input {...fieldProps("profile-email", { hint: true })} type="email" value={user.email} disabled className={`${inputClass} opacity-70`} />
      </Field>
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
};

const PasswordForm = () => {
  const toast = useToast();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!passwordChecks(newPassword).every((check) => check.passed)) {
      setError("New password must be 8+ characters with a letter and a number.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await changePassword(oldPassword, newPassword);
      toast.success(response.message, "Password changed");
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} space-y-5 p-4 sm:p-8`}>
      <h2 className="text-lg font-semibold">Change password</h2>
      {error && (
        <p role="alert" className={alertErrorClass}>
          {error}
        </p>
      )}
      <PasswordField
        id="current-password"
        label="Current password"
        value={oldPassword}
        onChange={(event) => setOldPassword(event.target.value)}
        autoComplete="current-password"
      />
      <PasswordField
        id="new-password"
        label="New password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        autoComplete="new-password"
        showStrength
      />
      <PasswordField
        id="confirm-new-password"
        label="Confirm new password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        autoComplete="new-password"
      />
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
};

const Profile = () => {
  useDocumentTitle("Profile");
  const { user, logout } = useAuth();

  return (
    <>
      <PageHeader eyebrow="Account" title="Your profile" description="Manage your details and keep your account secure." />

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="space-y-6">
          <ProfileForm key={user.id} />
          {user.provider === "local" ? (
            <PasswordForm />
          ) : (
            <div className={`${cardClass} p-4 text-sm text-[#60766b] sm:p-8`}>
              You signed in with Google, so your password is managed by your Google account.
            </div>
          )}
        </div>

        <aside className={`${cardClass} h-fit space-y-4 p-4 sm:p-6`} aria-label="Account summary">
          <h2 className="text-lg font-semibold">Account</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#60766b]">Role</dt>
              <dd>
                <StatusBadge value={user.role} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#60766b]">Email</dt>
              <dd>
                <StatusBadge
                  value={user.isEmailVerified ? "Accepted" : "Pending"}
                  label={user.isEmailVerified ? "Verified" : "Not verified"}
                />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#60766b]">Sign-in</dt>
              <dd className="font-medium capitalize">{user.provider}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#60766b]">Member since</dt>
              <dd className="font-medium">{formatDate(user.createdAt)}</dd>
            </div>
          </dl>
          <button type="button" onClick={logout} className={`${secondaryButtonClass} w-full`}>
            Sign out
          </button>
        </aside>
      </div>
    </>
  );
};

export default Profile;

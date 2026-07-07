import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { authService } from "../../services/auth/auth.service";
import { Lock, Image, Palette, AlertCircle, CheckCircle } from "lucide-react";
import styles from "./Settings.module.css";

/**
 * Settings page: Change password, upload profile picture, manage dark mode.
 */
export default function Settings() {
  const { user, setUser } = useAuth();
  const { darkMode, setDarkMode } = useTheme();

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
  });
  const [profileUpdateError, setProfileUpdateError] = useState("");
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState("");
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      });
    }
  }, [user]);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile picture state
  const fileInputRef = useRef(null);
  const [profilePictureLoading, setProfilePictureLoading] = useState(false);
  const [profilePictureError, setProfilePictureError] = useState("");
  const [profilePictureSuccess, setProfilePictureSuccess] = useState("");

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    try {
      setPasswordLoading(true);
      await authService.changePassword(
        passwordForm.oldPassword,
        passwordForm.newPassword,
      );
      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordError(error.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setProfilePictureError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfilePictureError("File size must be less than 5MB");
      return;
    }

    try {
      setProfilePictureLoading(true);
      setProfilePictureError("");
      setProfilePictureSuccess("");

      const response = await authService.uploadProfilePicture(file);
      setProfilePictureSuccess("Profile picture updated successfully!");

      // Update user in local storage
      const updatedUser = {
        ...user,
        profilePictureUrl: response.user.profilePictureUrl,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      setProfilePictureError(
        error.message || "Failed to upload profile picture",
      );
    } finally {
      setProfilePictureLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileUpdateError("");
    setProfileUpdateSuccess("");

    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      setProfileUpdateError("First name and last name are required.");
      return;
    }

    try {
      setProfileUpdateLoading(true);
      const response = await authService.updateProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
      });

      const updatedUser = {
        ...user,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfileUpdateSuccess("Name updated successfully!");
    } catch (error) {
      setProfileUpdateError(error.message || "Failed to update profile");
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  // Handle dark mode toggle
  const handleDarkModeToggle = async () => {
    try {
      const newDarkModeState = !darkMode;
      await authService.updatePreferences({ darkMode: newDarkModeState });
      setDarkMode(newDarkModeState);

      // Update user in context
      const updatedUser = {
        ...user,
        darkMode: newDarkModeState,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Failed to update theme preference:", error);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsWrapper}>
        <h1 className={styles.pageTitle}>Settings & Preferences</h1>

        {/* Profile Name Section */}
        <section className={styles.settingsSection}>
          <div className={styles.sectionHeader}>
            <Image size={24} className={styles.icon} />
            <h2>Profile Name</h2>
          </div>

          <form onSubmit={handleProfileUpdate} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                placeholder="Enter your first name"
                value={profileForm.firstName}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    firstName: e.target.value,
                  })
                }
                disabled={profileUpdateLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                placeholder="Enter your last name"
                value={profileForm.lastName}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    lastName: e.target.value,
                  })
                }
                disabled={profileUpdateLoading}
              />
            </div>

            {profileUpdateError && (
              <div className={`${styles.message} ${styles.error}`}>
                <AlertCircle size={16} />
                {profileUpdateError}
              </div>
            )}

            {profileUpdateSuccess && (
              <div className={`${styles.message} ${styles.success}`}>
                <CheckCircle size={16} />
                {profileUpdateSuccess}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={profileUpdateLoading}
            >
              {profileUpdateLoading ? "Saving..." : "Save Name"}
            </button>
          </form>
        </section>

        {/* Change Password Section */}
        <section className={styles.settingsSection}>
          <div className={styles.sectionHeader}>
            <Lock size={24} className={styles.icon} />
            <h2>Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="oldPassword">Current Password</label>
              <input
                id="oldPassword"
                type="password"
                placeholder="Enter your current password"
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    oldPassword: e.target.value,
                  })
                }
                disabled={passwordLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                placeholder="Enter your new password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                disabled={passwordLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                disabled={passwordLoading}
              />
            </div>

            {passwordError && (
              <div className={`${styles.message} ${styles.error}`}>
                <AlertCircle size={16} />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className={`${styles.message} ${styles.success}`}>
                <CheckCircle size={16} />
                {passwordSuccess}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={passwordLoading}
            >
              {passwordLoading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </section>

        {/* Profile Picture Section */}
        <section className={styles.settingsSection}>
          <div className={styles.sectionHeader}>
            <Image size={24} className={styles.icon} />
            <h2>Profile Picture</h2>
          </div>

          <div className={styles.profilePictureContainer}>
            <div className={styles.picturePreview}>
              {user?.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt="Profile"
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.placeholderImage}>
                  <Image size={48} />
                </div>
              )}
            </div>

            <div className={styles.uploadSection}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                disabled={profilePictureLoading}
                className={styles.hiddenInput}
              />

              <button
                type="button"
                className={styles.uploadButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={profilePictureLoading}
              >
                {profilePictureLoading ? "Uploading..." : "Choose Image"}
              </button>

              <p className={styles.helpText}>JPG, PNG or GIF. Max size 5MB.</p>
            </div>

            {profilePictureError && (
              <div className={`${styles.message} ${styles.error}`}>
                <AlertCircle size={16} />
                {profilePictureError}
              </div>
            )}

            {profilePictureSuccess && (
              <div className={`${styles.message} ${styles.success}`}>
                <CheckCircle size={16} />
                {profilePictureSuccess}
              </div>
            )}
          </div>
        </section>

        {/* Dark Mode Section */}
        <section className={styles.settingsSection}>
          <div className={styles.sectionHeader}>
            <Palette size={24} className={styles.icon} />
            <h2>Dark Mode</h2>
          </div>

          <div className={styles.darkModeToggle}>
            <p className={styles.toggleDescription}>
              Enable dark mode for a comfortable viewing experience at night.
            </p>

            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={handleDarkModeToggle}
              />
              <span className={styles.slider}></span>
            </label>

            <p className={styles.toggleStatus}>
              Dark mode is currently{" "}
              <strong>{darkMode ? "enabled" : "disabled"}</strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

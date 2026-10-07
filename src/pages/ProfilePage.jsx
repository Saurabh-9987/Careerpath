import { useState } from "react";
import { useCareer } from "../context/CareerContextCore";
import ProfileSection from "../components/ProfileSection";

export default function ProfilePage() {
  const { profile, setProfile, handleSaveProfile } = useCareer();
  const [saveMessage, setSaveMessage] = useState("");

  const onSave = async (profileToSave) => {
    const toSave = profileToSave || profile;
    const res = await handleSaveProfile(toSave);
    if (res?.offline) {
      setSaveMessage("✓ Profile saved to local storage (offline mode)");
    } else {
      setSaveMessage("✓ Profile saved successfully to database!");
    }
    setTimeout(() => setSaveMessage(""), 3500);
  };

  return (
    <div style={{ paddingTop: "20px", paddingBottom: "80px" }}>
      {saveMessage && (
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto 20px",
            padding: "14px 20px",
            borderRadius: "10px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            color: "#10B981",
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          {saveMessage}
        </div>
      )}

      <ProfileSection
        profile={profile}
        onProfileChange={setProfile}
        onSaveProfile={onSave}
      />
    </div>
  );
}

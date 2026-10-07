import { useState, useRef, useEffect } from "react";
import GlowSeparator from "./GlowSeparator";
import { availableRoles, careerData } from "../data/careerData";
import { parseProfileSkills } from "../utils/careerScoring";
import {
  extractTextFromFile,
  parseResumeText,
  mergeProfileWithExtracted,
} from "../utils/resumeExtractor";

export default function ProfileSection({
  profile,
  onProfileChange,
  onSaveProfile,
}) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeError, setResumeError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [applySuccessMessage, setApplySuccessMessage] = useState("");
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [editableExtraction, setEditableExtraction] = useState(null);
  const [connectNotice, setConnectNotice] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // GitHub Integration State
  const [githubStatus, setGithubStatus] = useState({
    configured: false,
    connected: false,
    user: null,
  });
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("github_error");
      if (errorParam === "not_configured") {
        return "GitHub OAuth is not configured on the backend server. Please configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend/.env.";
      }
      if (errorParam === "access_denied") {
        return "GitHub authorization was cancelled or denied.";
      }
      if (errorParam === "invalid_state" || errorParam === "expired_state") {
        return "Security verification failed (invalid or expired OAuth state). Please try connecting again.";
      }
      if (errorParam) {
        return `GitHub connection error (${errorParam}). Please try again.`;
      }
    }
    return "";
  });

  const [githubNotice, setGithubNotice] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("github_connected") === "true") {
        return "GitHub account successfully connected!";
      }
    }
    return "";
  });

  const [showRepoBrowser, setShowRepoBrowser] = useState(false);
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepoIds, setSelectedRepoIds] = useState(new Set());
  const [selectedInferredSkills, setSelectedInferredSkills] = useState(new Set());
  const [showImportReview, setShowImportReview] = useState(false);
  const [importProjectsText, setImportProjectsText] = useState("");

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Check GitHub Connection Status on Mount and clear URL redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("github_connected") || params.has("github_error")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/github/status`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setGithubStatus({
            configured: Boolean(data.configured),
            connected: Boolean(data.connected),
            user: data.user || null,
          });
        }
      } catch {
        // Backend offline or unreachable
      }
    };

    fetchStatus();
  }, [backendUrl]);

  const handleConnectGithub = () => {
    setGithubError("");
    setGithubNotice("");
    window.location.href = `${backendUrl}/api/github/auth`;
  };

  const handleDisconnectGithub = async () => {
    setGithubLoading(true);
    setGithubError("");
    try {
      const res = await fetch(`${backendUrl}/api/github/disconnect`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setGithubStatus((prev) => ({
          ...prev,
          connected: false,
          user: null,
        }));
        setShowRepoBrowser(false);
        setRepos([]);
        setSelectedRepoIds(new Set());
        setSelectedInferredSkills(new Set());
        setShowImportReview(false);
        setGithubNotice("GitHub account disconnected.");
        setTimeout(() => setGithubNotice(""), 5000);
      }
    } catch {
      setGithubError("Failed to disconnect GitHub. Please check if backend is running.");
    } finally {
      setGithubLoading(false);
    }
  };

  const handleToggleRepoBrowser = async () => {
    if (showRepoBrowser) {
      setShowRepoBrowser(false);
      return;
    }

    setShowRepoBrowser(true);
    if (repos.length > 0) return;

    setLoadingRepos(true);
    setGithubError("");

    try {
      const res = await fetch(`${backendUrl}/api/github/repos`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = data?.error?.message || "Failed to fetch repositories.";
        setGithubError(msg);
        return;
      }

      const fetchedRepos = data.repos || [];
      setRepos(fetchedRepos);

      const initialSelected = new Set(fetchedRepos.slice(0, 3).map((r) => r.id));
      setSelectedRepoIds(initialSelected);

      const initialSkills = new Set();
      fetchedRepos.slice(0, 3).forEach((r) => {
        (r.inferredSkills || []).forEach((s) => initialSkills.add(s));
      });
      setSelectedInferredSkills(initialSkills);
    } catch {
      setGithubError("Could not retrieve repositories. Please verify backend connectivity.");
    } finally {
      setLoadingRepos(false);
    }
  };

  const toggleRepoSelection = (repoId) => {
    const next = new Set(selectedRepoIds);
    if (next.has(repoId)) {
      next.delete(repoId);
    } else {
      next.add(repoId);
    }
    setSelectedRepoIds(next);

    const nextSkills = new Set();
    repos.forEach((r) => {
      if (next.has(r.id)) {
        (r.inferredSkills || []).forEach((s) => nextSkills.add(s));
      }
    });
    setSelectedInferredSkills(nextSkills);
  };

  const handleSelectAllRepos = () => {
    if (selectedRepoIds.size === repos.length) {
      setSelectedRepoIds(new Set());
      setSelectedInferredSkills(new Set());
    } else {
      const allIds = new Set(repos.map((r) => r.id));
      setSelectedRepoIds(allIds);
      const allSkills = new Set();
      repos.forEach((r) => {
        (r.inferredSkills || []).forEach((s) => allSkills.add(s));
      });
      setSelectedInferredSkills(allSkills);
    }
  };

  const handleOpenImportReview = () => {
    const selectedRepos = repos.filter((r) => selectedRepoIds.has(r.id));
    if (selectedRepos.length === 0) {
      setGithubError("Please select at least one repository to import.");
      return;
    }

    const formattedProjects = selectedRepos
      .map((r) => {
        const langPart = r.language ? ` (${r.language})` : "";
        const descPart =
          r.description && r.description !== "No description provided."
            ? `: ${r.description}`
            : "";
        return `${r.name}${langPart}${descPart} [GitHub: ${r.url}]`;
      })
      .join("\n\n");

    setImportProjectsText(formattedProjects);
    setShowImportReview(true);
  };

  const handleApplyGithubImport = () => {
    const existingProjects = (profile.projects || "").trim();
    const newProjects = importProjectsText.trim();
    const mergedProjects = existingProjects
      ? `${existingProjects}\n\n${newProjects}`
      : newProjects;

    const existingSkillsList = parseProfileSkills(profile.skills);
    const skillsToAdd = Array.from(selectedInferredSkills).filter(
      (s) => !existingSkillsList.some((item) => item.toLowerCase() === s.toLowerCase())
    );

    const existingSkillsStr = (profile.skills || "").trim();
    let mergedSkills = existingSkillsStr;
    if (skillsToAdd.length > 0) {
      mergedSkills = existingSkillsStr
        ? `${existingSkillsStr}, ${skillsToAdd.join(", ")}`
        : skillsToAdd.join(", ");
    }

    const updated = {
      ...profile,
      projects: mergedProjects,
      skills: mergedSkills,
    };

    onProfileChange(updated);
    if (onSaveProfile) onSaveProfile(updated);

    setShowImportReview(false);
    setShowRepoBrowser(false);
    setGithubNotice(
      "✓ Selected GitHub projects and inferred skills successfully added to your profile! Changes saved."
    );
    setTimeout(() => setGithubNotice(""), 8000);
  };

  const processFile = (file) => {
    if (!file) return;

    const validExtensions = [".pdf", ".docx"];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    const isValidExtension = validExtensions.includes(fileExtension);

    if (!isValidExtension) {
      setResumeError("Please select a PDF (.pdf) or Word (.docx) document.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setResumeError("");
    setAnalysisError("");
    setApplySuccessMessage("");
    setShowReviewPanel(false);
    setSelectedFile(file);

    const sizeInKb = (file.size / 1024).toFixed(1);
    const formattedSize =
      file.size >= 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(2) + " MB"
        : sizeInKb + " KB";

    onProfileChange({
      ...profile,
      resumeName: file.name,
      resumeSize: formattedSize,
      resumeLastModified: new Date(file.lastModified || Date.now()).toLocaleDateString(),
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    processFile(file);
  };

  const handleRemoveResume = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedFile(null);
    setResumeError("");
    setAnalysisError("");
    setApplySuccessMessage("");
    setShowReviewPanel(false);
    setEditableExtraction(null);
    onProfileChange({
      ...profile,
      resumeName: "",
      resumeSize: "",
      resumeLastModified: "",
    });
  };

  const handleReplaceClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Real resume extraction workflow
  const handleExtractProfile = async () => {
    if (!selectedFile) {
      setAnalysisError(
        "Please select or upload your resume document (.pdf or .docx) to extract."
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");
    setApplySuccessMessage("");

    try {
      // 1. Extract raw text directly from document
      const rawText = await extractTextFromFile(selectedFile);
      if (!rawText || rawText.trim().length === 0) {
        throw new Error(
          "Could not extract readable text from document. Please ensure it is not an image-only scan."
        );
      }

      // 2. Parse structured profile fields
      const extracted = parseResumeText(rawText, selectedFile.name);

      // 3. Non-destructively merge with current profile
      const { mergedProfile, newSkills, existingSkillsList } = mergeProfileWithExtracted(
        profile,
        extracted
      );

      // 4. Setup state for interactive review screen
      setEditableExtraction({
        filename: selectedFile.name,
        name: mergedProfile.name || "",
        email: mergedProfile.email || "",
        phone: mergedProfile.phone || "",
        role: mergedProfile.role || profile.role || "Data Analyst",
        skills: mergedProfile.skills || "",
        experience: mergedProfile.experience || "",
        education: mergedProfile.education || "",
        projects: mergedProfile.projects || "",
        certifications: mergedProfile.certifications || "",
        github: mergedProfile.github || "",
        linkedin: mergedProfile.linkedin || "",
        rawText: extracted.rawText || "",
        method: extracted.extractionMethod || "Browser-native document text parser (PDF/DOCX)",
        newSkillsList: newSkills,
        existingSkillsList,
      });

      setShowReviewPanel(true);
    } catch (err) {
      setAnalysisError(
        err?.message ||
          "Failed to extract profile information from document. Please verify the file is not corrupted."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirm and apply extracted information to shared profile state and persist
  const handleApplyExtraction = async () => {
    if (!editableExtraction) return;

    const updatedProfile = {
      ...profile,
      name: (editableExtraction.name || "").trim() || profile.name || "",
      role: editableExtraction.role || profile.role || "Data Analyst",
      email: (editableExtraction.email || "").trim() || profile.email || "",
      phone: (editableExtraction.phone || "").trim() || profile.phone || "",
      skills: (editableExtraction.skills || "").trim(),
      experience: (editableExtraction.experience || "").trim(),
      education: (editableExtraction.education || "").trim(),
      projects: (editableExtraction.projects || "").trim(),
      certifications: (editableExtraction.certifications || "").trim(),
      github: (editableExtraction.github || "").trim() || profile.github || "",
      linkedin: (editableExtraction.linkedin || "").trim() || profile.linkedin || "",
      resumeName: editableExtraction.filename || profile.resumeName || "",
      resumeLastModified: new Date().toLocaleDateString(),
    };

    onProfileChange(updatedProfile);
    if (onSaveProfile) {
      await onSaveProfile(updatedProfile);
    }

    setShowReviewPanel(false);
    setEditableExtraction(null);
    setApplySuccessMessage(
      "✓ Resume profile information extracted and saved! Your skills, career readiness score, and roadmap benchmarks have been updated."
    );
    setTimeout(() => {
      setApplySuccessMessage("");
    }, 8000);
  };

  const handleDismissReview = () => {
    setShowReviewPanel(false);
    setEditableExtraction(null);
  };

  const handleConnectClick = (service) => {
    setConnectNotice(`${service} integration coming soon in a future release. Account not connected.`);
    setTimeout(() => {
      setConnectNotice(null);
    }, 4500);
  };

  const parsedSkills = parseProfileSkills(profile.skills);
  const parsedReviewSkills = editableExtraction
    ? parseProfileSkills(editableExtraction.skills)
    : [];
  const hasResume = Boolean(profile.resumeName);

  const currentRoleSkills = careerData[profile.role]?.skills || [];
  const suggestedRoleSkills = currentRoleSkills.filter(
    (s) => !parsedSkills.some((ps) => ps.toLowerCase() === s.toLowerCase())
  );

  const handleAddSkill = (skillToAdd) => {
    const current = (profile.skills || "").trim();
    const updated = current ? `${current}, ${skillToAdd}` : skillToAdd;
    onProfileChange({ ...profile, skills: updated });
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updatedList = parsedSkills.filter(
      (s) => s.toLowerCase() !== skillToRemove.toLowerCase()
    );
    onProfileChange({ ...profile, skills: updatedList.join(", ") });
  };

  return (
    <section className="profile-section">
      <div className="profile-card">
        <p className="eyebrow">MY PROFILE</p>
        <h2>Build Your Career Profile</h2>
        <p className="profile-text">
          Add your resume, document your technical skills, work history, and education so CareerPath can benchmark your trajectory.
        </p>

        {/* 1. Resume Section */}
        <div className="profile-block">
          <div className="profile-block-header">
            <span className="card-label">01 — RESUME & DOCUMENTS</span>
            <h3 className="profile-block-title">Resume / CV</h3>
            <p className="profile-block-desc">
              Upload your PDF or DOCX resume for automated text extraction and structured competency mapping.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {!hasResume ? (
            <div
              className={`resume-dropzone ${isDragging ? "dragging" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="resume-dropzone-icon">📄</div>
              <div className="resume-dropzone-title">
                Drag and drop your resume here, or{" "}
                <span style={{ color: "#60A5FA", textDecoration: "underline" }}>browse files</span>
              </div>
              <div className="resume-dropzone-hint">
                Accepted formats: PDF (.pdf) or Word (.docx) • Max size: 10MB
              </div>
            </div>
          ) : (
            <div>
              <div className="resume-file-card">
                <div className="resume-file-info">
                  <div className="resume-file-icon">📄</div>
                  <div>
                    <div className="resume-file-name">{profile.resumeName}</div>
                    <div className="resume-file-meta">
                      {profile.resumeSize || "File attached"}
                      {profile.resumeLastModified && ` • Added on ${profile.resumeLastModified}`}
                    </div>
                  </div>
                </div>

                <div className="resume-file-actions">
                  <button
                    type="button"
                    className="resume-action-btn replace"
                    onClick={handleReplaceClick}
                  >
                    Replace File
                  </button>
                  <button
                    type="button"
                    className="resume-action-btn remove"
                    onClick={handleRemoveResume}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="resume-analyze-box">
                <button
                  type="button"
                  className="resume-analyze-btn"
                  onClick={handleExtractProfile}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <span>⏳</span> Extracting Profile & Analyzing Document...
                    </>
                  ) : (
                    <>
                      <span>⚡</span> Extract Profile
                    </>
                  )}
                </button>
                <div className="resume-analyze-notice">
                  <span>ℹ️</span> Transparent document extraction. Analyzes actual PDF/DOCX content and opens a review panel before applying.
                </div>
              </div>

              {analysisError && (
                <div className="resume-error-banner">
                  ⚠️ {analysisError}
                </div>
              )}

              {applySuccessMessage && (
                <div className="resume-success-banner">
                  {applySuccessMessage}
                </div>
              )}

              {/* Review Extracted Data Before Applying */}
              {showReviewPanel && editableExtraction && (
                <div className="resume-review-panel" style={{ marginTop: "24px" }}>
                  <div className="resume-review-header">
                    <div>
                      <h4 className="resume-review-title">Resume information extracted</h4>
                      <p className="resume-review-desc">
                        Review the extracted details from <strong>{editableExtraction.filename}</strong> below. Compare and edit the fields before confirming. Existing profile fields have been preserved.
                      </p>
                    </div>
                    <span className="resume-review-meta">
                      {editableExtraction.method}
                    </span>
                  </div>

                  {/* Badges Summary */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "14px 0 20px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: "rgba(16, 185, 129, 0.12)",
                        color: "#10B981",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      + {editableExtraction.newSkillsList?.length || 0} New Skills Discovered
                    </span>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: "500",
                        background: "rgba(148, 163, 184, 0.12)",
                        color: "#64748B",
                        border: "1px solid rgba(148, 163, 184, 0.25)",
                      }}
                    >
                      ✓ {editableExtraction.existingSkillsList?.length || 0} Existing Skills Retained
                    </span>
                  </div>

                  <div className="resume-review-fields">
                    {/* Basic Info In Review */}
                    <div className="profile-grid">
                      <div className="profile-field-group">
                        <label className="profile-field-label">Name</label>
                        <input
                          type="text"
                          value={editableExtraction.name}
                          placeholder="Candidate Name"
                          onChange={(e) =>
                            setEditableExtraction({
                              ...editableExtraction,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="profile-field-group">
                        <label className="profile-field-label">Baseline Role</label>
                        <select
                          value={editableExtraction.role || "Data Analyst"}
                          onChange={(e) =>
                            setEditableExtraction({
                              ...editableExtraction,
                              role: e.target.value,
                            })
                          }
                        >
                          {availableRoles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="profile-grid">
                      <div className="profile-field-group">
                        <label className="profile-field-label">Email</label>
                        <input
                          type="email"
                          value={editableExtraction.email}
                          placeholder="e.g. user@example.com"
                          onChange={(e) =>
                            setEditableExtraction({
                              ...editableExtraction,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="profile-field-group">
                        <label className="profile-field-label">Phone</label>
                        <input
                          type="tel"
                          value={editableExtraction.phone}
                          placeholder="e.g. +1 (555) 019-2831"
                          onChange={(e) =>
                            setEditableExtraction({
                              ...editableExtraction,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Extracted Skills */}
                    <div className="profile-field-group">
                      <label className="profile-field-label">Technical & Domain Skills</label>
                      <textarea
                        className="profile-textarea"
                        rows={3}
                        value={editableExtraction.skills}
                        onChange={(e) =>
                          setEditableExtraction({
                            ...editableExtraction,
                            skills: e.target.value,
                          })
                        }
                      />
                      <div className="skills-pill-preview">
                        <div className="skills-pill-preview-title">
                          Recognized Competencies ({parsedReviewSkills.length}):
                        </div>
                        <div className="skill-list">
                          {parsedReviewSkills.length > 0 ? (
                            parsedReviewSkills.map((skill) => {
                              const isNewlyDiscovered = editableExtraction.newSkillsList?.some(
                                (s) => s.toLowerCase() === skill.toLowerCase()
                              );
                              return (
                                <span
                                  key={skill}
                                  style={
                                    isNewlyDiscovered
                                      ? {
                                          background: "rgba(16, 185, 129, 0.15)",
                                          color: "#10B981",
                                          borderColor: "rgba(16, 185, 129, 0.35)",
                                          fontWeight: "600",
                                        }
                                      : {}
                                  }
                                >
                                  {isNewlyDiscovered ? `+ ${skill} (New)` : `✓ ${skill}`}
                                </span>
                              );
                            })
                          ) : (
                            <p style={{ color: "#64748B", fontSize: "12px", fontStyle: "italic", margin: "4px 0" }}>
                              No recognized skills detected.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Extracted Work Experience */}
                    <div className="profile-field-group">
                      <label className="profile-field-label">Work Experience</label>
                      <textarea
                        className="profile-textarea"
                        rows={3}
                        value={editableExtraction.experience}
                        placeholder="No work experience detected."
                        onChange={(e) =>
                          setEditableExtraction({
                            ...editableExtraction,
                            experience: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Extracted Education */}
                    <div className="profile-field-group">
                      <label className="profile-field-label">Education</label>
                      <textarea
                        className="profile-textarea"
                        rows={2}
                        value={editableExtraction.education}
                        placeholder="No education section detected."
                        onChange={(e) =>
                          setEditableExtraction({
                            ...editableExtraction,
                            education: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Extracted Projects */}
                    <div className="profile-field-group">
                      <label className="profile-field-label">Projects</label>
                      <textarea
                        className="profile-textarea"
                        rows={2}
                        value={editableExtraction.projects}
                        placeholder="No projects section detected."
                        onChange={(e) =>
                          setEditableExtraction({
                            ...editableExtraction,
                            projects: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Extracted Certifications */}
                    <div className="profile-field-group">
                      <label className="profile-field-label">Certifications</label>
                      <textarea
                        className="profile-textarea"
                        rows={2}
                        value={editableExtraction.certifications}
                        placeholder="No certifications detected."
                        onChange={(e) =>
                          setEditableExtraction({
                            ...editableExtraction,
                            certifications: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Social links */}
                    <div className="profile-grid">
                      <div className="profile-field-group">
                        <label className="profile-field-label">GitHub</label>
                        <input
                          type="text"
                          value={editableExtraction.github}
                          placeholder="e.g. https://github.com/username"
                          onChange={(e) =>
                            setEditableExtraction({
                              ...editableExtraction,
                              github: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="profile-field-group">
                        <label className="profile-field-label">LinkedIn</label>
                        <input
                          type="text"
                          value={editableExtraction.linkedin}
                          placeholder="e.g. https://linkedin.com/in/username"
                          onChange={(e) =>
                            setEditableExtraction({
                              ...editableExtraction,
                              linkedin: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Raw Text View */}
                    <details className="resume-raw-details">
                      <summary style={{ cursor: "pointer", fontWeight: 600, color: "#60A5FA" }}>
                        View Full Raw Extracted Text ({editableExtraction.rawText?.length || 0} characters)
                      </summary>
                      <pre>{editableExtraction.rawText}</pre>
                    </details>
                  </div>

                  <div className="resume-review-actions">
                    <button
                      type="button"
                      className="resume-apply-btn"
                      onClick={handleApplyExtraction}
                    >
                      ✓ Confirm & Apply to Profile →
                    </button>
                    <button
                      type="button"
                      className="resume-dismiss-btn"
                      onClick={handleDismissReview}
                    >
                      Cancel / Keep Current
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {resumeError && (
            <div className="resume-error-banner">
              ⚠️ {resumeError}
            </div>
          )}
        </div>

        <GlowSeparator style={{ margin: "24px auto" }} />

        {/* 2. Personal Information & Baseline Role */}
        <div className="profile-block">
          <div className="profile-block-header">
            <span className="card-label">02 — PERSONAL & ROLE</span>
            <h3 className="profile-block-title">Basic Information</h3>
            <p className="profile-block-desc">
              Your contact details and starting baseline role for trajectory modeling.
            </p>
          </div>

          <div className="profile-grid">
            <div className="profile-field-group">
              <label className="profile-field-label">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Rivera"
                value={profile.name || ""}
                onChange={(e) =>
                  onProfileChange({ ...profile, name: e.target.value })
                }
              />
            </div>

            <div className="profile-field-group">
              <label className="profile-field-label">Current Role (Baseline)</label>
              <select
                value={profile.role || "Data Analyst"}
                onChange={(e) =>
                  onProfileChange({ ...profile, role: e.target.value })
                }
              >
                {availableRoles.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="profile-grid" style={{ marginTop: "14px" }}>
            <div className="profile-field-group">
              <label className="profile-field-label">Email Address</label>
              <input
                type="email"
                placeholder="e.g. alex.rivera@example.com"
                value={profile.email || ""}
                onChange={(e) =>
                  onProfileChange({ ...profile, email: e.target.value })
                }
              />
            </div>

            <div className="profile-field-group">
              <label className="profile-field-label">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. +1 (555) 019-2831"
                value={profile.phone || ""}
                onChange={(e) =>
                  onProfileChange({ ...profile, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="profile-field-group" style={{ marginTop: "14px" }}>
            <label className="profile-field-label">Career Interests</label>
            <span className="profile-field-helper">
              Domains or specializations you want to explore (e.g. Deep Learning, Distributed Data Systems, MLOps).
            </span>
            <input
              type="text"
              placeholder="e.g. Machine Learning, Cloud Architecture, Scalable Pipelines"
              value={profile.interests || ""}
              onChange={(e) =>
                onProfileChange({ ...profile, interests: e.target.value })
              }
            />
          </div>
        </div>

        <GlowSeparator style={{ margin: "24px auto" }} />

        {/* 3. Editable Core Profile Sections */}
        <div className="profile-block">
          <div className="profile-block-header">
            <span className="card-label">03 — COMPETENCIES & EXPERIENCE</span>
            <h3 className="profile-block-title">Skills, Experience & Background</h3>
            <p className="profile-block-desc">
              Edit your verified qualifications. These are evaluated by the trajectory scoring engine and roadmap generator.
            </p>
          </div>

          {/* Work Experience */}
          <div className="profile-field-group">
            <label className="profile-field-label">Work Experience</label>
            <span className="profile-field-helper">
              Outline your previous professional positions, key responsibilities, and technical contributions.
            </span>
            <textarea
              className="profile-textarea"
              rows={3}
              placeholder="e.g. Data Analyst at FinTech Corp (2022–Present): Built automated Python pipelines for transaction monitoring, managed PostgreSQL databases, and delivered executive Tableau dashboards."
              value={profile.experience || ""}
              onChange={(e) =>
                onProfileChange({ ...profile, experience: e.target.value })
              }
            />
          </div>

          {/* Skills */}
          <div className="profile-field-group" style={{ marginTop: "18px" }}>
            <label className="profile-field-label">Technical & Domain Skills</label>
            <span className="profile-field-helper">
              Enter your skills separated by commas or newlines (e.g. Python, SQL, Statistics, Machine Learning, Docker, Spark).
            </span>
            <textarea
              className="profile-textarea"
              rows={2}
              placeholder="e.g. Python, SQL, Statistics, Machine Learning, Spark, Docker, Cloud"
              value={profile.skills || ""}
              onChange={(e) =>
                onProfileChange({ ...profile, skills: e.target.value })
              }
            />

            <div className="skills-pill-preview">
              <div className="skills-pill-preview-title">
                Recognized Competencies ({parsedSkills.length}):
              </div>
              <div className="skill-list">
                {parsedSkills.length > 0 ? (
                  parsedSkills.map((skill) => (
                    <span
                      key={skill}
                      onClick={() => handleRemoveSkill(skill)}
                      style={{ cursor: "pointer" }}
                      title={`Click to remove ${skill}`}
                    >
                      ✓ {skill} <span style={{ marginLeft: "4px", opacity: 0.65 }}>×</span>
                    </span>
                  ))
                ) : (
                  <p style={{ color: "#64748B", fontSize: "12px", fontStyle: "italic", margin: "4px 0" }}>
                    No skills documented yet. Type skills above, click suggested skills, or extract from resume to preview recognized badges.
                  </p>
                )}
              </div>

              {suggestedRoleSkills.length > 0 && (
                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed rgba(255, 255, 255, 0.12)" }}>
                  <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
                    Suggested for {profile.role || "Current Role"} (click to add):
                  </div>
                  <div className="skill-list">
                    {suggestedRoleSkills.map((s) => (
                      <span
                        key={s}
                        onClick={() => handleAddSkill(s)}
                        style={{
                          cursor: "pointer",
                          background: "rgba(59, 130, 246, 0.12)",
                          borderColor: "rgba(59, 130, 246, 0.35)",
                          color: "#93C5FD",
                        }}
                        title={`Click to add ${s}`}
                      >
                        + {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Education */}
          <div className="profile-field-group" style={{ marginTop: "18px" }}>
            <label className="profile-field-label">Education & Degrees</label>
            <span className="profile-field-helper">
              Degrees, universities, relevant bootcamps, and academic background.
            </span>
            <textarea
              className="profile-textarea"
              rows={3}
              placeholder="e.g. B.S. in Computer Science — State University (2018–2022)."
              value={profile.education || ""}
              onChange={(e) =>
                onProfileChange({ ...profile, education: e.target.value })
              }
            />
          </div>

          {/* Certifications */}
          <div className="profile-field-group" style={{ marginTop: "18px" }}>
            <label className="profile-field-label">Certifications & Credentials</label>
            <span className="profile-field-helper">
              Industry certificates and verified licenses (e.g. AWS Certified Solutions Architect, Google Cloud Professional).
            </span>
            <textarea
              className="profile-textarea"
              rows={2}
              placeholder="e.g. AWS Certified Solutions Architect (2023), Google Professional Data Engineer."
              value={profile.certifications || ""}
              onChange={(e) =>
                onProfileChange({ ...profile, certifications: e.target.value })
              }
            />
          </div>

          {/* Projects */}
          <div className="profile-field-group" style={{ marginTop: "18px" }}>
            <label className="profile-field-label">Projects & Portfolio</label>
            <span className="profile-field-helper">
              Personal, open-source, or academic projects showcasing your hands-on ability.
            </span>
            <textarea
              className="profile-textarea"
              rows={3}
              placeholder="e.g. E-Commerce Recommender: Engineered collaborative filtering model in Python/Scikit-learn, evaluated on 50k interactions, containerized with Docker."
              value={profile.projects || ""}
              onChange={(e) =>
                onProfileChange({ ...profile, projects: e.target.value })
              }
            />
          </div>
        </div>

        <GlowSeparator style={{ margin: "24px auto" }} />

        {/* 4. Connected Accounts & Integrations */}
        <div className="profile-block">
          <div className="profile-block-header">
            <span className="card-label">04 — CONNECTED ACCOUNTS & SOCIALS</span>
            <h3 className="profile-block-title">Developer & Career Profiles</h3>
            <p className="profile-block-desc">
              Connect external services to showcase code contributions and professional credentials.
            </p>
          </div>

          <div className="profile-integrations-grid">
            {/* GitHub Card */}
            <div className="integration-card">
              <div>
                <div className="integration-card-top">
                  <div className="integration-card-identity">
                    {githubStatus.connected && githubStatus.user?.avatarUrl ? (
                      <img
                        src={githubStatus.user.avatarUrl}
                        alt={githubStatus.user.username}
                        className="github-avatar-img"
                      />
                    ) : (
                      <div className="integration-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div>
                      <div className="integration-card-title">
                        {githubStatus.connected && githubStatus.user ? (
                          <>
                            {githubStatus.user.name || githubStatus.user.username}
                            <span className="github-handle"> @{githubStatus.user.username}</span>
                          </>
                        ) : profile.github ? (
                          <>
                            GitHub Profile
                            <a
                              href={
                                profile.github.startsWith("http")
                                  ? profile.github
                                  : `https://github.com/${profile.github}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#60A5FA", marginLeft: "6px", fontSize: "12px" }}
                            >
                              ↗
                            </a>
                          </>
                        ) : (
                          "GitHub"
                        )}
                      </div>
                    </div>
                  </div>
                  {githubStatus.connected ? (
                    <span className="integration-badge connected">● Connected</span>
                  ) : profile.github ? (
                    <span className="integration-badge connected">✓ Linked</span>
                  ) : (
                    <span className="integration-badge">
                      {githubStatus.configured ? "Ready to Connect" : "Available"}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: "12px" }}>
                  <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    GitHub Profile URL or Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. https://github.com/alexrivera"
                    value={profile.github || ""}
                    onChange={(e) =>
                      onProfileChange({ ...profile, github: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #E2E8F0",
                      fontSize: "13px",
                      background: "#FFFFFF",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "10px" }}>
                {githubStatus.connected ? (
                  <div className="github-actions-row">
                    <button
                      type="button"
                      className="integration-btn"
                      onClick={handleToggleRepoBrowser}
                    >
                      {showRepoBrowser ? "Hide Repositories ▲" : "Browse Repositories →"}
                    </button>
                    <button
                      type="button"
                      className="github-disconnect-btn"
                      onClick={handleDisconnectGithub}
                      disabled={githubLoading}
                    >
                      {githubLoading ? "Disconnecting..." : "Disconnect"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="integration-btn"
                    onClick={handleConnectGithub}
                  >
                    Connect via OAuth →
                  </button>
                )}
              </div>
            </div>

            {/* LinkedIn Card */}
            <div className="integration-card">
              <div>
                <div className="integration-card-top">
                  <div className="integration-card-identity">
                    <div className="integration-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.3a1.62 1.62 0 1 0 1.62 1.62A1.62 1.62 0 0 0 7.86 6.3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="integration-card-title">
                        LinkedIn Profile
                        {profile.linkedin && (
                          <a
                            href={
                              profile.linkedin.startsWith("http")
                                ? profile.linkedin
                                : `https://linkedin.com/in/${profile.linkedin}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#60A5FA", marginLeft: "6px", fontSize: "12px" }}
                          >
                            ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {profile.linkedin ? (
                    <span className="integration-badge connected">✓ Linked</span>
                  ) : (
                    <span className="integration-badge">Available</span>
                  )}
                </div>

                <div style={{ marginTop: "12px" }}>
                  <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    LinkedIn Profile URL or Handle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. https://linkedin.com/in/alex-rivera-dev"
                    value={profile.linkedin || ""}
                    onChange={(e) =>
                      onProfileChange({ ...profile, linkedin: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #E2E8F0",
                      fontSize: "13px",
                      background: "#FFFFFF",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "10px" }}>
                <button
                  type="button"
                  className="integration-btn"
                  onClick={() => handleConnectClick("LinkedIn OAuth")}
                >
                  OAuth Sync (Coming Soon)
                </button>
              </div>
            </div>
          </div>

          {connectNotice && (
            <div className="integration-alert">
              ℹ️ {connectNotice}
            </div>
          )}

          {githubError && (
            <div className="resume-error-banner" style={{ marginTop: "14px" }}>
              ⚠️ {githubError}
            </div>
          )}

          {githubNotice && (
            <div className="resume-success-banner" style={{ marginTop: "14px" }}>
              ✓ {githubNotice}
            </div>
          )}

          {/* GitHub Repository Browser */}
          {githubStatus.connected && showRepoBrowser && (
            <div className="github-repo-browser">
              <div className="github-repo-browser-header">
                <div>
                  <h4 className="github-browser-title">Browse & Import GitHub Repositories</h4>
                  <p className="github-browser-desc">
                    Select which repositories to import into your projects portfolio. Skills inferred from repository languages and topics are tagged for review.
                  </p>
                </div>
                <div className="github-browser-actions">
                  <button
                    type="button"
                    className="github-select-all-btn"
                    onClick={handleSelectAllRepos}
                  >
                    {selectedRepoIds.size === repos.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
              </div>

              {loadingRepos ? (
                <div className="github-repos-loading">
                  <span>⏳</span> Fetching repositories from GitHub...
                </div>
              ) : repos.length === 0 ? (
                <p style={{ color: "#64748B", fontSize: "13px", padding: "16px 0" }}>
                  No repositories found for this account.
                </p>
              ) : (
                <>
                  <div className="github-inferred-panel">
                    <div className="github-inferred-title">
                      ⚡ Inferred Skills from Selected Repositories ({selectedInferredSkills.size}):
                    </div>
                    <div className="skill-list" style={{ marginTop: "8px" }}>
                      {Array.from(selectedInferredSkills).length > 0 ? (
                        Array.from(selectedInferredSkills).map((skill) => (
                          <span key={skill} className="github-inferred-pill">
                            ★ {skill}
                          </span>
                        ))
                      ) : (
                        <p style={{ color: "#64748B", fontSize: "12px", fontStyle: "italic", margin: "4px 0" }}>
                          Select repositories below to view inferred skills.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="github-repo-grid">
                    {repos.map((repo) => {
                      const isSelected = selectedRepoIds.has(repo.id);
                      return (
                        <div
                          key={repo.id}
                          className={`github-repo-card ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleRepoSelection(repo.id)}
                        >
                          <div className="github-repo-top">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRepoSelection(repo.id)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ width: "16px", height: "16px", cursor: "pointer" }}
                            />
                            <a
                              href={repo.url}
                              target="_blank"
                              rel="noreferrer"
                              className="github-repo-name"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {repo.name} ↗
                            </a>
                            {repo.language && (
                              <span className="github-repo-lang-badge">
                                {repo.language}
                              </span>
                            )}
                            {repo.stars > 0 && (
                              <span className="github-repo-stars">
                                ⭐ {repo.stars}
                              </span>
                            )}
                          </div>

                          <p className="github-repo-desc">{repo.description}</p>

                          {repo.inferredSkills && repo.inferredSkills.length > 0 && (
                            <div className="github-repo-inferred-tag">
                              Inferred: {repo.inferredSkills.join(", ")}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="github-repo-footer">
                    <button
                      type="button"
                      className="primary-button"
                      disabled={selectedRepoIds.size === 0}
                      onClick={handleOpenImportReview}
                    >
                      Review & Import Selected ({selectedRepoIds.size} Projects) →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Review Step Modal Before Adding to Profile */}
          {showImportReview && (
            <div className="resume-review-panel" style={{ marginTop: "20px" }}>
              <div className="resume-review-header">
                <div>
                  <h4 className="resume-review-title">Review Projects & Inferred Skills Before Adding</h4>
                  <p className="resume-review-desc">
                    Review and customize the formatted project entries and inferred skills below before appending to your profile. Existing profile entries will NOT be overwritten.
                  </p>
                </div>
                <span className="resume-review-meta">
                  GitHub OAuth Integration
                </span>
              </div>

              <div className="resume-review-fields">
                <div className="profile-field-group">
                  <label className="profile-field-label">
                    Projects to Append ({selectedRepoIds.size} Selected)
                  </label>
                  <span className="profile-field-helper">
                    You can edit the descriptions or format below before applying to your profile projects.
                  </span>
                  <textarea
                    className="profile-textarea"
                    rows={5}
                    value={importProjectsText}
                    onChange={(e) => setImportProjectsText(e.target.value)}
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-field-label">
                    Inferred Skills to Add ({selectedInferredSkills.size} Detected)
                  </label>
                  <div className="skills-pill-preview">
                    <div className="skill-list">
                      {Array.from(selectedInferredSkills).map((s) => (
                        <span key={s} className="github-inferred-pill">
                          + {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="resume-review-actions">
                <button
                  type="button"
                  className="resume-apply-btn"
                  onClick={handleApplyGithubImport}
                >
                  Add to Profile →
                </button>
                <button
                  type="button"
                  className="resume-dismiss-btn"
                  onClick={() => setShowImportReview(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <GlowSeparator style={{ margin: "24px auto" }} />

        {/* 5. Save Action */}
        <div style={{ paddingTop: "12px" }}>
          <button
            type="button"
            className="primary-button"
            style={{ width: "100%", textAlign: "center", fontSize: "16px" }}
            onClick={() => onSaveProfile(profile)}
          >
            Save Profile →
          </button>
        </div>
      </div>
    </section>
  );
}

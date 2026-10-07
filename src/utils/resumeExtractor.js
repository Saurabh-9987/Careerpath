import { careerData, availableRoles } from "../data/careerData.js";
import { normalizeSkill, parseProfileSkills } from "./careerScoring.js";

// Helper to decompress ArrayBuffer slice with DecompressionStream
async function decompressSlice(slice, format = "deflate") {
  const ds = new DecompressionStream(format);
  const writer = ds.writable.getWriter();
  writer.write(slice);
  writer.close();

  const chunks = [];
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // Combine Uint8Array chunks
  let totalLen = 0;
  for (const c of chunks) totalLen += c.length;
  const combined = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    combined.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(combined);
}

/**
 * Extracts readable text from a PDF ArrayBuffer or Uint8Array without external dependencies.
 */
export async function extractTextFromPdf(arrayBuffer) {
  const byteOffset = arrayBuffer.byteOffset || 0;
  const byteLength = arrayBuffer.byteLength;
  const buffer = arrayBuffer.buffer || arrayBuffer;
  const bytes = new Uint8Array(buffer, byteOffset, byteLength);

  const textDecoder = new TextDecoder("latin1");
  const rawString = textDecoder.decode(bytes);

  const streamMarker = "stream";
  const endStreamMarker = "endstream";

  let pos = 0;
  const decompressedStreams = [];

  while (pos < bytes.length) {
    const streamIdx = rawString.indexOf(streamMarker, pos);
    if (streamIdx === -1) break;

    // Check header before stream for /Filter
    const headerStart = Math.max(0, streamIdx - 300);
    const headerText = rawString.slice(headerStart, streamIdx);
    const isFlate = headerText.includes("/FlateDecode") || headerText.includes("/Fl");

    // stream data starts after \r\n or \n
    let dataStart = streamIdx + 6;
    if (bytes[dataStart] === 0x0d && bytes[dataStart + 1] === 0x0a) dataStart += 2;
    else if (bytes[dataStart] === 0x0a || bytes[dataStart] === 0x0d) dataStart += 1;

    const endIdx = rawString.indexOf(endStreamMarker, dataStart);
    if (endIdx === -1) break;

    let dataEnd = endIdx;
    if (bytes[dataEnd - 1] === 0x0a && bytes[dataEnd - 2] === 0x0d) dataEnd -= 2;
    else if (bytes[dataEnd - 1] === 0x0a || bytes[dataEnd - 1] === 0x0d) dataEnd -= 1;

    if (dataEnd > dataStart) {
      const slice = bytes.subarray(dataStart, dataEnd);
      if (isFlate) {
        let text = "";
        try {
          text = await decompressSlice(slice, "deflate");
        } catch {
          try {
            text = await decompressSlice(slice, "deflate-raw");
          } catch {
            // Non-deflate or corrupted stream
          }
        }
        if (text) decompressedStreams.push(text);
      } else {
        // Uncompressed stream
        try {
          const text = new TextDecoder("utf-8", { fatal: false }).decode(slice);
          if (text) decompressedStreams.push(text);
        } catch {
          // ignore
        }
      }
    }

    pos = endIdx + 9;
  }

  // Parse text operators from all streams
  let fullExtractedText = "";

  for (const streamContent of decompressedStreams) {
    const streamText = parsePdfStreamOperators(streamContent);
    if (streamText.trim()) {
      fullExtractedText += streamText + "\n";
    }
  }

  // If streams had limited text, try parsing raw uncompressed text objects in the PDF
  if (fullExtractedText.trim().length < 50) {
    const fallbackText = parsePdfStreamOperators(rawString);
    if (fallbackText.length > fullExtractedText.length) {
      fullExtractedText = fallbackText;
    }
  }

  return fullExtractedText.trim();
}

/**
 * Parses PostScript/PDF text operators (BT..ET, Tj, TJ, escapes, and positioning)
 */
function parsePdfStreamOperators(content) {
  let output = "";
  // Match text blocks BT ... ET
  const btEtRegex = /BT[\s\S]*?ET/g;
  let blockMatch;

  const parseStringLiteral = (str) => {
    // Unescape PDF octal (\ooo) and standard escapes
    return str
      .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\b/g, "\b")
      .replace(/\\f/g, "\f")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\");
  };

  const parseHexLiteral = (hex) => {
    let clean = hex.replace(/\s+/g, "");
    if (clean.length % 2 !== 0) clean += "0";
    let res = "";
    for (let i = 0; i < clean.length; i += 2) {
      res += String.fromCharCode(parseInt(clean.slice(i, i + 2), 16));
    }
    return res;
  };

  const processBlock = (block) => {
    let blockText = "";
    const tokenRegex = /(\((?:[^()\\]|\\.)*\)|<[0-9a-fA-F\s]+>)\s*Tj|\[((?:[^[\]]|\((?:[^()\\]|\\.)*\))*)\]\s*TJ|(\((?:[^()\\]|\\.)*\))\s*['"]|(-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+T[dD]|T\*)/g;

    let match;
    while ((match = tokenRegex.exec(block)) !== null) {
      if (match[1]) {
        // (text) Tj or <hex> Tj
        const raw = match[1];
        if (raw.startsWith("(")) {
          blockText += parseStringLiteral(raw.slice(1, -1));
        } else if (raw.startsWith("<")) {
          blockText += parseHexLiteral(raw.slice(1, -1));
        }
      } else if (match[2]) {
        // [(item1) -10 (item2)] TJ
        const arrayContent = match[2];
        const innerRegex = /\(((?:[^()\\]|\\.)*)\)|<([0-9a-fA-F\s]+)>|(-?\d+(?:\.\d+)?)/g;
        let innerMatch;
        while ((innerMatch = innerRegex.exec(arrayContent)) !== null) {
          if (innerMatch[1] !== undefined) {
            blockText += parseStringLiteral(innerMatch[1]);
          } else if (innerMatch[2] !== undefined) {
            blockText += parseHexLiteral(innerMatch[2]);
          } else if (innerMatch[3] !== undefined) {
            const kern = parseFloat(innerMatch[3]);
            if (kern < -100) {
              blockText += " ";
            }
          }
        }
      } else if (match[3]) {
        // (text) ' or "
        blockText += "\n" + parseStringLiteral(match[3].slice(1, -1));
      } else if (match[4]) {
        // Line break operators
        blockText += "\n";
      }
    }
    return blockText;
  };

  while ((blockMatch = btEtRegex.exec(content)) !== null) {
    const blockText = processBlock(blockMatch[0]);
    if (blockText.trim()) {
      output += blockText + "\n";
    }
  }

  // If no BT..ET blocks found, try finding raw Tj/TJ
  if (!output.trim()) {
    output = processBlock(content);
  }

  return output;
}

/**
 * Extracts readable text from a DOCX (PKZip) ArrayBuffer or Uint8Array without external dependencies.
 */
export async function extractTextFromDocx(arrayBuffer) {
  const byteOffset = arrayBuffer.byteOffset || 0;
  const byteLength = arrayBuffer.byteLength;
  const buffer = arrayBuffer.buffer || arrayBuffer;
  const bytes = new Uint8Array(buffer, byteOffset, byteLength);
  const view = new DataView(buffer, byteOffset, byteLength);

  // Locate End of Central Directory Record (0x06054b50)
  let eocdOffset = -1;
  const maxSearch = Math.min(bytes.length, 65557);
  for (let i = bytes.length - 22; i >= bytes.length - maxSearch; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error("Invalid DOCX file: End of Central Directory record not found.");
  }

  const cdStart = view.getUint32(eocdOffset + 16, true);
  const cdEntries = view.getUint16(eocdOffset + 8, true);

  const xmlEntries = [];
  let p = cdStart;

  for (let i = 0; i < cdEntries; i++) {
    const sig = view.getUint32(p, true);
    if (sig !== 0x02014b50) break;

    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOffset = view.getUint32(p + 42, true);

    const nameBytes = bytes.subarray(p + 46, p + 46 + nameLen);
    const entryName = new TextDecoder().decode(nameBytes);

    if (
      entryName === "word/document.xml" ||
      entryName.startsWith("word/header") ||
      entryName.startsWith("word/footer")
    ) {
      const locNameLen = view.getUint16(localOffset + 26, true);
      const locExtraLen = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + locNameLen + locExtraLen;
      const compBytes = bytes.subarray(dataStart, dataStart + compSize);

      xmlEntries.push({ name: entryName, method, compBytes });
    }

    p += 46 + nameLen + extraLen + commentLen;
  }

  if (xmlEntries.length === 0) {
    throw new Error("Invalid DOCX file: word/document.xml not found.");
  }

  // Prioritize headers first, then document.xml, then footers
  xmlEntries.sort((a, b) => {
    if (a.name.includes("header")) return -1;
    if (b.name.includes("header")) return 1;
    if (a.name === "word/document.xml") return -1;
    if (b.name === "word/document.xml") return 1;
    return 0;
  });

  let fullText = "";

  for (const entry of xmlEntries) {
    let xmlText = "";
    if (entry.method === 8) {
      // Deflate-raw
      xmlText = await decompressSlice(entry.compBytes, "deflate-raw");
    } else if (entry.method === 0) {
      xmlText = new TextDecoder().decode(entry.compBytes);
    }

    if (xmlText) {
      const parsedXmlText = parseWordXml(xmlText);
      if (parsedXmlText.trim()) {
        fullText += parsedXmlText + "\n";
      }
    }
  }

  return fullText.trim();
}

/**
 * Parses word/document.xml text into paragraphs and lines.
 */
function parseWordXml(xml) {
  // Convert <w:p> to newlines, <w:tab/> to spaces, <w:br/> to newlines
  const textRuns = [];

  // Match paragraphs or table rows
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let pMatch;

  while ((pMatch = pRegex.exec(xml)) !== null) {
    const pContent = pMatch[1];
    let line = "";

    // Extract all text tags <w:t> or <w:tab> or <w:br>
    const tokenRegex = /<w:t\b[^>]*>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(pContent)) !== null) {
      if (tMatch[1] !== undefined) {
        line += tMatch[1];
      } else if (tMatch[0] === "<w:tab/>") {
        line += "  ";
      } else if (tMatch[0] === "<w:br/>") {
        line += "\n";
      }
    }

    // Decode standard XML entities
    const decoded = line
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();

    if (decoded) {
      textRuns.push(decoded);
    }
  }

  return textRuns.join("\n");
}

/**
 * Reads any supported file (PDF, DOCX, TXT) and returns raw text.
 */
export async function extractTextFromFile(file) {
  if (!file) throw new Error("No file provided.");

  const extension = "." + file.name.split(".").pop().toLowerCase();

  if (extension === ".pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const text = await extractTextFromPdf(arrayBuffer);
    if (!text || text.trim().length === 0) {
      throw new Error(
        "Could not extract readable text from PDF. The document may be scanned/image-based or protected."
      );
    }
    return text;
  }

  if (extension === ".docx") {
    const arrayBuffer = await file.arrayBuffer();
    const text = await extractTextFromDocx(arrayBuffer);
    if (!text || text.trim().length === 0) {
      throw new Error(
        "Could not extract readable text from DOCX. The document body appears to be empty."
      );
    }
    return text;
  }

  if (extension === ".txt" || extension === ".md") {
    const text = await file.text();
    return text;
  }

  throw new Error(`Unsupported file type: ${file.name}. Please upload a PDF (.pdf) or Word document (.docx).`);
}

/**
 * Comprehensive technical & domain skill dictionary compiled from all 20 careers
 * plus widely recognized industry technical skills.
 */
export const TECH_SKILL_LEXICON = [
  // Core Career Skills from dataset
  "Python",
  "SQL",
  "Statistics",
  "Machine Learning",
  "Deep Learning",
  "Spark",
  "Cloud",
  "Docker",
  "Kubernetes",
  "Data Visualization",
  "Feature Engineering",
  "Scikit-Learn",
  "Pandas",
  "NumPy",
  "Tableau",
  "Power BI",
  "Kafka",
  "Airflow",
  "dbt",
  "Snowflake",
  "MLOps",
  "PyTorch",
  "TensorFlow",
  "FastAPI",
  "Flask",
  "Django",
  "Linux",
  "Git",
  "CI/CD",
  "AWS",
  "GCP",
  "Azure",
  "Algorithms",
  "Data Structures",
  "OOP",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Next.js",
  "Vue",
  "Angular",
  "HTML/CSS",
  "REST APIs",
  "GraphQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "C++",
  "C#",
  "Java",
  "Go",
  "Rust",
  "Unity",
  "Unreal Engine",
  "Figma",
  "UI/UX",
  "LLMs",
  "NLP",
  "OpenCV",
  "Computer Vision",
  "React Native",
  "Flutter",
  "Terraform",
  "Ansible",
  "Prompt Engineering",
  "RAG",
  "LangChain",
  "Hugging Face",
  "Cybersecurity",
  "Penetration Testing",
  "Network Security",
  "BigQuery",
  "Redshift",
  "Databricks",
  "Excel",
];

/**
 * Extracts structured profile fields from raw resume text using heuristics and pattern recognition.
 */
export function parseResumeText(rawText, filename = "") {
  if (!rawText || typeof rawText !== "string") {
    return {
      name: "",
      email: "",
      phone: "",
      skills: [],
      skillsString: "",
      experience: "",
      education: "",
      projects: "",
      certifications: "",
      github: "",
      linkedin: "",
      role: "",
      rawText: "",
      filename,
      extractionMethod: "Browser-native document text parser (PDF/DOCX)",
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Email extraction
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = rawText.match(emailRegex);
  const email = emailMatch ? emailMatch[1].toLowerCase() : "";

  // 2. Phone extraction
  const phoneRegex = /(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i;
  const phoneMatch = rawText.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0].trim() : "";

  // 3. GitHub extraction
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i;
  const githubMatch = rawText.match(githubRegex);
  const github = githubMatch ? `https://github.com/${githubMatch[1]}` : "";

  // 4. LinkedIn extraction
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/([a-zA-Z0-9_-]+)/i;
  const linkedinMatch = rawText.match(linkedinRegex);
  const linkedin = linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : "";

  // 5. Name extraction
  let name = "";
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    // Skip if line has email, phone, url, or common resume titles
    if (
      emailRegex.test(line) ||
      phoneRegex.test(line) ||
      /github|linkedin|resume|curriculum|vitae|page\s*\d/i.test(line)
    ) {
      continue;
    }
    // Check if looks like a name: 2-4 capitalized words, no numbers or special symbols
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4) {
      const isValidName = words.every((w) => /^[A-Z][a-zA-Z.'-]*$/.test(w));
      if (isValidName) {
        name = line;
        break;
      }
    }
  }

  // 6. Section Partitioning
  const sectionKeywords = {
    skills: /^(?:technical\s+|core\s+|domain\s+)?(?:skills|competencies|technologies|tech\s+stack|core\s+competencies|tools\s*(?:&|and)\s*technologies|languages\s*(?:&|and)\s*frameworks)\b/i,
    experience: /^(?:work\s+|professional\s+|employment\s+|relevant\s+)?(?:experience|history|employment|internships|background)\b/i,
    education: /^(?:education|academic\s+background|degrees|academic\s+history|educational\s+background)\b/i,
    projects: /^(?:personal\s+|academic\s+|technical\s+|key\s+|selected\s+|featured\s+)?(?:projects|portfolio)\b/i,
    certifications: /^(?:certifications|licenses|credentials|certificates|awards\s*&?\s*certifications)\b/i,
  };

  const sections = {
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    other: [],
  };

  let currentSection = "other";

  for (const line of lines) {
    const cleanedLine = line.replace(/^[\s#*•\-_]+/, "").trim();
    let detectedNewSection = false;

    for (const [secName, regex] of Object.entries(sectionKeywords)) {
      if (regex.test(cleanedLine) && cleanedLine.split(/\s+/).length <= 4) {
        currentSection = secName;
        detectedNewSection = true;
        break;
      }
    }

    if (!detectedNewSection) {
      sections[currentSection].push(line);
    }
  }

  // 7. Skills extraction
  const detectedSkills = new Set();

  // A. Scan entire resume against comprehensive TECH_SKILL_LEXICON
  for (const skill of TECH_SKILL_LEXICON) {
    const escaped = skill.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    // Word boundary check (handle C++, C# special characters)
    let pattern;
    if (skill === "C++" || skill === "c++") {
      pattern = /(?:^|[\s,;/|(])c\+\+(?:$|[\s,;/|)])/i;
    } else if (skill === "C#" || skill === "c#") {
      pattern = /(?:^|[\s,;/|(])c#(?:$|[\s,;/|)])/i;
    } else if (skill === "R" || skill === "r") {
      pattern = /(?:^|[\s,;/|(])R(?:$|[\s,;/|)])/;
    } else {
      pattern = new RegExp(`\\b${escaped}\\b`, "i");
    }

    if (pattern.test(rawText)) {
      detectedSkills.add(skill);
    }
  }

  // B. Also parse comma/bullet separated skill tokens directly from the Skills section
  if (sections.skills.length > 0) {
    const skillSectionText = sections.skills.join("\n");
    const rawTokens = skillSectionText
      .split(/[,;•|\n]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1 && t.length < 35 && !/^(?:proficient|familiar|skills|tools):/i.test(t));

    for (const token of rawTokens) {
      const cleanToken = token.replace(/^[•*\-\s]+/, "").trim();
      if (cleanToken && cleanToken.length <= 30 && !cleanToken.includes("http")) {
        // Find matching skill in lexicon or keep token
        const matchInLexicon = TECH_SKILL_LEXICON.find(
          (s) => s.toLowerCase() === cleanToken.toLowerCase()
        );
        if (matchInLexicon) {
          detectedSkills.add(matchInLexicon);
        } else if (/^[a-zA-Z0-9\s.+/-]+$/.test(cleanToken)) {
          // Capitalize first letter of each word
          const formatted = cleanToken
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          detectedSkills.add(formatted);
        }
      }
    }
  }

  const skillsList = Array.from(detectedSkills);

  // 8. Education extraction
  let education = "";
  if (sections.education.length > 0) {
    education = sections.education.join("\n").trim();
  } else {
    // Search for degree keywords in text
    const eduLines = lines.filter((l) =>
      /\b(?:B\.S\.|M\.S\.|B\.Tech|Ph\.D\.|Bachelor|Master|Degree|University|College|Institute|GPA)\b/i.test(
        l
      )
    );
    if (eduLines.length > 0) {
      education = eduLines.slice(0, 3).join("\n");
    }
  }

  // 9. Work Experience extraction
  let experience = "";
  if (sections.experience.length > 0) {
    experience = sections.experience.join("\n").trim();
  }

  // 10. Projects extraction
  let projects = "";
  if (sections.projects.length > 0) {
    projects = sections.projects.join("\n").trim();
  }

  // 11. Certifications extraction
  let certifications = "";
  if (sections.certifications.length > 0) {
    certifications = sections.certifications.join("\n").trim();
  } else {
    const certLines = lines.filter((l) =>
      /\b(?:Certified|Certification|Certificate|AWS\s+Certified|Google\s+Cloud|Azure\s+Certified|CompTIA|PMP)\b/i.test(
        l
      )
    );
    if (certLines.length > 0) {
      certifications = certLines.slice(0, 4).join("\n");
    }
  }

  // 12. Suggested Baseline Role from availableRoles
  let suggestedRole = "";
  for (const roleOption of availableRoles) {
    const roleRegex = new RegExp(`\\b${roleOption.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}\\b`, "i");
    if (roleRegex.test(rawText)) {
      suggestedRole = roleOption;
      break;
    }
  }

  // If no direct role title match, suggest role based on highest skill match
  if (!suggestedRole && skillsList.length > 0) {
    let bestRole = "";
    let maxMatch = 0;
    for (const [roleName, rData] of Object.entries(careerData)) {
      const matchCount = (rData.skills || []).filter((reqSkill) =>
        skillsList.some((s) => normalizeSkill(s) === normalizeSkill(reqSkill))
      ).length;
      if (matchCount > maxMatch) {
        maxMatch = matchCount;
        bestRole = roleName;
      }
    }
    if (bestRole) suggestedRole = bestRole;
  }

  return {
    name,
    email,
    phone,
    skills: skillsList,
    skillsString: skillsList.join(", "),
    experience,
    education,
    projects,
    certifications,
    github,
    linkedin,
    role: suggestedRole,
    rawText,
    filename,
    extractionMethod: "Browser-native document text parser (PDF/DOCX)",
  };
}

/**
 * Non-destructively merges extracted resume data with the user's existing profile.
 * - Deduplicates skills.
 * - Preserves existing user data when extraction is uncertain.
 * - Provides clean list of new vs existing skills.
 */
export function mergeProfileWithExtracted(currentProfile = {}, extracted = {}) {
  const existingSkillsList = parseProfileSkills(currentProfile.skills);
  const extractedSkillsList = Array.isArray(extracted.skills)
    ? extracted.skills
    : parseProfileSkills(extracted.skills);

  // Deduplicate skills: find new skills not yet in profile
  const newSkills = extractedSkillsList.filter((extractedSkill) => {
    const normExt = normalizeSkill(extractedSkill);
    return !existingSkillsList.some(
      (existing) => normalizeSkill(existing) === normExt || existing.toLowerCase() === extractedSkill.toLowerCase()
    );
  });

  // Combined list retains existing first, then appends newly discovered skills
  const mergedSkillsList = [...existingSkillsList, ...newSkills];
  const mergedSkillsString = mergedSkillsList.join(", ");

  // Merge text fields non-destructively
  const mergeTextField = (existing, incoming) => {
    const cleanExisting = (existing || "").trim();
    const cleanIncoming = (incoming || "").trim();

    if (!cleanExisting) return cleanIncoming;
    if (!cleanIncoming) return cleanExisting;
    if (cleanExisting.includes(cleanIncoming)) return cleanExisting;
    return `${cleanExisting}\n\n${cleanIncoming}`;
  };

  const mergedExperience = mergeTextField(currentProfile.experience, extracted.experience);
  const mergedEducation = mergeTextField(currentProfile.education, extracted.education);
  const mergedProjects = mergeTextField(currentProfile.projects, extracted.projects);
  const mergedCertifications = mergeTextField(currentProfile.certifications, extracted.certifications);

  // Single-value fields: prioritize existing if set, otherwise fill from extraction
  const mergedName = currentProfile.name?.trim() ? currentProfile.name : (extracted.name || "");
  const mergedEmail = currentProfile.email?.trim() ? currentProfile.email : (extracted.email || "");
  const mergedPhone = currentProfile.phone?.trim() ? currentProfile.phone : (extracted.phone || "");
  const mergedGithub = currentProfile.github?.trim() ? currentProfile.github : (extracted.github || "");
  const mergedLinkedin = currentProfile.linkedin?.trim() ? currentProfile.linkedin : (extracted.linkedin || "");
  const mergedRole = currentProfile.role || extracted.role || "Data Analyst";

  return {
    mergedProfile: {
      ...currentProfile,
      name: mergedName,
      role: mergedRole,
      email: mergedEmail,
      phone: mergedPhone,
      skills: mergedSkillsString,
      experience: mergedExperience,
      education: mergedEducation,
      projects: mergedProjects,
      certifications: mergedCertifications,
      github: mergedGithub,
      linkedin: mergedLinkedin,
      interests: currentProfile.interests || "",
      resumeName: extracted.filename || currentProfile.resumeName || "",
      resumeLastModified: new Date().toLocaleDateString(),
    },
    newSkills,
    existingSkillsList,
    mergedSkillsList,
  };
}

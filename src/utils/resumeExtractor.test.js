import test from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import {
  parseResumeText,
  mergeProfileWithExtracted,
  extractTextFromPdf,
  extractTextFromDocx,
} from "./resumeExtractor.js";

test("parseResumeText correctly extracts all structured fields from resume text", () => {
  const sampleResume = `
Alex Rivera
alex.rivera@example.com | (555) 019-2831 | New York, NY
github.com/alexrivera | linkedin.com/in/alex-rivera-dev

PROFESSIONAL SUMMARY
Results-driven Data Analyst with 3 years of experience in business intelligence, SQL querying, and Python automation.

TECHNICAL SKILLS
Languages & Frameworks: Python, SQL, JavaScript, React, R
Tools & Platforms: Docker, AWS, Tableau, PostgreSQL, Git, Linux
Core Competencies: Machine Learning, Statistics, Data Visualization, REST APIs

PROFESSIONAL EXPERIENCE
Senior Data Analyst — FinTech Corp (2022–Present)
• Automated daily transaction monitoring pipelines using Python and SQL.
• Built interactive Tableau dashboards consumed by 50+ business stakeholders.

Data Analyst Intern — Metrics LLC (2021–2022)
• Performed exploratory data analysis with Pandas and NumPy.

EDUCATION
B.S. in Computer Science — State University (2018–2022)
GPA: 3.8 / 4.0

KEY PROJECTS
E-Commerce Recommendation Engine: Built collaborative filtering model in Python and Scikit-Learn.
GitHub: github.com/alexrivera/recommender

CERTIFICATIONS
AWS Certified Solutions Architect — Associate (2023)
  `;

  const parsed = parseResumeText(sampleResume, "Alex_Rivera_Resume.pdf");

  assert.equal(parsed.name, "Alex Rivera");
  assert.equal(parsed.email, "alex.rivera@example.com");
  assert.equal(parsed.phone, "(555) 019-2831");
  assert.equal(parsed.github, "https://github.com/alexrivera");
  assert.equal(parsed.linkedin, "https://linkedin.com/in/alex-rivera-dev");

  // Skills
  assert.ok(parsed.skills.includes("Python"), "Should include Python");
  assert.ok(parsed.skills.includes("SQL"), "Should include SQL");
  assert.ok(parsed.skills.includes("Machine Learning"), "Should include Machine Learning");
  assert.ok(parsed.skills.includes("Docker"), "Should include Docker");
  assert.ok(parsed.skills.includes("AWS"), "Should include AWS");
  assert.ok(parsed.skills.includes("Statistics"), "Should include Statistics");

  // Education & Experience
  assert.ok(parsed.education.includes("State University"), "Should extract education institution");
  assert.ok(parsed.experience.includes("FinTech Corp"), "Should extract experience");
  assert.ok(parsed.projects.includes("Recommendation Engine"), "Should extract projects");
  assert.ok(parsed.certifications.includes("AWS Certified"), "Should extract certifications");
});

test("mergeProfileWithExtracted non-destructively merges data and deduplicates skills", () => {
  const currentProfile = {
    name: "Alex Existing",
    role: "Data Analyst",
    email: "existing@example.com",
    skills: "Python, SQL",
    experience: "Existing experience at Company A",
    education: "B.S. Mathematics",
    projects: "Project Alpha",
    certifications: "",
    github: "",
    linkedin: "",
  };

  const extracted = {
    name: "Alex Extracted",
    role: "Data Scientist",
    email: "new@example.com",
    phone: "555-123-4567",
    skills: ["Python", "sql", "Machine Learning", "Docker", "AWS"],
    experience: "New experience at Company B",
    education: "B.S. Mathematics",
    projects: "Project Beta",
    certifications: "AWS Certified Developer",
    github: "https://github.com/alexdev",
    linkedin: "https://linkedin.com/in/alexdev",
    filename: "Alex_Resume.pdf",
  };

  const { mergedProfile, newSkills, existingSkillsList } = mergeProfileWithExtracted(
    currentProfile,
    extracted
  );

  // Existing name & email preserved because current profile already had them
  assert.equal(mergedProfile.name, "Alex Existing");
  assert.equal(mergedProfile.email, "existing@example.com");

  // Empty fields populated from extracted
  assert.equal(mergedProfile.phone, "555-123-4567");
  assert.equal(mergedProfile.github, "https://github.com/alexdev");
  assert.equal(mergedProfile.linkedin, "https://linkedin.com/in/alexdev");
  assert.equal(mergedProfile.certifications, "AWS Certified Developer");

  // Skills deduplicated
  assert.deepEqual(existingSkillsList, ["Python", "SQL"]);
  assert.deepEqual(newSkills, ["Machine Learning", "Docker", "AWS"]);
  assert.equal(mergedProfile.skills, "Python, SQL, Machine Learning, Docker, AWS");

  // User role preserved
  assert.equal(mergedProfile.role, "Data Analyst");

  // Experience and projects non-destructively merged
  assert.ok(mergedProfile.experience.includes("Company A"));
  assert.ok(mergedProfile.experience.includes("Company B"));
  assert.ok(mergedProfile.projects.includes("Project Alpha"));
  assert.ok(mergedProfile.projects.includes("Project Beta"));
});

test("extractTextFromPdf decompresses and extracts text from binary PDF streams", async () => {
  const samplePdfText =
    "BT /F1 12 Tf 72 712 Td (John Doe) Tj 0 -20 Td (john@example.com | 555-432-1098) Tj 0 -20 Td [(Skills: ) (Python, ) (SQL, ) (Machine Learning)] TJ ET";
  const compressed = zlib.deflateSync(Buffer.from(samplePdfText));
  const pdfHeader = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Length " + compressed.length + " /Filter /FlateDecode >>\nstream\r\n"
  );
  const pdfFooter = Buffer.from("\r\nendstream\nendobj\n%%EOF");
  const pdfBuf = Buffer.concat([pdfHeader, compressed, pdfFooter]);

  const extracted = await extractTextFromPdf(pdfBuf);
  assert.ok(extracted.includes("John Doe"), "Should extract name from PDF stream");
  assert.ok(extracted.includes("john@example.com"), "Should extract email from PDF stream");
  assert.ok(extracted.includes("Machine Learning"), "Should extract skills from TJ array");
});

test("extractTextFromDocx extracts text from binary DOCX (PKZip) stream", async () => {
  const docXml =
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Jane Smith</w:t></w:r></w:p><w:p><w:r><w:t>jane.smith@example.org | 555-888-9999</w:t></w:r></w:p><w:p><w:r><w:t>Skills: React, TypeScript, Node.js, Docker</w:t></w:r></w:p></w:body></w:document>';
  const compDocXml = zlib.deflateRawSync(Buffer.from(docXml));
  const fn = "word/document.xml";
  const fnBuf = Buffer.from(fn);

  const lfh = Buffer.alloc(30 + fnBuf.length);
  lfh.writeUInt32LE(0x04034b50, 0);
  lfh.writeUInt16LE(20, 4);
  lfh.writeUInt16LE(0, 6);
  lfh.writeUInt16LE(8, 8); // deflate
  lfh.writeUInt32LE(0, 10);
  lfh.writeUInt32LE(0, 14);
  lfh.writeUInt32LE(compDocXml.length, 18);
  lfh.writeUInt32LE(Buffer.byteLength(docXml), 22);
  lfh.writeUInt16LE(fnBuf.length, 26);
  lfh.writeUInt16LE(0, 28);
  fnBuf.copy(lfh, 30);

  const cdh = Buffer.alloc(46 + fnBuf.length);
  cdh.writeUInt32LE(0x02014b50, 0);
  cdh.writeUInt16LE(20, 4);
  cdh.writeUInt16LE(20, 6);
  cdh.writeUInt16LE(0, 8);
  cdh.writeUInt16LE(8, 10);
  cdh.writeUInt32LE(0, 12);
  cdh.writeUInt32LE(0, 16);
  cdh.writeUInt32LE(compDocXml.length, 20);
  cdh.writeUInt32LE(Buffer.byteLength(docXml), 24);
  cdh.writeUInt16LE(fnBuf.length, 28);
  cdh.writeUInt16LE(0, 30);
  cdh.writeUInt16LE(0, 32);
  cdh.writeUInt16LE(0, 34);
  cdh.writeUInt16LE(0, 36);
  cdh.writeUInt32LE(0, 38);
  cdh.writeUInt32LE(0, 42);
  fnBuf.copy(cdh, 46);

  const cdOffset = lfh.length + compDocXml.length;
  const cdSize = cdh.length;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  const zipBuf = Buffer.concat([lfh, compDocXml, cdh, eocd]);
  const extracted = await extractTextFromDocx(zipBuf);

  assert.ok(extracted.includes("Jane Smith"), "Should extract name from DOCX");
  assert.ok(extracted.includes("jane.smith@example.org"), "Should extract email from DOCX");
  assert.ok(extracted.includes("React, TypeScript"), "Should extract skills from DOCX");
});

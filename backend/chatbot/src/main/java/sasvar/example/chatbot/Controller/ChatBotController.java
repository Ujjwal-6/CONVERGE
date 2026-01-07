package sasvar.example.chatbot.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import sasvar.example.chatbot.Service.ChatBotService;
import sasvar.example.chatbot.Database.JsonData;
import sasvar.example.chatbot.Exception.ProfileNotFoundException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ChatBotController {

    private final ChatBotService chatBotService;

    public ChatBotController(ChatBotService chatBotService) {
        this.chatBotService = chatBotService;
    }

    /**
     * Parse resume → store JSON in DB → return stored profile (only top-level fields)
     * Frontend should send JSON:
     * {
     *   "resumeText": "...",
     *   "name": "...",                // optional: provided profile fields
     *   "year": "...",
     *   "department": "...",
     *   "institution": "...",
     *   "availability": "low|medium|high"
     * }
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(@RequestBody Map<String, Object> request) {
        try {
            String resumeText = (String) request.get("resumeText");
            String resumePdfBase64 = (String) request.get("resumePdf");
            String name = (String) request.get("name");
            String year = (String) request.get("year");
            String department = (String) request.get("department");
            String institution = (String) request.get("institution");
            String availability = (String) request.get("availability");

            // get current user email
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
            }
            String email = auth.getName();

            String json = "{}";
            if (resumeText != null && !resumeText.isBlank()) {
                json = chatBotService.convertJSON(resumeText);
            }

            // Decode base64 PDF to bytes
            byte[] pdfBytes = null;
            if (resumePdfBase64 != null && !resumePdfBase64.isBlank()) {
                try {
                    pdfBytes = java.util.Base64.getDecoder().decode(resumePdfBase64);
                } catch (IllegalArgumentException e) {
                    System.out.println("Invalid base64 PDF: " + e.getMessage());
                }
            }

            // Use saveJsonForEmail WITH PDF bytes only
            JsonData saved = chatBotService.saveJsonForEmail(
                    json, email, name, year, department, institution, availability,
                    pdfBytes
            );

            Map<String, Object> profile = new HashMap<>();
            profile.put("email", saved.getEmail());
            profile.put("name", saved.getName());
            profile.put("year", saved.getYear());
            profile.put("department", saved.getDepartment());
            profile.put("institution", saved.getInstitution());
            profile.put("availability", saved.getAvailability());
            // Return PDF download URL instead of base64
            if (saved.getResumePdf() != null) {
                profile.put("resumePdfUrl", "/api/resume/download/" + saved.getId());
            }

            try { chatBotService.sendResumeJson(saved); } catch (Exception ignored) {}

            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to upload and parse resume"));
        }
    }

    // Return current user's profile (only top-level fields — exclude parsed JSON)
    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUserProfile() {
        try {
            JsonData data = chatBotService.getProfileForCurrentUser();
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", data.getId());
            profile.put("email", data.getEmail());
            profile.put("name", data.getName());
            profile.put("year", data.getYear());
            profile.put("department", data.getDepartment());
            profile.put("institution", data.getInstitution());
            profile.put("availability", data.getAvailability());
            profile.put("Resume", data.getProfileJson());
            // Return PDF download URL instead of base64
            if (data.getResumePdf() != null) {
                profile.put("resumePdfUrl", "/api/resume/download/" + data.getId());
            }

            return ResponseEntity.ok(profile);
        } catch (ProfileNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Profile not found"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to fetch profile"));
        }
    }

    // NEW: Download resume PDF as file
    @GetMapping("/resume/download/{id}")
    public ResponseEntity<?> downloadResumePdf(@PathVariable Long id) {
        try {
            JsonData data = chatBotService.getProfileById(id);
            if (data == null || data.getResumePdf() == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Resume PDF not found");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "resume_" + id + ".pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(data.getResumePdf());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to download resume");
        }
    }

    // NEW: Download current user's resume PDF
    @GetMapping("/resume/download")
    public ResponseEntity<?> downloadMyResumePdf() {
        try {
            JsonData data = chatBotService.getProfileForCurrentUser();
            if (data.getResumePdf() == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Resume PDF not found");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "resume_" + data.getId() + ".pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(data.getResumePdf());

        } catch (ProfileNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Profile not found");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to download resume");
        }
    }

    /**
     * Update existing resume with new PDF and parsing.
     * This only updates the resume content and PDF, not other profile details.
     * Frontend should send JSON:
     * {
     *   "resumeText": "...",
     *   "resumePdf": "base64..."
     * }
     */
    @PutMapping("/resume/update")
    public ResponseEntity<?> updateResume(@RequestBody Map<String, Object> request) {
        try {
            String resumeText = (String) request.get("resumeText");
            String resumePdfBase64 = (String) request.get("resumePdf");

            // get current user email
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
            }
            String email = auth.getName();

            // Parse new resume text if provided
            String json = "{}";
            if (resumeText != null && !resumeText.isBlank()) {
                json = chatBotService.convertJSON(resumeText);
            }

            // Decode base64 PDF to bytes if provided
            byte[] pdfBytes = null;
            if (resumePdfBase64 != null && !resumePdfBase64.isBlank()) {
                try {
                    pdfBytes = java.util.Base64.getDecoder().decode(resumePdfBase64);
                } catch (IllegalArgumentException e) {
                    System.out.println("Invalid base64 PDF: " + e.getMessage());
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Invalid PDF format"));
                }
            }

            // Update the existing profile with new data using the dedicated method
            JsonData updated = chatBotService.updateResumeForEmail(json, email, pdfBytes);

            Map<String, Object> profile = new HashMap<>();
            profile.put("id", updated.getId());
            profile.put("email", updated.getEmail());
            profile.put("name", updated.getName());
            profile.put("year", updated.getYear());
            profile.put("department", updated.getDepartment());
            profile.put("institution", updated.getInstitution());
            profile.put("availability", updated.getAvailability());
            // Return PDF download URL instead of base64
            if (updated.getResumePdf() != null) {
                profile.put("resumePdfUrl", "/api/resume/download/" + updated.getId());
            }

            // Send updated resume to Django ML service
            try {
                chatBotService.sendResumeJson(updated);
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of(
                    "message", "Resume updated successfully",
                    "profile", profile
            ));
        } catch (ProfileNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Profile not found. Please upload a resume first."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to update resume"));
        }
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<?> getUserProfileById(@PathVariable Long id) {
        try {
            var profile = chatBotService.getUserProfileById(id);
            if (profile == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User not found"));
            }
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied"));
        }
    }
}

package sasvar.example.chatbot.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import sasvar.example.chatbot.Database.User;
import sasvar.example.chatbot.Repository.UserRepository;
import sasvar.example.chatbot.Utils.JwtUtils;
import sasvar.example.chatbot.Service.ChatBotService;
import sasvar.example.chatbot.Database.JsonData;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final ChatBotService chatBotService;

    // REVERTED: single JSON register endpoint (no multipart / file handling)
    @PostMapping(path = "/register", consumes = "application/json")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body) {
        try {
            String email = (String) body.getOrDefault("email", "");
            String password = (String) body.getOrDefault("password", "");
            String resumeText = (String) body.getOrDefault("resumeText", body.getOrDefault("resume_text", ""));
            String name = (String) body.getOrDefault("name", null);
            String year = (String) body.getOrDefault("year", null);
            String department = (String) body.getOrDefault("department", null);
            String institution = (String) body.getOrDefault("institution", null);
            String availability = (String) body.getOrDefault("availability", null);

            if (email == null || email.isBlank() || password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email and password required"));
            }

            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "User already exists"));
            }

            if ((resumeText == null || resumeText.isBlank())) {
                return ResponseEntity.badRequest().body(Map.of("message", "resumeText is required"));
            }

            User user = new User();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);

            JsonData savedProfile;
            try {
                String parsedJson = "{}";
                if (resumeText != null && !resumeText.isBlank()) {
                    parsedJson = chatBotService.convertJSON(resumeText);
                }

                // CALL: saveJsonForEmail WITHOUT PDF args (reverted signature)
                savedProfile = chatBotService.saveJsonForEmail(
                        parsedJson,
                        email,
                        name,
                        year,
                        department,
                        institution,
                        availability
                );

            } catch (Exception e) {
                try { userRepository.delete(user); } catch (Exception ignored) {}
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Failed to parse and save resume during registration"));
            }

            try { chatBotService.sendResumeJson(savedProfile); } catch (Exception ignored) {}

            String token = jwtUtils.generateToken(user.getEmail());

            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Registered successfully");
            resp.put("token", token);
            if (savedProfile != null) {
                Map<String, Object> profile = new HashMap<>();
                profile.put("email", savedProfile.getEmail());
                profile.put("name", savedProfile.getName());
                profile.put("year", savedProfile.getYear());
                profile.put("department", savedProfile.getDepartment());
                profile.put("institution", savedProfile.getInstitution());
                profile.put("availability", savedProfile.getAvailability());
                resp.put("profile", profile);
            }

            return ResponseEntity.ok(resp);
        } catch (ClassCastException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid request payload"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {

        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email and password required"));
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "User not found"
                        )
                );

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Password mismatch"
            );
        }

        String token = jwtUtils.generateToken(user.getEmail());

        // fetch profile stored during registration (if any)
        JsonData profile = chatBotService.getProfileByEmail(email);

        Map<String, Object> resp = new HashMap<>();
        resp.put("token", token);
        if (profile != null) {
            // Return only top-level profile fields (exclude profileJson)
            Map<String, Object> profileMap = new HashMap<>();
            profileMap.put("email", profile.getEmail());
            profileMap.put("name", profile.getName());
            profileMap.put("year", profile.getYear());
            profileMap.put("department", profile.getDepartment());
            profileMap.put("institution", profile.getInstitution());
            profileMap.put("availability", profile.getAvailability());
            resp.put("profile", profileMap);
        }

        return ResponseEntity.ok(resp);
    }
}

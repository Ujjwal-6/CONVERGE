package sasvar.example.chatbot.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import sasvar.example.chatbot.Service.ChatBotService;
import sasvar.example.chatbot.DTO.ChatbotRequestDTO;
import sasvar.example.chatbot.DTO.ChatbotResponseDTO;

@RestController
@RequestMapping("/api/parse")
@CrossOrigin
public class ChatBotController {

    @Autowired
    private ChatBotService chatBotService;

    @PostMapping
    public ChatbotResponseDTO parseResume(@RequestBody ChatbotRequestDTO request) {
        try {
            String result = chatBotService.convertJSON(request.getResumeText());
            return new ChatbotResponseDTO(result, true);
        } catch (Exception e) {
            return new ChatbotResponseDTO("Failed to parse resume", false);
        }
    }
}

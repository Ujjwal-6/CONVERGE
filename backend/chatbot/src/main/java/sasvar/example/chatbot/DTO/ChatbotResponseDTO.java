package sasvar.example.chatbot.DTO;

public class ChatbotResponseDTO {
    private String reply;
    private boolean success;

    public ChatbotResponseDTO(String reply, boolean success) {
        this.reply = reply;
        this.success = success;
    }

    public String getReply() {
        return reply;
    }

    public boolean isSuccess() {
        return success;
    }
}

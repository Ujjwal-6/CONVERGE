package sasvar.example.chatbot.Database;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "project_team_request")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTeamRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    // email of the user who initiated the request (project owner)
    @Column(name = "requester_email", nullable = false)
    private String requesterEmail;

    // email of the candidate (must accept)
    @Column(name = "target_email", nullable = false)
    private String targetEmail;

    // PENDING | ACCEPTED | REJECTED
    @Column(name = "status", nullable = false)
    private String status = "PENDING";

    @Column(name = "created_at")
    private String createdAt = Instant.now().toString();

    @Column(name = "updated_at")
    private String updatedAt = Instant.now().toString();
}


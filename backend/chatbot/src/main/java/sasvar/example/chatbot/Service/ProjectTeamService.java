package sasvar.example.chatbot.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import sasvar.example.chatbot.Database.ProjectData;
import sasvar.example.chatbot.Database.ProjectTeam;
import sasvar.example.chatbot.Database.JsonData;
import sasvar.example.chatbot.Repository.ProjectRepository;
import sasvar.example.chatbot.Repository.ProjectTeamRepository;
import sasvar.example.chatbot.Repository.JsonDataRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProjectTeamService {

    @Autowired
    private ProjectTeamRepository projectTeamRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private JsonDataRepository jsonDataRepository;

    // Add teammate: only project owner can add
    public ProjectTeam addTeammate(Long projectId, String memberEmail) {
        // auth
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("User not authenticated");
        }
        String requesterEmail = auth.getName();

        ProjectData project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!requesterEmail.equals(project.getEmail())) {
            throw new RuntimeException("Only project owner can add teammates");
        }

        // prevent duplicates
        if (projectTeamRepository.existsByProjectIdAndMemberEmail(projectId, memberEmail)) {
            throw new RuntimeException("Member already added to project");
        }

        // optionally verify member exists (profile)
        Optional<JsonData> memberProfile = jsonDataRepository.findByEmail(memberEmail);
        if (memberProfile.isEmpty()) {
            throw new RuntimeException("Member profile not found");
        }

        ProjectTeam pt = new ProjectTeam();
        pt.setProjectId(projectId);
        pt.setMemberEmail(memberEmail);
        // addedAt defaults to now
        return projectTeamRepository.save(pt);
    }

    // List teammates with basic profile fields
    public List<Map<String, Object>> listTeammatesForProject(Long projectId) {
        List<ProjectTeam> rows = projectTeamRepository.findAllByProjectId(projectId);
        if (rows == null || rows.isEmpty()) return List.of();

        // For each row, fetch JsonData by email and map to minimal profile
        return rows.stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("email", r.getMemberEmail());
            // try to find profile
            Optional<JsonData> opt = jsonDataRepository.findByEmail(r.getMemberEmail());
            if (opt.isPresent()) {
                JsonData p = opt.get();
                m.put("name", p.getName());
                m.put("year", p.getYear());
                m.put("department", p.getDepartment());
                m.put("institution", p.getInstitution());
                m.put("availability", p.getAvailability());
            } else {
                m.put("name", null);
            }
            m.put("addedAt", r.getAddedAt());
            return m;
        }).collect(Collectors.toList());
    }
}

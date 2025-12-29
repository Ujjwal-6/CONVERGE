import json
from cluster_users import cluster_users

# Load embeddings
with open("user_embeddings.json") as f:
    user_records = json.load(f)

cluster_map, centroids = cluster_users(user_records)

print("\n=== CLUSTER ASSIGNMENTS ===\n")
for user_id, data in cluster_map.items():
    print(user_id, "→", data)
